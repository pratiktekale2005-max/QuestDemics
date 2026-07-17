import re
import math
import httpx
import json
import os
from typing import List, Dict, Any, Tuple
from .client import call_gemini, is_simulation_mode, GEMINI_API_KEY
from .prompts import TUTOR_CHAT_PROMPT, QUIZ_GENERATOR_PROMPT

# In-memory document chunk store
CHUNK_DB: List[Dict[str, Any]] = []

def tokenize(text: str) -> List[str]:
    """Tokenize text into lowercased alphanumeric words."""
    return re.findall(r'\w+', text.lower())

def compute_cosine_similarity(text1: str, text2: str) -> float:
    """Compute basic TF-IDF style overlap cosine similarity between two strings."""
    tokens1 = tokenize(text1)
    tokens2 = tokenize(text2)
    
    if not tokens1 or not tokens2:
        return 0.0
        
    # Get word counts
    vec1 = {}
    for word in tokens1:
        vec1[word] = vec1.get(word, 0) + 1
        
    vec2 = {}
    for word in tokens2:
        vec2[word] = vec2.get(word, 0) + 1
        
    # Calculate dot product
    dot_product = 0.0
    for word, count in vec1.items():
        if word in vec2:
            dot_product += count * vec2[word]
            
    # Calculate magnitudes
    mag1 = math.sqrt(sum(c*c for c in vec1.values()))
    mag2 = math.sqrt(sum(c*c for c in vec2.values()))
    
    if mag1 == 0 or mag2 == 0:
        return 0.0
        
    return dot_product / (mag1 * mag2)

def get_gemini_embedding(text: str) -> List[float]:
    """Retrieves text embeddings from Gemini API if key is available."""
    if is_simulation_mode():
        return []
    try:
        url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent"
        params = {"key": GEMINI_API_KEY}
        headers = {"Content-Type": "application/json"}
        body = {
            "model": "models/text-embedding-004",
            "content": {"parts": [{"text": text}]}
        }
        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, json=body, params=params, headers=headers)
            response.raise_for_status()
            res = response.json()
            return res["embedding"]["values"]
    except Exception:
        return []

def add_document_to_store(filename: str, text: str):
    """Chunks a document and appends it to the in-memory store."""
    # Chunking: split by paragraphs or double newlines, group to ~200-300 words
    raw_chunks = [c.strip() for c in re.split(r'\n\n+', text) if c.strip()]
    
    chunks = []
    current_chunk = []
    current_len = 0
    
    for chunk in raw_chunks:
        words = len(chunk.split())
        if current_len + words > 300:
            chunks.append(" ".join(current_chunk))
            current_chunk = [chunk]
            current_len = words
        else:
            current_chunk.append(chunk)
            current_len += words
            
    if current_chunk:
        chunks.append(" ".join(current_chunk))
        
    for index, chunk_text in enumerate(chunks):
        # Retrieve vector embedding if key is present, else we use TF-IDF fallback
        vector = get_gemini_embedding(chunk_text)
        CHUNK_DB.append({
            "filename": filename,
            "chunk_id": index,
            "text": chunk_text,
            "embedding": vector
        })

def search_tutor_store(query: str, top_k: int = 3) -> str:
    """Searches the vector store and returns concatenated context text."""
    if not CHUNK_DB:
        return "No uploaded documents or notes in context."
        
    query_emb = get_gemini_embedding(query)
    
    scored_chunks: List[Tuple[float, Dict[str, Any]]] = []
    
    for chunk in CHUNK_DB:
        score = 0.0
        # If we successfully obtained embeddings for query and chunk, use dot product
        if query_emb and chunk["embedding"] and len(query_emb) == len(chunk["embedding"]):
            # Cosine similarity for normalized vectors is simple dot product
            score = sum(q * c for q, c in zip(query_emb, chunk["embedding"]))
        else:
            # Fallback to TF-IDF overlap similarity
            score = compute_cosine_similarity(query, chunk["text"])
            
        scored_chunks.append((score, chunk))
        
    # Sort descending
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    
    # Take top K and format
    relevant_texts = []
    for score, chunk in scored_chunks[:top_k]:
        if score > 0.05:  # Relevance threshold
            relevant_texts.append(f"[{chunk['filename']} - Chunk {chunk['chunk_id']}]:\n{chunk['text']}")
            
    if not relevant_texts:
        return "No strongly matching concepts found in uploaded reference documentation."
        
    return "\n\n".join(relevant_texts)

def run_tutor_chat(
    goal: str,
    current_level: str,
    chat_history: str,
    user_message: str
) -> str:
    """Runs a single chat completion with the Tutor Agent, injecting relevant context."""
    # Retrieve relevant context from upload database based on the user's message
    context = search_tutor_store(user_message, top_k=2)
    
    prompt = TUTOR_CHAT_PROMPT.format(
        goal=goal,
        current_level=current_level,
        context=context,
        chat_history=chat_history,
        user_message=user_message
    )
    
    return call_gemini(prompt, json_mode=False)

def generate_quiz(topic: str, difficulty: str) -> Dict[str, Any]:
    """Generates a dynamic quiz structure for the given topic."""
    prompt = QUIZ_GENERATOR_PROMPT.format(topic=topic, difficulty=difficulty)
    response_text = call_gemini(prompt, json_mode=True)
    
    try:
        return json.loads(response_text)
    except Exception:
        # Fallback to a standard simulated quiz in client.py
        from .client import generate_simulated_response
        sim_prompt = f"generate a dynamic quiz for the topic: {topic}"
        return json.loads(generate_simulated_response(sim_prompt))

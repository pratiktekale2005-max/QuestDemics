from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

from ..db import get_session
from ..models import User, ChatMessage, UserGoal
from ..auth_utils import get_current_user
from ..agents.tutor_agent import run_tutor_chat, add_document_to_store, generate_quiz
from .quests import award_xp_and_gold

router = APIRouter()

class ChatPayload(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    id: int
    sender: str
    message: str
    timestamp: datetime

class QuizSubmitPayload(BaseModel):
    topic: str
    score: int  # percentage (0 to 100)
    total_questions: int
    correct_answers: int
    weak_topics: List[str]

@router.post("/chat")
def chat_with_tutor(
    payload: ChatPayload,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # 1. Fetch chat history for the user
    stmt = select(ChatMessage).where(ChatMessage.user_id == current_user.id).order_by(ChatMessage.timestamp).limit(10)
    history_msgs = session.exec(stmt).all()
    
    history_str = ""
    for msg in history_msgs:
        history_str += f"{msg.sender}: {msg.message}\n"
        
    # 2. Save user message
    user_msg = ChatMessage(
        user_id=current_user.id,
        sender="USER",
        message=payload.message
    )
    session.add(user_msg)
    session.commit()
    
    # 3. Get user goal for personalization
    goal_stmt = select(UserGoal).where(UserGoal.user_id == current_user.id)
    goal = session.exec(goal_stmt).first()
    goal_title = goal.goal if goal else "General Knowledge"
    
    # 4. Run tutor agent
    response = run_tutor_chat(
        goal=goal_title,
        current_level=current_user.rank,
        chat_history=history_str,
        user_message=payload.message
    )
    
    # 5. Save system response
    sys_msg = ChatMessage(
        user_id=current_user.id,
        sender="SYSTEM",
        message=response
    )
    session.add(sys_msg)
    session.commit()
    
    return {
        "reply": response,
        "timestamp": datetime.utcnow()
    }

@router.get("/chat/history", response_model=List[ChatMessageResponse])
def get_chat_history(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    stmt = select(ChatMessage).where(ChatMessage.user_id == current_user.id).order_by(ChatMessage.timestamp)
    history = session.exec(stmt).all()
    return history

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    content = await file.read()
    
    try:
        # Decode contents to UTF-8 text
        text = content.decode("utf-8", errors="ignore")
        if not text.strip():
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
            
        add_document_to_store(file.filename, text)
        return {"message": f"Successfully indexed reference file: {file.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@router.get("/quiz")
def get_dynamic_quiz(
    topic: str,
    difficulty: Optional[str] = "Intermediate",
    current_user: User = Depends(get_current_user)
):
    quiz_data = generate_quiz(topic, difficulty)
    return quiz_data

@router.post("/quiz/submit")
def submit_quiz_results(
    payload: QuizSubmitPayload,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # 1. Update user goals with new weaknesses if they score poorly (< 70%)
    if payload.score < 70:
        goal_stmt = select(UserGoal).where(UserGoal.user_id == current_user.id)
        goal = session.exec(goal_stmt).first()
        if goal and payload.weak_topics:
            goal.weakness = ", ".join(payload.weak_topics)
            session.add(goal)
            session.commit()
            
    # 2. Award rewards
    # Pass threshold: 70%
    passed = payload.score >= 70
    xp_earned = 0
    gold_earned = 0
    
    if passed:
        # Base rewards: 100 XP, 50 Gold. Perfect score bonus: +50 Gold.
        xp_earned = 100 + (payload.score - 70) * 2
        gold_earned = 50 + (20 if payload.score == 100 else 0)
    else:
        # Failure rewards: 20 XP for effort
        xp_earned = 20
        gold_earned = 5
        
    progression = award_xp_and_gold(current_user, xp_earned, gold_earned, session)
    
    return {
        "passed": passed,
        "score": payload.score,
        "xp_earned": xp_earned,
        "gold_earned": gold_earned,
        "progression": progression
    }

class ResumePayload(BaseModel):
    resume_text: str

class InterviewPayload(BaseModel):
    message: str
    chat_history: Optional[List[Dict[str, Any]]] = None

@router.post("/coach/resume")
def analyze_resume(payload: ResumePayload, current_user: User = Depends(get_current_user)):
    import json
    from ..agents.client import call_gemini
    from ..agents.prompts import RESUME_COACH_PROMPT
    
    prompt = RESUME_COACH_PROMPT.format(resume_text=payload.resume_text)
    response_text = call_gemini(prompt, json_mode=True)
    
    try:
        data = json.loads(response_text)
        return data
    except Exception:
        from ..agents.client import generate_simulated_response
        sim_resp = generate_simulated_response(prompt)
        return json.loads(sim_resp)

@router.post("/coach/interview")
def run_interview_loop(payload: InterviewPayload, current_user: User = Depends(get_current_user)):
    import json
    from ..agents.client import call_gemini
    from ..agents.prompts import INTERVIEW_COACH_PROMPT
    
    # Form chat history string
    history_str = ""
    if payload.chat_history:
        for msg in payload.chat_history:
            history_str += f"{msg.get('sender', 'USER')}: {msg.get('message', '')}\n"
            
    prompt = INTERVIEW_COACH_PROMPT.format(
        chat_history=history_str,
        message=payload.message
    )
    
    response_text = call_gemini(prompt, json_mode=True)
    
    try:
        data = json.loads(response_text)
        return data
    except Exception:
        from ..agents.client import generate_simulated_response
        sim_resp = generate_simulated_response(prompt)
        return json.loads(sim_resp)

import os
import json
import httpx
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("questdemics.agents")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Set up logging format
logging.basicConfig(level=logging.INFO)

def is_simulation_mode() -> bool:
    return not GEMINI_API_KEY

def call_gemini(prompt: str, json_mode: bool = True) -> str:
    """
    Calls the Gemini 2.5 Flash API to get content.
    If GEMINI_API_KEY is missing, it falls back to the simulation engine.
    """
    if is_simulation_mode():
        logger.warning("GEMINI_API_KEY not found. Operating in SIMULATION MODE.")
        return generate_simulated_response(prompt)
        
    try:
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        params = {"key": GEMINI_API_KEY}
        
        headers = {"Content-Type": "application/json"}
        
        # Prepare the request body
        contents = {"contents": [{"parts": [{"text": prompt}]}]}
        
        if json_mode:
            contents["generationConfig"] = {
                "responseMimeType": "application/json"
            }
            
        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, json=contents, params=params, headers=headers)
            response.raise_for_status()
            
            result_json = response.json()
            # Extract text from Gemini response structure
            text = result_json["candidates"][0]["content"]["parts"][0]["text"]
            return text
    except Exception as e:
        logger.error(f"Gemini API call failed: {str(e)}. Falling back to simulation mode.")
        return generate_simulated_response(prompt)

def generate_simulated_response(prompt: str) -> str:
    """
    Fills in realistic simulated responses for Hackathon demonstration.
    """
    prompt_lower = prompt.lower()
    
    # 1. Onboarding Parser simulation
    if "onboarding response:" in prompt_lower or "parse a hunter's onboarding" in prompt_lower:
        # Try to extract details from prompt text to make mock responsive
        goal = "AI Engineer"
        duration = "180 days"
        hours = 2
        level = "Intermediate"
        career = "Machine Learning Engineer"
        
        if "master" in prompt_lower or "want to" in prompt_lower:
            # Simple keyword extraction
            lines = [line.strip() for line in prompt.split("\n") if line.strip()]
            for line in lines:
                if "aws" in line.lower() or "cloud" in line.lower():
                    goal = "AWS Cloud Solutions"
                    career = "Cloud Architect"
                    level = "Beginner"
                elif "react" in line.lower() or "frontend" in line.lower():
                    goal = "React Frontend Mastery"
                    career = "Frontend Developer"
                elif "python" in line.lower() or "django" in line.lower():
                    goal = "Backend Python Development"
                    career = "Backend Engineer"
                    
        return json.dumps({
            "goal": goal,
            "duration": duration,
            "hours": hours,
            "current_level": level,
            "weakness": "System Architecture",
            "career": career
        })
        
    # 2. Main Quest Generator simulation
    elif "create a complete main quest learning roadmap" in prompt_lower or "generate roadmap" in prompt_lower:
        topic = "AI & ML engineering"
        if "aws" in prompt_lower or "cloud" in prompt_lower or "devops" in prompt_lower:
            topic = "AWS Cloud Architecting"
        elif "react" in prompt_lower or "frontend" in prompt_lower or "fullstack" in prompt_lower:
            topic = "React & Frontend Development"
        elif "security" in prompt_lower:
            topic = "Security"
            
        weeks = []
        if "react" in topic.lower():
            weeks = [
                {
                    "week": 1,
                    "title": "Modern JavaScript & React Basics",
                    "topics": ["ES6+ Features", "React Functional Components", "Props and State", "JSX Syntax"],
                    "videos": ["React Course for Beginners", "JavaScript ES6 Refresher"],
                    "project": "Create a Dynamic Todo application with local storage",
                    "quiz_topics": ["State vs Props", "ES6 Array methods"],
                    "revision": "Review useState hooks and array mappings",
                    "hours": 14,
                    "milestone": "Build basic stateful components"
                },
                {
                    "week": 2,
                    "title": "Hooks & State Management",
                    "topics": ["useEffect lifecycle", "Custom Hooks", "Zustand State Library", "Context API"],
                    "videos": ["Understanding React hooks", "Zustand State Tutorial"],
                    "project": "Build a weather dashboard fetching live weather data",
                    "quiz_topics": ["useEffect cleanups", "Zustand stores"],
                    "revision": "Practice building a custom useFetch hook",
                    "hours": 14,
                    "milestone": "Manage global state using Zustand"
                },
                {
                    "week": 3,
                    "title": "React Routing & Tailwind Styling",
                    "topics": ["React Router DOM setup", "Dynamic Routes", "Tailwind CSS utility classes", "Layout structuring"],
                    "videos": ["React Router v6 Masterclass", "Tailwind CSS Crash Course"],
                    "project": "Create a multi-page portfolio website with smooth navigation",
                    "quiz_topics": ["useParams hook", "Tailwind responsive design"],
                    "revision": "Review path matching and navbar responsive toggles",
                    "hours": 14,
                    "milestone": "Navigate pages seamlessly and style responsiveness"
                },
                {
                    "week": 4,
                    "title": "Final Integration & Project Deployment",
                    "topics": ["Build Optimization", "Vite production configurations", "Vercel / Netlify Deployments", "API integration security"],
                    "videos": ["Vite build configuration", "Deploying React to Vercel"],
                    "project": "Complete and Deploy QuestDemics UI mock with animations",
                    "quiz_topics": ["Production building", "Env file routing"],
                    "revision": "Check standard bundler warnings",
                    "hours": 14,
                    "milestone": "Successfully host a live React application"
                }
            ]
        elif "aws" in topic.lower() or "devops" in topic.lower():
            weeks = [
                {
                    "week": 1,
                    "title": "Introduction to Cloud & IAM",
                    "topics": ["Cloud service models", "IAM Policies", "AWS Users and Roles", "MFA setup"],
                    "videos": ["AWS Core Concepts", "IAM Policies Tutorial"],
                    "project": "Set up a secure AWS account with root billing alerts and admin roles",
                    "quiz_topics": ["IAM Policies", "AWS Shared Responsibility Model"],
                    "revision": "Summarize difference between Users, Groups, and Roles",
                    "hours": 14,
                    "milestone": "Configure basic secure IAM identities"
                },
                {
                    "week": 2,
                    "title": "AWS Compute & Storage Solutions",
                    "topics": ["EC2 Instances types", "S3 Storage Classes", "EBS Volumes", "EC2 Auto Scaling"],
                    "videos": ["Deep Dive into EC2", "Amazon S3 Essentials"],
                    "project": "Launch a web server on EC2 hosting a static webpage stored on S3",
                    "quiz_topics": ["S3 bucket policies", "EC2 key pairs"],
                    "revision": "Review EC2 security groups rules and bucket permissions",
                    "hours": 14,
                    "milestone": "Deploy operational virtual servers with object storage"
                },
                {
                    "week": 3,
                    "title": "VPCs & Cloud Networking",
                    "topics": ["VPC subnets", "Route Tables", "Internet Gateways", "NAT Gateways vs Instances"],
                    "videos": ["AWS Networking Crash Course", "Understanding VPC Subnets"],
                    "project": "Build a secure VPC with public subnet and private subnet containing an database instance",
                    "quiz_topics": ["CIDR blocks", "Public vs Private subnets"],
                    "revision": "Review how traffic flows through Internet Gateway to Private subnet",
                    "hours": 14,
                    "milestone": "Create custom isolated networks with routing rules"
                },
                {
                    "week": 4,
                    "title": "Databases & Serverless Architectures",
                    "topics": ["RDS DB Instances", "DynamoDB NoSQL", "AWS Lambda basics", "API Gateway"],
                    "videos": ["AWS RDS vs DynamoDB", "Introduction to AWS Lambda"],
                    "project": "Build a serverless REST API using API Gateway, Lambda, and DynamoDB",
                    "quiz_topics": ["Lambda triggers", "DynamoDB partition keys"],
                    "revision": "Review execution roles and API Gateway endpoints mapping",
                    "hours": 14,
                    "milestone": "Deploy a serverless microservice architecture"
                }
            ]
        elif "security" in topic.lower():
            weeks = [
                {
                    "week": 1,
                    "title": "Network Security & Cryptography",
                    "topics": ["Symmetric/Asymmetric encryption", "Hashing (SHA-256)", "TLS handshake", "Wireshark traffic analysis"],
                    "videos": ["Cryptography Basics", "Wireshark Tutorial"],
                    "project": "Encrypt and decrypt file communications using RSA in Python",
                    "quiz_topics": ["RSA algorithms", "TLS handshakes"],
                    "revision": "Review diff between public and private keys",
                    "hours": 14,
                    "milestone": "Secure local communication links"
                },
                {
                    "week": 2,
                    "title": "Web Application Security (OWASP Top 10)",
                    "topics": ["SQL Injection", "Cross-Site Scripting (XSS)", "CSRF prevention", "Broken Authentication"],
                    "videos": ["OWASP Top 10 Explained", "Web Security Hands-on"],
                    "project": "Exploit and patch a deliberately vulnerable Flask login portal",
                    "quiz_topics": ["SQLi escaping", "Content Security Policies"],
                    "revision": "Review input sanitation and prepared statements",
                    "hours": 14,
                    "milestone": "Sanitize inputs and mitigate common web vulnerabilities"
                },
                {
                    "week": 3,
                    "title": "Authentication Systems & JWT",
                    "topics": ["OAuth2 flow", "JWT token structures", "Token signature validation", "Bcrypt password hashing"],
                    "videos": ["OAuth2 and JWT Guide", "Password Hashing Best Practices"],
                    "project": "Construct a secure JWT token issuer with signature verification in FastAPI",
                    "quiz_topics": ["JWT claims", "Signature validation"],
                    "revision": "Review token payload hashing and key size guidelines",
                    "hours": 14,
                    "milestone": "Build state-of-the-art token validation microservices"
                },
                {
                    "week": 4,
                    "title": "Penetration Testing & Auditing",
                    "topics": ["Port scanning", "Vulnerability scanners", "Security audit checklists", "Docker containment safeguards"],
                    "videos": ["Penetration Testing basics", "System Auditing Standards"],
                    "project": "Conduct a full security review audit of the QuestDemics API endpoints",
                    "quiz_topics": ["Port analysis", "System privilege escalation"],
                    "revision": "Review container execution privileges and env files safety",
                    "hours": 14,
                    "milestone": "Conquer penetration testing and system compliance reviews"
                }
            ]
        else: # Default: AI / ML
            weeks = [
                {
                    "week": 1,
                    "title": "Python & Data Science Foundations",
                    "topics": ["Python OOP", "NumPy Arrays", "Pandas DataFrames", "Data Wrangling"],
                    "videos": ["Python for Data Science", "Pandas Complete Tutorial"],
                    "project": "Clean and preprocess a raw housing dataset from Kaggle",
                    "quiz_topics": ["Pandas groupbys", "NumPy matrix broadcasting"],
                    "revision": "Review indexing and slicing in Pandas",
                    "hours": 14,
                    "milestone": "Perform basic data cleaning pipelines"
                },
                {
                    "week": 2,
                    "title": "Supervised Machine Learning",
                    "topics": ["Linear & Logistic Regression", "Decision Trees", "Scikit-Learn API", "Model Evaluation Metrics"],
                    "videos": ["Machine Learning Basics", "Scikit-Learn Crash Course"],
                    "project": "Train a model to predict housing prices using Regression",
                    "quiz_topics": ["Overfitting vs Underfitting", "R-squared vs MSE"],
                    "revision": "Review train-test splitting and cross-validation",
                    "hours": 14,
                    "milestone": "Evaluate models using MSE and F1-Score"
                },
                {
                    "week": 3,
                    "title": "Neural Networks & Deep Learning",
                    "topics": ["Perceptron logic", "Backpropagation", "PyTorch Framework basics", "Dense Layers"],
                    "videos": ["Neural Networks Demystified", "PyTorch 101 Tutorial"],
                    "project": "Build and train a simple neural network to classify handwritten digits (MNIST)",
                    "quiz_topics": ["Activation Functions", "Loss Functions"],
                    "revision": "Review optimizer logic and gradient descent steps",
                    "hours": 14,
                    "milestone": "Train neural network models using PyTorch"
                },
                {
                    "week": 4,
                    "title": "Generative AI & LLM Fine-Tuning",
                    "topics": ["Transformer architectures", "Attention mechanisms", "Gemini API integrations", "RAG architectures"],
                    "videos": ["How Transformers Work", "RAG with Vector Databases"],
                    "project": "Build a PDF Q&A Tutor using LangChain and Gemini API",
                    "quiz_topics": ["Attention heads", "Vector embeddings"],
                    "revision": "Review RAG retriever queries and system prompt structures",
                    "hours": 14,
                    "milestone": "Deploy a complete functional RAG application"
                }
            ]
            
        return json.dumps({"weeks": weeks})
        
    # 3. Daily Quest simulation
    elif "generate a list of 3 daily quests" in prompt_lower or "daily quest" in prompt_lower:
        topic = "Current Topic"
        if "vpc" in prompt_lower or "networking" in prompt_lower:
            topic = "AWS Networking (VPCs)"
        elif "react" in prompt_lower:
            topic = "React hooks (useState)"
            
        return json.dumps({
            "quests": [
                {
                    "title": f"Review {topic}",
                    "description": f"Spend 15 minutes reviewing the core concepts of {topic}. Summarize the top 3 principles.",
                    "type": "READING",
                    "xp_reward": 50,
                    "gold_reward": 20,
                    "content": {
                        "summary": f"This reading quest focuses on the foundational rules of {topic}. It covers core blocks, architecture design, and critical trade-offs in implementation.",
                        "link": "https://example.com/learn-more"
                    }
                },
                {
                    "title": f"{topic} Mastery Quiz",
                    "description": "Complete a 3-question mini-quiz to locking in today's knowledge and test your understanding.",
                    "type": "QUIZ",
                    "xp_reward": 100,
                    "gold_reward": 40,
                    "content": {
                        "questions": [
                            {
                                "id": 1,
                                "type": "MCQ",
                                "question": f"Which of the following is a primary design pattern in {topic}?",
                                "options": ["Modular separation", "Monolithic coupling", "State bypass", "Direct global mutations"],
                                "answer": "Modular separation",
                                "explanation": "Separation of concerns allows easier debugging, better scalability, and cleaner code maintenance."
                            },
                            {
                                "id": 2,
                                "type": "TRUE_FALSE",
                                "question": f"True or False: Incorrect configurations in {topic} can introduce critical security risks.",
                                "options": ["True", "False"],
                                "answer": "True",
                                "explanation": "Security must be configured at every layer to prevent unauthorized access or leakage."
                            },
                            {
                                "id": 3,
                                "type": "MCQ",
                                "question": f"What is the recommended approach to handle scaling in {topic}?",
                                "options": ["Vertical sizing only", "Horizontal autoscaling", "Manual configuration", "Hardcoded parameters"],
                                "answer": "Horizontal autoscaling",
                                "explanation": "Autoscaling dynamically adapts infrastructure to demand, keeping cost low and availability high."
                            }
                        ]
                    }
                },
                {
                    "title": f"Practice Arena: {topic}",
                    "description": "Write a short piece of code or design a layout implementation to demonstrate functional comprehension.",
                    "type": "CODING",
                    "xp_reward": 150,
                    "gold_reward": 60,
                    "content": {
                        "prompt": f"Write a small pseudocode or function demonstrating how you would initialize a secure environment or component for {topic}."
                    }
                }
            ]
        })
        
    # 4. Quiz Generator simulation
    elif "generate a dynamic quiz" in prompt_lower:
        topic_match = "Topic"
        if "topic: " in prompt_lower:
            topic_match = prompt.split("topic: ")[1].split("\n")[0].strip()
            
        return json.dumps({
            "questions": [
                {
                    "id": 1,
                    "type": "MCQ",
                    "question": f"What is the main benefit of applying {topic_match} in production architectures?",
                    "options": ["Increased single-core bottlenecks", "Enhanced fault tolerance and speed", "Eliminating database schemas", "Reduced control structures"],
                    "answer": "Enhanced fault tolerance and speed",
                    "explanation": f"{topic_match} enables reliable performance, load distribution, and failure recovery in enterprise setups."
                },
                {
                    "id": 2,
                    "type": "TRUE_FALSE",
                    "question": f"True or False: {topic_match} works the same way in local environments as in large-scale serverless systems.",
                    "options": ["True", "False"],
                    "answer": "False",
                    "explanation": "Scale changes latency characteristics, networking rules, and shared state architectures significantly."
                },
                {
                    "id": 3,
                    "type": "SCENARIO",
                    "question": f"A production system using {topic_match} is experiencing high latency. Which metric do you inspect first?",
                    "options": ["Memory leaks", "CPU utilization metrics", "Network I/O bottleneck and queue lengths", "Source code file size"],
                    "answer": "Network I/O bottleneck and queue lengths",
                    "explanation": "High latency is most commonly caused by network constraints, blocking I/O calls, or over-queued resources."
                },
                {
                    "id": 4,
                    "type": "CODING_CHALLENGE",
                    "question": f"Implement a basic function to validate input parameters for a {topic_match} connection wrapper.",
                    "options": [],
                    "answer": "def validate(params):\n    return all(k in params for k in ['id', 'host', 'port'])",
                    "explanation": "Validating credentials and config presence ensures clean runtime startups and prevents connection failure loops."
                }
            ]
        })
        
    # 5. Boss Battle simulation
    elif "generate a boss battle" in prompt_lower:
        return json.dumps({
            "title": "The Gatekeeper of Architecture: Production REST API",
            "description": "You face a high-stakes challenge. You must construct a production-ready, fully validated REST API with JWT Auth, SQLite Database connections, and error handling middleware.",
            "requirements": [
                "Create a database schema with User and Item tables (SQLModel/SQLAlchemy)",
                "Secure endpoints with OAuth2 Password Bearer authentication",
                "Implement validation schemas using Pydantic",
                "Write testing endpoints to seed and verify database entries"
            ],
            "duration_minutes": 90,
            "xp_reward": 3000,
            "gold_reward": 1000,
            "evaluation_criteria": [
                "Correctness of SQLAlchemy relational relationships",
                "Strict password hashing and JWT token expiration checks",
                "Middleware or decorator-based exception handlers"
            ]
        })
        
    # 6. Boss Evaluator simulation
    elif "evaluate a hunter's submitted solution" in prompt_lower:
        return json.dumps({
            "score": 85,
            "passed": True,
            "feedback": "Outstanding work! You successfully established relational database connections and secured your routes using JWT auth. The schemas are strictly validated with Pydantic. To reach S-Rank perfection, consider adding unit test coverage and modularizing the router endpoints into separate files.",
            "weak_concepts": ["Unit Testing", "Modular Router Organization"]
        })
        
    # 7. Tutor Chat simulation
    elif "primary tutor agent for questdemics" in prompt_lower:
        return "Hunter, I have analyzed your request. You have queried the System regarding your current skill progression. Remember, mastery is not a sprint, but an ongoing quest. What concept shall we break down today? (System stands ready to generate flashcards or explain mistakes)"
        
    # 8. Resume Coach simulation
    elif "system career coach" in prompt_lower:
        return json.dumps({
            "critique": "### Critique\n* **Quantifiable Metrics:** Most bullet points list responsibilities rather than achievements. Use the Google X-Y-Z formula.\n* **Formatting:** Group technologies under specific headers.\n* **ATS Optimization:** Missing cloud/networking keywords.",
            "projects": [
                {
                    "title": "High-Throughput Log Streaming Agent",
                    "description": "Construct a background daemon in Go/Python that tails log files, processes them, and streams structured JSON data to a central search engine."
                },
                {
                    "title": "OAuth2 Auth Server & Gateway",
                    "description": "Develop a standalone authentication service issuing custom JWT credentials with token auto-rotation and rate-limiting."
                }
            ],
            "salary_stats": {
                "average": "$118,000",
                "range": "$90,000 - $160,000"
            }
        })

    # 9. Interview Coach simulation
    elif "system interviewer. you are conducting" in prompt_lower:
        # Check if the user is just starting
        if "start" in prompt_lower or len(prompt_lower.split("latest message:")) <= 1 or prompt_lower.split("latest message:")[1].strip() == "":
            return json.dumps({
                "feedback": "",
                "next_question": "Describe a time when you had to debug a complex production performance issue. What was your approach, and how did you resolve it?"
            })
        else:
            return json.dumps({
                "feedback": "Your response highlights good isolation skills, but could benefit from explaining how you measured the CPU/memory impact of the bug (e.g. using profiling tools).",
                "next_question": "Next question: How would you design a caching strategy for a high-read API endpoint that has frequent small updates?"
            })

    return "The System has processed your request. Proceed, Hunter."

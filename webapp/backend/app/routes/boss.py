from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime, timedelta
import json

from ..db import get_session
from ..models import User, Quest, UserGoal
from ..auth_utils import get_current_user
from ..agents.evaluation_agent import generate_boss_battle, evaluate_boss_submission
from .quests import award_xp_and_gold

router = APIRouter()

class BossSubmissionPayload(BaseModel):
    quest_id: int
    solution_code: str

@router.get("/challenge")
def get_boss_challenge(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Check if user has initialized goals
    goal_stmt = select(UserGoal).where(UserGoal.user_id == current_user.id)
    goal = session.exec(goal_stmt).first()
    if not goal:
        raise HTTPException(status_code=400, detail="Initialize system onboarding first before launching Boss Battles")
        
    # Check if there is an active or completed boss battle
    statement = select(Quest).where(
        Quest.user_id == current_user.id
    ).where(
        Quest.type == "BOSS"
    )
    existing_boss_quest = session.exec(statement).first()
    
    # If already exists and is active, return it
    if existing_boss_quest:
        return {
            "id": existing_boss_quest.id,
            "title": existing_boss_quest.title,
            "description": existing_boss_quest.description,
            "status": existing_boss_quest.status,
            "xp_reward": existing_boss_quest.xp_reward,
            "gold_reward": existing_boss_quest.gold_reward,
            "due_date": existing_boss_quest.due_date,
            "content": existing_boss_quest.get_content()
        }
        
    # Otherwise generate a brand new Boss Battle challenge!
    # Count how many main quests have been completed
    milestones_stmt = select(Quest).where(
        Quest.user_id == current_user.id
    ).where(
        Quest.type == "MAIN"
    ).where(
        Quest.status == "COMPLETED"
    )
    completed_milestones = len(session.exec(milestones_stmt).all())
    
    target_class = "Novice Master"
    if current_user.level >= 50:
        target_class = "S-Rank Grandmaster"
    elif current_user.level >= 30:
        target_class = "Professional Architect"
    elif current_user.level >= 15:
        target_class = "Intermediate Specialist"
        
    boss_spec = generate_boss_battle(
        goal=goal.goal,
        milestones_completed=completed_milestones,
        target_class=target_class
    )
    
    due = datetime.utcnow() + timedelta(minutes=90) # 90 minutes limit
    
    new_boss = Quest(
        user_id=current_user.id,
        title=boss_spec.get("title", "The Gatekeeper Challenge"),
        description=boss_spec.get("description", "Deploy a production-grade application"),
        type="BOSS",
        xp_reward=boss_spec.get("xp_reward", 3000),
        gold_reward=boss_spec.get("gold_reward", 1000),
        status="ACTIVE",
        due_date=due
    )
    new_boss.set_content(boss_spec)
    
    session.add(new_boss)
    session.commit()
    session.refresh(new_boss)
    
    return {
        "id": new_boss.id,
        "title": new_boss.title,
        "description": new_boss.description,
        "status": new_boss.status,
        "xp_reward": new_boss.xp_reward,
        "gold_reward": new_boss.gold_reward,
        "due_date": new_boss.due_date,
        "content": new_boss.get_content()
    }

@router.post("/submit")
def submit_boss_battle(
    payload: BossSubmissionPayload,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    stmt = select(Quest).where(
        Quest.id == payload.quest_id
    ).where(
        Quest.user_id == current_user.id
    ).where(
        Quest.type == "BOSS"
    )
    boss_quest = session.exec(stmt).first()
    
    if not boss_quest:
        raise HTTPException(status_code=404, detail="Boss Battle quest not found")
        
    if boss_quest.status == "COMPLETED":
        return {"message": "Boss Battle already conquered!", "score": 100, "passed": True}
        
    # Evaluate submission using AI Agent
    boss_spec = boss_quest.content_json
    eval_result = evaluate_boss_submission(
        boss_battle_spec=boss_spec,
        user_submission=payload.solution_code
    )
    
    passed = eval_result.get("passed", False)
    score = eval_result.get("score", 0)
    
    # Update quest status and completed timestamp
    boss_quest.status = "COMPLETED" if passed else "FAILED"
    boss_quest.completed_at = datetime.utcnow()
    
    # Update content json with user code and AI evaluation feedback
    existing_content = boss_quest.get_content()
    existing_content["user_submission"] = payload.solution_code
    existing_content["evaluation"] = eval_result
    boss_quest.set_content(existing_content)
    session.add(boss_quest)
    
    # Award massive rewards if passed
    xp_gained = boss_quest.xp_reward if passed else 100 # small consolation XP
    gold_gained = boss_quest.gold_reward if passed else 20
    
    progression = award_xp_and_gold(current_user, xp_gained, gold_gained, session)
    
    # Add new weaknesses found to goals
    if eval_result.get("weak_concepts"):
        goal_stmt = select(UserGoal).where(UserGoal.user_id == current_user.id)
        goal = session.exec(goal_stmt).first()
        if goal:
            goal.weakness = ", ".join(eval_result["weak_concepts"])
            session.add(goal)
            
    # Trigger notifications
    from .auth import create_notification
    if passed:
        create_notification(
            user_id=current_user.id,
            message=f"Epic Battle Conquered! '{boss_quest.title}' defeated. +{xp_gained} XP, +{gold_gained} Gold.",
            notification_type="SUCCESS",
            session=session
        )
    else:
        create_notification(
            user_id=current_user.id,
            message=f"Battle Failed! You were defeated by '{boss_quest.title}'. +20 XP, +5 Gold.",
            notification_type="WARNING",
            session=session
        )

    # Handle Job Change Awakening
    if passed and existing_content.get("is_job_change"):
        target_class = existing_content.get("target_class")
        current_user.class_name = target_class
        session.add(current_user)
        
        create_notification(
            user_id=current_user.id,
            message=f"Class Awakening Complete! You have transitioned to: {target_class}.",
            notification_type="SUCCESS",
            session=session
        )
        
        goal_stmt = select(UserGoal).where(UserGoal.user_id == current_user.id)
        goal = session.exec(goal_stmt).first()
        if goal:
            goal.career_interest = target_class
            session.add(goal)
            
            # Regenerate locked Main Quests
            locked_stmt = select(Quest).where(Quest.user_id == current_user.id).where(Quest.type == "MAIN").where(Quest.status == "LOCKED")
            locked_quests = session.exec(locked_stmt).all()
            if locked_quests:
                from ..agents.quest_agent import generate_main_quest
                new_weeks = generate_main_quest(
                    goal=goal.goal,
                    duration=goal.duration,
                    hours=goal.hours_per_day,
                    current_level="Intermediate",
                    career=target_class
                )
                if not new_weeks:
                    from ..agents.client import generate_simulated_response
                    sim_prompt = f"generate roadmap for {goal.goal} with career target {target_class}"
                    new_weeks = json.loads(generate_simulated_response(sim_prompt)).get("weeks", [])
                
                for lq in locked_quests:
                    matching_week = next((w for w in new_weeks if w.get("week") == lq.week_number), None)
                    if not matching_week and len(new_weeks) >= lq.week_number:
                        matching_week = new_weeks[lq.week_number - 1]
                    
                    if matching_week:
                        lq.title = matching_week.get("title", lq.title)
                        lq.description = matching_week.get("project", lq.description)
                        lq.set_content(matching_week)
                        session.add(lq)

    session.commit()
    session.refresh(boss_quest)
    
    return {
        "message": "Boss Battle evaluated successfully",
        "passed": passed,
        "score": score,
        "feedback": eval_result.get("feedback", "No feedback available"),
        "xp_earned": xp_gained,
        "gold_earned": gold_gained,
        "progression": progression
    }

class JobChangePayload(BaseModel):
    class_choice: str

@router.get("/job-change/choices")
def get_job_change_choices(current_user: User = Depends(get_current_user)):
    if current_user.level < 5:
        raise HTTPException(status_code=400, detail="You must reach Level 5 to unlock Career Class choices.")
    return [
        {
            "class_name": "Machine Learning Engineer",
            "description": "Master data processing, model training, neural networks, and deploying LLM applications.",
            "difficulty": "Hard"
        },
        {
            "class_name": "DevOps Engineer",
            "description": "Master cloud networking, secure IAM identities, compute structures, and serverless architectures.",
            "difficulty": "Hard"
        },
        {
            "class_name": "Fullstack Web Developer",
            "description": "Master React functional components, custom hooks, global state, router paths, and Vite configs.",
            "difficulty": "Medium"
        },
        {
            "class_name": "Security Specialist",
            "description": "Master penetration testing, JWT authentication pipelines, password hashing, and API gateway filters.",
            "difficulty": "Hard"
        }
    ]

@router.post("/job-change/challenge")
def start_job_change_challenge(
    payload: JobChangePayload,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.level < 5:
        raise HTTPException(status_code=400, detail="You must reach Level 5 to trigger a Job Change.")
        
    # Check if there is an active Job Change Quest or active Boss Battle
    stmt = select(Quest).where(Quest.user_id == current_user.id).where(Quest.type == "BOSS").where(Quest.status == "ACTIVE")
    active_boss = session.exec(stmt).first()
    if active_boss:
        return {
            "id": active_boss.id,
            "title": active_boss.title,
            "description": active_boss.description,
            "status": active_boss.status,
            "xp_reward": active_boss.xp_reward,
            "gold_reward": active_boss.gold_reward,
            "due_date": active_boss.due_date,
            "content": active_boss.get_content()
        }
        
    goal_stmt = select(UserGoal).where(UserGoal.user_id == current_user.id)
    goal = session.exec(goal_stmt).first()
    goal_str = goal.goal if goal else f"Mastery of {payload.class_choice}"
    
    boss_spec = generate_boss_battle(
        goal=goal_str,
        milestones_completed=5,
        target_class=payload.class_choice
    )
    
    due = datetime.utcnow() + timedelta(minutes=90)
    
    new_boss = Quest(
        user_id=current_user.id,
        title=f"Class Awakening: {payload.class_choice}",
        description=f"Hunter, complete this trial to change your class to {payload.class_choice}.",
        type="BOSS",
        xp_reward=3500,
        gold_reward=1200,
        status="ACTIVE",
        due_date=due
    )
    
    # Mark it as a job change challenge in content!
    content_data = boss_spec
    content_data["is_job_change"] = True
    content_data["target_class"] = payload.class_choice
    new_boss.set_content(content_data)
    
    session.add(new_boss)
    session.commit()
    session.refresh(new_boss)
    
    return {
        "id": new_boss.id,
        "title": new_boss.title,
        "description": new_boss.description,
        "status": new_boss.status,
        "xp_reward": new_boss.xp_reward,
        "gold_reward": new_boss.gold_reward,
        "due_date": new_boss.due_date,
        "content": new_boss.get_content()
    }

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timedelta
from pydantic import BaseModel

from ..db import get_session
from ..models import User, StudySession
from ..auth_utils import get_current_user
from .quests import award_xp_and_gold

router = APIRouter()

class StudySessionPayload(BaseModel):
    duration_minutes: int
    distractions: int
    focus_score: int

@router.post("/session")
def log_study_session(
    payload: StudySessionPayload,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # 1. Anti-Burnout / Fatigue Check
    # Check total study minutes today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    stmt = select(StudySession).where(
        StudySession.user_id == current_user.id
    ).where(
        StudySession.created_at >= today_start
    )
    today_sessions = session.exec(stmt).all()
    total_minutes_today = sum(s.duration_minutes for s in today_sessions) + payload.duration_minutes
    
    fatigue_lock = False
    if total_minutes_today > 360:  # 6 hours
        fatigue_lock = True
        from .auth import create_notification
        create_notification(
            user_id=current_user.id,
            message="Fatigue Warning: You have exceeded 6 hours of focus time today. Anti-Burnout Lockout engaged. Take a rest, Hunter!",
            notification_type="WARNING",
            session=session
        )
    else:
        from .auth import create_notification
        create_notification(
            user_id=current_user.id,
            message=f"Focus Session Logged: {payload.duration_minutes} minutes of deep work completed.",
            notification_type="INFO",
            session=session
        )
        
    # 2. Save Study Session
    study_s = StudySession(
        user_id=current_user.id,
        duration_minutes=payload.duration_minutes,
        distractions=payload.distractions,
        focus_score=payload.focus_score
    )
    session.add(study_s)
    session.commit()
    
    # 3. Calculate XP rewards
    # Base XP: 8 XP per minute studied
    base_xp = payload.duration_minutes * 8
    # Focus multiplier: focus_score / 100
    focus_mult = payload.focus_score / 100.0
    xp_reward = int(base_xp * focus_mult)
    
    # Gold reward: 2 Gold per minute studied
    gold_reward = payload.duration_minutes * 2
    
    progression = award_xp_and_gold(current_user, xp_reward, gold_reward, session)
    
    return {
        "message": "Study session logged successfully",
        "xp_earned": xp_reward,
        "gold_earned": gold_reward,
        "progression": progression,
        "fatigue_lock": fatigue_lock,
        "total_minutes_today": total_minutes_today
    }

@router.get("/summary")
def get_study_summary(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    stmt = select(StudySession).where(StudySession.user_id == current_user.id)
    sessions = session.exec(stmt).all()
    
    total_minutes = sum(s.duration_minutes for s in sessions)
    avg_focus = sum(s.focus_score for s in sessions) / len(sessions) if sessions else 0
    total_distractions = sum(s.distractions for s in sessions)
    
    # Weekly heatmap aggregation (last 7 days)
    heatmap = {}
    now = datetime.utcnow()
    for i in range(7):
        date_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        heatmap[date_str] = 0
        
    for s in sessions:
        date_str = s.created_at.strftime("%Y-%m-%d")
        if date_str in heatmap:
            heatmap[date_str] += s.duration_minutes
            
    return {
        "total_sessions": len(sessions),
        "total_minutes": total_minutes,
        "avg_focus": round(avg_focus, 1),
        "total_distractions": total_distractions,
        "heatmap": [{"date": k, "minutes": v} for k, v in heatmap.items()]
    }

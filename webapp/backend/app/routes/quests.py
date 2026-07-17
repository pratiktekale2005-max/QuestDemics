from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import json

from ..db import get_session
from ..models import User, UserGoal, Quest, ShopItem, UserPurchase, Notification
from ..auth_utils import get_current_user
from ..agents.intent_agent import parse_onboarding
from ..agents.quest_agent import generate_main_quest, generate_daily_quests

router = APIRouter()

class OnboardingPayload(BaseModel):
    answers_text: str

class QuestResponse(BaseModel):
    id: int
    title: str
    description: str
    type: str
    xp_reward: int
    gold_reward: int
    status: str
    due_date: datetime
    week_number: Optional[int]
    content: Dict[str, Any]

def award_xp_and_gold(user: User, xp_gain: int, gold_gain: int, session: Session) -> Dict[str, Any]:
    """Helper to award XP and Gold, calculate level ups, and adjust Ranks."""
    user.xp += xp_gain
    user.gold += gold_gain
    
    level_up = False
    old_level = user.level
    old_rank = user.rank
    
    # Simple RPG level calculation: Level N requires N * 1000 XP
    while user.xp >= (user.level * 1000):
        user.xp -= (user.level * 1000)
        user.level += 1
        level_up = True
        
    # Recalculate Rank based on Level
    # E Rank: Lvl 1-4, D Rank: Lvl 5-14, C Rank: Lvl 15-29, B Rank: Lvl 30-49, A Rank: Lvl 50-79, S Rank: Lvl 80+
    if user.level >= 80:
        user.rank = "S Rank"
    elif user.level >= 50:
        user.rank = "A Rank"
    elif user.level >= 30:
        user.rank = "B Rank"
    elif user.level >= 15:
        user.rank = "C Rank"
    elif user.level >= 5:
        user.rank = "D Rank"
    else:
        user.rank = "E Rank"
        
    session.add(user)
    session.commit()
    session.refresh(user)
    
    from .auth import create_notification
    if level_up:
        create_notification(
            user_id=user.id,
            message=f"Level Up! You reached Level {user.level}.",
            notification_type="LEVEL_UP",
            session=session
        )
    if user.rank != old_rank:
        create_notification(
            user_id=user.id,
            message=f"Rank Promotion! You have been promoted to {user.rank}.",
            notification_type="SUCCESS",
            session=session
        )
    
    return {
        "xp": user.xp,
        "gold": user.gold,
        "level": user.level,
        "rank": user.rank,
        "level_up": level_up,
        "old_level": old_level
    }

@router.post("/initialize")
def initialize_system(payload: OnboardingPayload, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # 1. Parse onboarding with AI
    parsed_profile = parse_onboarding(payload.answers_text)
    
    # 2. Save user goal
    user_goal = UserGoal(
        user_id=current_user.id,
        goal=parsed_profile.get("goal", "Developer Mastery"),
        duration=parsed_profile.get("duration", "90 days"),
        hours_per_day=parsed_profile.get("hours", 2),
        current_level=parsed_profile.get("current_level", "Beginner"),
        career_interest=parsed_profile.get("career", "Software Engineer"),
        weakness=parsed_profile.get("weakness", "Unknown")
    )
    session.add(user_goal)
    session.commit()
    
    # 3. Generate Main Quest weeks using Quest Agent
    weeks_list = generate_main_quest(
        goal=user_goal.goal,
        duration=user_goal.duration,
        hours=user_goal.hours_per_day,
        current_level=user_goal.current_level,
        career=user_goal.career_interest
    )
    
    # If agent returned empty, construct basic default roadmap
    if not weeks_list:
        from ..agents.client import generate_simulated_response
        sim_prompt = f"generate roadmap for {user_goal.goal}"
        weeks_list = json.loads(generate_simulated_response(sim_prompt)).get("weeks", [])
        
    # Delete any existing quests
    statement = select(Quest).where(Quest.user_id == current_user.id)
    existing_quests = session.exec(statement).all()
    for eq in existing_quests:
        session.delete(eq)
    session.commit()
        
    # Save the generated weeks as MAIN quests in DB
    saved_quests = []
    for week_idx, week in enumerate(weeks_list):
        # Week 1 starts as ACTIVE, others start as LOCKED
        status_str = "ACTIVE" if week_idx == 0 else "LOCKED"
        due = datetime.utcnow() + timedelta(days=(week_idx + 1) * 7)
        
        main_q = Quest(
            user_id=current_user.id,
            title=week.get("title", f"Week {week.get('week')} Milestone"),
            description=week.get("project", "Complete this week's assignments"),
            type="MAIN",
            xp_reward=1000,
            gold_reward=400,
            status=status_str,
            due_date=due,
            week_number=week.get("week", week_idx + 1)
        )
        main_q.set_content(week)
        session.add(main_q)
        saved_quests.append(main_q)
        
    session.commit()
    
    # Initialize daily quests immediately
    trigger_daily_generation(current_user, user_goal, weeks_list[0].get("title", "Foundations"), session)
    
    return {"message": "System Initialized", "goal": user_goal}

def trigger_daily_generation(user: User, goal: UserGoal, week_title: str, session: Session) -> List[Quest]:
    """Internal helper to generate daily quests."""
    daily_list = generate_daily_quests(
        goal=goal.goal,
        current_week_title=week_title,
        current_level=goal.current_level,
        weak_topics=goal.weakness
    )
    
    # If empty, generate fallback
    if not daily_list:
        from ..agents.client import generate_simulated_response
        sim_prompt = f"generate a list of 3 daily quests for {goal.goal}"
        daily_list = json.loads(generate_simulated_response(sim_prompt)).get("quests", [])
        
    saved_dailies = []
    for d in daily_list:
        due = datetime.utcnow().replace(hour=23, minute=59, second=59, microsecond=999999)
        q = Quest(
            user_id=user.id,
            title=d.get("title", "Daily Practice"),
            description=d.get("description", "Solve daily exercises"),
            type="DAILY",
            xp_reward=d.get("xp_reward", 100),
            gold_reward=d.get("gold_reward", 50),
            status="ACTIVE",
            due_date=due,
            week_number=1
        )
        q.set_content(d.get("content", {}))
        session.add(q)
        saved_dailies.append(q)
        
    session.commit()
    return saved_dailies

@router.get("/roadmap")
def get_roadmap(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(Quest).where(Quest.user_id == current_user.id).where(Quest.type == "MAIN").order_by(Quest.week_number)
    quests = session.exec(statement).all()
    
    result = []
    for q in quests:
        result.append({
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "status": q.status,
            "week_number": q.week_number,
            "xp_reward": q.xp_reward,
            "gold_reward": q.gold_reward,
            "content": q.get_content()
        })
    return result

@router.get("/daily", response_model=List[QuestResponse])
def get_daily(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # Find user goals
    goal_stmt = select(UserGoal).where(UserGoal.user_id == current_user.id)
    goal = session.exec(goal_stmt).first()
    if not goal:
        return []
        
    # Check if we already have daily quests for today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    statement = select(Quest).where(
        Quest.user_id == current_user.id
    ).where(
        Quest.type.in_(["DAILY", "RECOVERY"])
    ).where(
        Quest.created_at >= today_start
    )
    
    active_quests = session.exec(statement).all()
    
    # If no daily/recovery quests exist for today, check if yesterday's dailies were missed
    if not active_quests:
        # Check if there are uncompleted active quests from yesterday
        yesterday_stmt = select(Quest).where(
            Quest.user_id == current_user.id
        ).where(
            Quest.type == "DAILY"
        ).where(
            Quest.status == "ACTIVE"
        )
        missed_quests = session.exec(yesterday_stmt).all()
        
        if missed_quests:
            # Hunter failed the daily quest! Generate Recovery Quest and break streak
            for mq in missed_quests:
                mq.status = "FAILED"
                session.add(mq)
            
            current_user.streak = 0
            session.add(current_user)
            session.commit()
            
            from .auth import create_notification
            create_notification(
                user_id=current_user.id,
                message="Hunter, you missed yesterday's daily quests! The learning path has been locked. Complete the Recovery Quest to restore alignment.",
                notification_type="QUEST_FAILED",
                session=session
            )
            
            # Create a Recovery Quest
            due = datetime.utcnow().replace(hour=23, minute=59, second=59, microsecond=999999)
            rec_q = Quest(
                user_id=current_user.id,
                title="RECOVERY QUEST: Passive Rest & Review",
                description="Hunter! You missed yesterday's daily quests. Complete this review module to restore your learning path.",
                type="RECOVERY",
                xp_reward=150,
                gold_reward=50,
                status="ACTIVE",
                due_date=due
            )
            rec_q.set_content({
                "summary": "Mandatory review of previous weak concepts. Solve these topics to unlock the next chapter.",
                "tasks": ["Review SQL Joins", "Complete 5-minute reflection in chat"]
            })
            session.add(rec_q)
            session.commit()
            return [rec_q]
            
        # Otherwise, simply generate today's dailies
        # Get active week title
        active_week_stmt = select(Quest).where(
            Quest.user_id == current_user.id
        ).where(
            Quest.type == "MAIN"
        ).where(
            Quest.status == "ACTIVE"
        )
        active_week = session.exec(active_week_stmt).first()
        week_title = active_week.title if active_week else "Foundations"
        
        active_quests = trigger_daily_generation(current_user, goal, week_title, session)
        
    res = []
    for q in active_quests:
        res.append(QuestResponse(
            id=q.id,
            title=q.title,
            description=q.description,
            type=q.type,
            xp_reward=q.xp_reward,
            gold_reward=q.gold_reward,
            status=q.status,
            due_date=q.due_date,
            week_number=q.week_number,
            content=q.get_content()
        ))
    return res

@router.post("/daily/{quest_id}/complete")
def complete_quest(quest_id: int, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(Quest).where(Quest.id == quest_id).where(Quest.user_id == current_user.id)
    quest = session.exec(statement).first()
    
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest.status == "COMPLETED":
        return {"message": "Quest already completed", "user": current_user}
        
    # Mark completed
    quest.status = "COMPLETED"
    quest.completed_at = datetime.utcnow()
    session.add(quest)
    
    # Award rewards
    progression = award_xp_and_gold(current_user, quest.xp_reward, quest.gold_reward, session)
    
    # If the completed quest was a RECOVERY quest, check if we can unlock/resume main path
    if quest.type == "RECOVERY":
        # Unlock next week or restore daily quests
        pass
        
    # Check if all daily quests for today are completed to reward a streak gold bonus
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    all_today_stmt = select(Quest).where(
        Quest.user_id == current_user.id
    ).where(
        Quest.type == "DAILY"
    ).where(
        Quest.created_at >= today_start
    )
    all_today = session.exec(all_today_stmt).all()
    
    all_done = len(all_today) > 0 and all(q.status == "COMPLETED" for q in all_today)
    streak_bonus = False
    if all_done:
        # Award streak bonus
        current_user.gold += 100
        session.add(current_user)
        session.commit()
        streak_bonus = True
        
    return {
        "message": f"Quest '{quest.title}' completed!",
        "progression": progression,
        "streak_bonus": streak_bonus
    }

class BuyItemPayload(BaseModel):
    item_id: int

@router.get("/shop/items", response_model=List[ShopItem])
def get_shop_items(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    stmt = select(ShopItem)
    items = session.exec(stmt).all()
    if not items:
        # Prepopulate default items
        default_items = [
            ShopItem(
                title="FastAPI Master Cheat Sheet",
                description="Ultimate reference sheet for fast request handling, dependency injection, and Pydantic validation.",
                cost_gold=100,
                category="CHEAT_SHEET",
                content_data=json.dumps({
                    "type": "text",
                    "data": "## FastAPI Cheat Sheet\n\n### 1. Request Handling\n```python\n@app.get('/items/{item_id}')\ndef read_item(item_id: int, q: Optional[str] = None):\n    return {'item_id': item_id, 'q': q}\n```\n\n### 2. Dependency Injection\n```python\nfrom fastapi import Depends\ndef get_db():\n    db = SessionLocal()\n    try:\n        yield db\n    finally:\n        db.close()\n```"
                })
            ),
            ShopItem(
                title="Relational DB Mind Map",
                description="Visual breakdown of schemas, 1-to-N relationships, indexes, and performance queries.",
                cost_gold=150,
                category="MIND_MAP",
                content_data=json.dumps({
                    "type": "text",
                    "data": "## Database Mind Map\n\n* Relational Database (SQL)\n  * Schemas & Tables\n  * Primary & Foreign Keys\n  * Normalization (1NF, 2NF, 3NF)\n  * Performance\n    * Indexes (B-Trees)\n    * Query Optimization (EXPLAIN ANALYZE)\n    * Connection Pooling"
                })
            ),
            ShopItem(
                title="System Design Interview Hints",
                description="Key checklists and architectural patterns for scaling systems to millions of users.",
                cost_gold=200,
                category="HINTS",
                content_data=json.dumps({
                    "type": "text",
                    "data": "## System Design Interview Hints\n\n1. **Always start with requirements clarification** (Scale, load, read vs write ratio).\n2. **High-Level Design**: Client -> DNS -> Load Balancer -> Web App -> Cache -> DB.\n3. **Scaling Strategy**:\n   * Horizontal scaling (add more instances)\n   * Caching (Redis/Memcached) for data\n   * Database Sharding or Read Replicas"
                })
            )
        ]
        for item in default_items:
            session.add(item)
        session.commit()
        items = session.exec(stmt).all()
    return items

@router.post("/shop/buy")
def buy_shop_item(payload: BuyItemPayload, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    stmt = select(ShopItem).where(ShopItem.id == payload.item_id)
    item = session.exec(stmt).first()
    if not item:
        raise HTTPException(status_code=404, detail="Shop item not found")
        
    # Check if already purchased
    purchase_stmt = select(UserPurchase).where(UserPurchase.user_id == current_user.id).where(UserPurchase.shop_item_id == payload.item_id)
    existing = session.exec(purchase_stmt).first()
    if existing:
        raise HTTPException(status_code=400, detail="Item already purchased")
        
    if current_user.gold < item.cost_gold:
        raise HTTPException(status_code=400, detail="Insufficient gold")
        
    # Deduct gold and record purchase
    current_user.gold -= item.cost_gold
    purchase = UserPurchase(user_id=current_user.id, shop_item_id=item.id)
    session.add(purchase)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    # Notify user of purchase
    from .auth import create_notification
    create_notification(
        user_id=current_user.id,
        message=f"Purchase successful! Unlocked '{item.title}' for {item.cost_gold} Gold.",
        notification_type="SUCCESS",
        session=session
    )
    
    return {
        "status": "success",
        "message": f"Successfully purchased {item.title}",
        "gold_remaining": current_user.gold,
        "item": item
    }

@router.get("/shop/purchases", response_model=List[ShopItem])
def get_purchases(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    stmt = select(UserPurchase).where(UserPurchase.user_id == current_user.id)
    purchases = session.exec(stmt).all()
    item_ids = [p.shop_item_id for p in purchases]
    if not item_ids:
        return []
    items_stmt = select(ShopItem).where(ShopItem.id.in_(item_ids))
    return session.exec(items_stmt).all()

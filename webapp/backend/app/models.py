from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Relationship
import json

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    name: str
    avatar: str = Field(default="hunter_default")
    class_name: str = Field(default="Novice Generalist")
    level: int = Field(default=1)
    xp: int = Field(default=0)
    gold: int = Field(default=0)
    rank: str = Field(default="E Rank")  # E, D, C, B, A, S, National, Monarch
    streak: int = Field(default=0)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    joined_at: datetime = Field(default_factory=datetime.utcnow)

class UserGoal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    goal: str
    duration: str
    hours_per_day: int
    current_level: str
    career_interest: str
    weakness: str = Field(default="Unknown")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Quest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    title: str
    description: str
    type: str = Field(default="DAILY")  # MAIN, DAILY, RECOVERY, BOSS
    xp_reward: int = Field(default=100)
    gold_reward: int = Field(default=50)
    status: str = Field(default="ACTIVE")  # LOCKED, ACTIVE, COMPLETED, FAILED
    due_date: datetime
    week_number: Optional[int] = None
    content_json: str = Field(default="{}")  # Stores quiz, articles, task details
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    def get_content(self) -> Dict[str, Any]:
        try:
            return json.loads(self.content_json)
        except Exception:
            return {}

    def set_content(self, data: Dict[str, Any]):
        self.content_json = json.dumps(data)

class StudySession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    duration_minutes: int
    distractions: int
    focus_score: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    sender: str  # USER, SYSTEM
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ShopItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    cost_gold: int
    category: str  # CHEAT_SHEET, MIND_MAP, HINTS, INTERVIEW
    content_data: str = Field(default="{}")  # Stores files content or custom text

class UserPurchase(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    shop_item_id: int = Field(foreign_key="shopitem.id")
    purchased_at: datetime = Field(default_factory=datetime.utcnow)

class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    message: str
    read: bool = Field(default=False)
    type: str = Field(default="INFO")  # INFO, WARNING, SUCCESS, LEVEL_UP, QUEST_FAILED
    created_at: datetime = Field(default_factory=datetime.utcnow)

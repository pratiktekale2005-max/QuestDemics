import os
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

# Load env variables from backend directory
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./questdemics.db")

# SQLite needs connect_args={"check_same_thread": False} for multithreading in FastAPI
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)

def create_db_and_tables():
    from .models import User, UserGoal, Quest, StudySession, ChatMessage, ShopItem, UserPurchase, Notification
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

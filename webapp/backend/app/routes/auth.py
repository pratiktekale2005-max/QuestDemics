from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import List

from ..db import get_session
from ..models import User, Notification
from ..auth_utils import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter()

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    avatar: str
    class_name: str
    level: int
    xp: int
    gold: int
    rank: str
    streak: int
    joined_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, session: Session = Depends(get_session)):
    # Check if user already exists
    statement = select(User).where(User.email == user_data.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password and create user
    hashed = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        hashed_password=hashed,
        name=user_data.name,
        avatar="hunter_default",
        level=1,
        xp=0,
        gold=0,
        rank="E Rank",
        streak=1,
        last_active=datetime.utcnow(),
        joined_at=datetime.utcnow()
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    statement = select(User).where(User.email == form_data.username)
    user = session.exec(statement).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last active and check streak
    now = datetime.utcnow()
    days_diff = (now.date() - user.last_active.date()).days
    if days_diff == 1:
        user.streak += 1
    elif days_diff > 1:
        user.streak = 1  # Reset streak if inactive
        
    user.last_active = now
    session.add(user)
    session.commit()
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

def create_notification(user_id: int, message: str, notification_type: str, session: Session) -> Notification:
    notif = Notification(
        user_id=user_id,
        message=message,
        type=notification_type,
        read=False,
        created_at=datetime.utcnow()
    )
    session.add(notif)
    session.commit()
    session.refresh(notif)
    return notif

@router.get("/notifications", response_model=List[Notification])
def get_notifications(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    stmt = select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc())
    return session.exec(stmt).all()

@router.post("/notifications/{notification_id}/read")
def read_notification(notification_id: int, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    stmt = select(Notification).where(Notification.id == notification_id).where(Notification.user_id == current_user.id)
    notif = session.exec(stmt).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.read = True
    session.add(notif)
    session.commit()
    return {"status": "success", "message": "Notification marked as read"}

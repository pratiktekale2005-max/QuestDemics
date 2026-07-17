from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import create_db_and_tables
from .routes import auth, quests, study, tutor, boss

app = FastAPI(
    title="QuestDemics AI OS API",
    description="The AI Operating System for Skill Mastery API Server",
    version="1.0.0"
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(quests.router, prefix="/api/quests", tags=["Quests"])
app.include_router(study.router, prefix="/api/study", tags=["Study"])
app.include_router(tutor.router, prefix="/api/tutor", tags=["Tutor"])
app.include_router(boss.router, prefix="/api/boss", tags=["Boss Battles"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "QuestDemics AI OS",
        "message": "Welcome, Hunter. The System is active."
    }

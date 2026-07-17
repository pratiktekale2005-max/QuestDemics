import json
from typing import Dict, Any, List
from .client import call_gemini
from .prompts import MAIN_QUEST_GENERATOR_PROMPT, DAILY_QUEST_PROMPT

def generate_main_quest(
    goal: str, duration: str, hours: int, current_level: str, career: str
) -> List[Dict[str, Any]]:
    """
    Generates a multi-week roadmap (Main Quest) for the Hunter based on their profile.
    """
    prompt = MAIN_QUEST_GENERATOR_PROMPT.format(
        goal=goal,
        duration=duration,
        hours=hours,
        current_level=current_level,
        career=career
    )
    
    response_text = call_gemini(prompt, json_mode=True)
    
    try:
        data = json.loads(response_text)
        return data.get("weeks", [])
    except Exception:
        # Fallback to an empty list, routing will handle generating default mock weeks
        return []

def generate_daily_quests(
    goal: str, current_week_title: str, current_level: str, weak_topics: str
) -> List[Dict[str, Any]]:
    """
    Generates exactly 3 personalized daily quests based on the current topic and weak points.
    """
    prompt = DAILY_QUEST_PROMPT.format(
        goal=goal,
        current_week_title=current_week_title,
        current_level=current_level,
        weak_topics=weak_topics
    )
    
    response_text = call_gemini(prompt, json_mode=True)
    
    try:
        data = json.loads(response_text)
        return data.get("quests", [])
    except Exception:
        return []

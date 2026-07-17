import json
from typing import Dict, Any
from .client import call_gemini
from .prompts import ONBOARDING_PARSER_PROMPT

def parse_onboarding(onboarding_text: str) -> Dict[str, Any]:
    """
    Parses a user's free-form onboarding response into structured configuration details
    using the Gemini API.
    """
    prompt = ONBOARDING_PARSER_PROMPT.format(onboarding_text=onboarding_text)
    
    # Call Gemini in JSON mode
    response_text = call_gemini(prompt, json_mode=True)
    
    try:
        data = json.loads(response_text)
        return data
    except Exception as e:
        # Graceful fallback in case of JSON parse failure
        return {
            "goal": "AI Engineer",
            "duration": "180 days",
            "hours": 2,
            "current_level": "Intermediate",
            "weakness": "Unknown",
            "career": "ML Engineer"
        }

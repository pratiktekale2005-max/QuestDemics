import json
from typing import Dict, Any
from .client import call_gemini
from .prompts import BOSS_BATTLE_PROMPT, BOSS_EVALUATOR_PROMPT

def generate_boss_battle(goal: str, milestones_completed: int, target_class: str) -> Dict[str, Any]:
    """
    Generates a Boss Battle challenge based on current progress and career target class.
    """
    prompt = BOSS_BATTLE_PROMPT.format(
        goal=goal,
        milestones_completed=milestones_completed,
        target_class=target_class
    )
    
    response_text = call_gemini(prompt, json_mode=True)
    
    try:
        return json.loads(response_text)
    except Exception:
        # Fallback to standard simulated response
        from .client import generate_simulated_response
        sim_prompt = "generate a boss battle"
        return json.loads(generate_simulated_response(sim_prompt))

def evaluate_boss_submission(boss_battle_spec: str, user_submission: str) -> Dict[str, Any]:
    """
    Grades user coding submissions against a Boss Battle specification.
    """
    prompt = BOSS_EVALUATOR_PROMPT.format(
        boss_battle_spec=boss_battle_spec,
        user_submission=user_submission
    )
    
    response_text = call_gemini(prompt, json_mode=True)
    
    try:
        return json.loads(response_text)
    except Exception:
        from .client import generate_simulated_response
        sim_prompt = "evaluate a hunter's submitted solution"
        return json.loads(generate_simulated_response(sim_prompt))

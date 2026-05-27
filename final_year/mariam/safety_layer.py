from llm_engine import call_llm
import json

def emergency_check(user_input):
    prompt = f"""
You are a medical safety classifier.

Detect if this message is an emergency.

Return ONLY JSON:

{{
  "emergency": true/false,
  "type": "stroke | chest_pain | pregnancy_risk | infection | none",
  "reason": ""
}}

Message:
{user_input}
"""

    result = call_llm([
        {"role": "user", "content": prompt}
    ])

    try:
        return json.loads(result)
    except:
        return {"emergency": False, "type": "none", "reason": "parse_failed"}
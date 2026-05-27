from llm_engine import call_llm
import json

def medical_reasoning(clinical_data, user_input):

    symptoms = clinical_data.get("symptoms", [])
    severity_hint = clinical_data.get("severity_hint", "unknown")

    prompt = [
        {
            "role": "system",
            "content": """
You are a senior clinical decision support system.

RULES:
- Do NOT jump to diagnosis
- Always use probability language:
  "possible", "suggests", "may indicate"
- If uncertainty → ask questions instead of concluding
- Never escalate to emergency unless explicitly stated
- Never assume pregnancy or severe disease without confirmation

OUTPUT ONLY JSON:

{
  "possible_conditions": [],
  "risk_level": "low|medium|high",
  "certainty": "low|medium|high",
  "next_questions": [],
  "medical_reasoning": ""
}
"""
        },
        {
            "role": "user",
            "content": f"""
Patient message:
{user_input}

Extracted symptoms:
{symptoms}

Severity hint:
{severity_hint}
"""
        }
    ]

    result = call_llm(prompt)

    try:
        return json.loads(result)
    except:
        return {
            "possible_conditions": [],
            "risk_level": "unknown",
            "certainty": "low",
            "next_questions": [],
            "medical_reasoning": "Could not parse model output"
        }
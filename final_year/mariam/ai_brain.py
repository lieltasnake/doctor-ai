from groq import Groq
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# -----------------------------
# 1. SYMPTOM EXTRACTION BRAIN
# -----------------------------
def extract_symptoms(user_text: str):

    prompt = f"""
You are a medical symptom extraction system.

Extract ONLY medical symptoms from user text.

Return STRICT JSON format:

{{
  "symptoms": ["..."],
  "severity_clues": ["..."]
}}

Rules:
- No explanation
- No diagnosis
- Only symptoms
- Normalize symptoms (e.g. "feeling very thirsty" → "excessive thirst")

User text:
{user_text}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )

    return json.loads(response.choices[0].message.content)


# -----------------------------
# 2. DIAGNOSIS REASONING BRAIN
# -----------------------------
def diagnose(symptoms: list):

    prompt = f"""
You are a professional medical AI reasoning system.

You must:
- analyze symptoms
- infer possible conditions
- estimate risk level
- give safe medical advice

IMPORTANT:
- You are NOT a doctor
- Do NOT be overly confident
- Always suggest professional consultation for serious cases

Return STRICT JSON:

{{
  "possible_conditions": [
    {{
      "name": "",
      "reason": "",
      "confidence": 0-100
    }}
  ],
  "risk_level": "low | medium | high | emergency",
  "advice": ""
}}

Symptoms:
{symptoms}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )

    return json.loads(response.choices[0].message.content)
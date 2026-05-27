from llm_engine import call_llm
import json

def extract_clinical_features(user_input):

    messages = [
        {
            "role": "system",
            "content": """
Extract medical features from patient message.

Return ONLY JSON:
{
  "symptoms": [],
  "severity_hint": "low|medium|high|unknown"
}

Rules:
- convert text into medical symptoms
- no explanations
- no extra text
"""
        },
        {"role": "user", "content": user_input}
    ]

    response = call_llm(messages)

    content = response.choices[0].message.content

    try:
        return json.loads(content)
    except:
        return {
            "symptoms": [],
            "severity_hint": "unknown"
        }
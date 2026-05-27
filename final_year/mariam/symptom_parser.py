from llm_engine import client, MODEL
import json

def medical_reasoning(clinical_data, user_input):

    prompt = f"""
You are a senior hospital diagnostic AI.

Patient input:
{user_input}

Clinical structured data:
{json.dumps(clinical_data, indent=2)}

Task:
1. Analyze symptoms deeply
2. Generate 2–5 possible conditions
3. Rank by probability
4. Assign risk level (low/medium/high)
5. Give safe medical advice
6. Explain reasoning clearly

Return ONLY JSON:

{{
  "possible_conditions": [
    {{"name": "", "likelihood": ""}}
  ],
  "risk_level": "",
  "reasoning": "",
  "advice": ""
}}
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a hospital-level diagnostic AI doctor."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)
HIGH_RISK_SYMPTOMS = [
    "chest pain",
    "loss of consciousness",
    "severe bleeding",
    "difficulty breathing"
]

def safety_check(symptoms):
    return any(s in symptoms for s in HIGH_RISK_SYMPTOMS)
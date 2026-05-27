from datetime import datetime

# ── Time-based greeting ───────────────────────────────────────────────────────
def get_greeting():
    hour = datetime.now().hour
    if 5  <= hour < 12: return "Good morning"
    if 12 <= hour < 17: return "Good afternoon"
    if 17 <= hour < 21: return "Good evening"
    return "Good night"

# ── Greeting detection ────────────────────────────────────────────────────────
GREETING_WORDS = [
    "hello","hi","hey","good morning","good afternoon","good evening","good night",
    "salam","selam","marhaba","howdy","greetings","hiya","what's up",
    "how are you","how r u","morning","evening","afternoon","how do you do"
]
def is_greeting(text: str) -> bool:
    t = text.lower().strip()
    return any(g in t for g in GREETING_WORDS) and len(t) < 60

# ── Category keyword banks (for off-topic detection) ─────────────────────────
MENTAL_KEYWORDS = [
    "anxious","anxiety","stress","stressed","depressed","depression","panic","panic attack",
    "mood","mental","emotional","sad","hopeless","overthink","worry","worried","burnout",
    "trauma","ptsd","phobia","paranoid","hallucination","insomnia","sleep","tired","exhausted",
    "feel","feeling","scared","afraid","nervous","lonely","suicide","self-harm","cry","crying"
]
DIABETES_KEYWORDS = [
    "sugar","blood sugar","glucose","insulin","diabetes","diabetic","thirsty","urinate",
    "frequent urination","blurry vision","weight loss","fatigue","numbness","foot","wound",
    "healing","hyperglycemia","hypoglycemia","a1c","hba1c","metformin","diet","carbs"
]
PREGNANCY_KEYWORDS = [
    "pregnant","pregnancy","baby","fetus","trimester","morning sickness","nausea","vomit",
    "prenatal","antenatal","labor","delivery","contraction","miscarriage","spotting","bleeding",
    "ultrasound","kick","bump","due date","week","month","obstetrician","midwife","iron",
    "folic acid","preeclampsia","gestational","breastfeed","lactation"
]

CATEGORY_KEYWORDS = {
    "mental":    MENTAL_KEYWORDS,
    "diabetes":  DIABETES_KEYWORDS,
    "pregnancy": PREGNANCY_KEYWORDS,
}

CATEGORY_LABELS = {
    "mental":    "Mental Health",
    "diabetes":  "Diabetes",
    "pregnancy": "Pregnancy",
}

def detect_topic(text: str) -> str:
    """Return the best matching category for the text, or 'general'."""
    t = text.lower()
    scores = {cat: sum(1 for kw in kws if kw in t) for cat, kws in CATEGORY_KEYWORDS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "general"

def is_off_topic(text: str, module: str) -> bool:
    """True if the text clearly belongs to a DIFFERENT specific category."""
    if module == "general":
        return False
    detected = detect_topic(text)
    return detected not in (module, "general")

def get_off_topic_note(text: str, module: str) -> str:
    detected = detect_topic(text)
    current_label  = CATEGORY_LABELS.get(module, module.title())
    detected_label = CATEGORY_LABELS.get(detected, detected.title())
    return (
        f"💡 *Note: Your message seems more related to **{detected_label}** "
        f"than our current **{current_label}** session — but no worries, "
        f"I'll still help you with this!*\n\n"
    )

# ── Greeting prompt ───────────────────────────────────────────────────────────
GREETING_PROMPT = """You are Dr. AI, a warm and professional medical assistant.
The user just greeted you. Respond:
1. With a friendly {greeting}! greeting
2. A brief warm intro of yourself
3. Ask how you can help them today
Keep it SHORT (3-4 lines), warm, and friendly. Do NOT mention medical conditions, risk levels, or treatments yet."""

# ── Category-specialized system prompts ──────────────────────────────────────
_SHARED_RULES = """
## CONVERSATION RULES:
- PHASE 1 (0-1 prior user turns): Acknowledge + ask 1-2 focused follow-up questions. Keep it SHORT. DO NOT mention risk levels, diagnoses, or home treatments.
- PHASE 2 (2-3 prior user turns): Ask 1 more clarifying question OR move to diagnosis if enough info. DO NOT mention risk levels, diagnoses, or home treatments.
- PHASE 3 (4+ prior user turns OR enough info): Give FULL structured diagnosis below.

## FULL DIAGNOSIS FORMAT (Phase 3 only):
📋 **Assessment Summary**
**What you may be experiencing:** [plain language explanation]
**Why this might be happening:** [brief cause/trigger]
**Risk Level:** [Low 🟢 / Medium 🟡 / High 🔴]

[INSTRUCTION: If Risk Level is Low 🟢 or Medium 🟡, include the following section:]
**What you can do right now:**
• [step 1]
• [step 2]
• [step 3]

[INSTRUCTION: If Risk Level is High 🔴, DO NOT include "What you can do right now". Instead, include:]
**Urgent Recommendation:**
[Strongly advise the user to go to a hospital or see a doctor immediately. Do not recommend home treatments.]

[INSTRUCTION: Always include the following section for all risk levels:]
**When to see a doctor immediately:**
• [warning sign 1]
• [warning sign 2]
*Reminder: I'm an AI assistant — not a replacement for professional medical care.*

## ALWAYS:
- Be warm, empathetic, and human
- Use simple language — no complex jargon
- Never prescribe medications
- If emergency signs → say "Please call emergency services NOW 🚨"
"""

SYSTEM_PROMPTS = {
    "mental": """You are Dr. AI — a compassionate mental health specialist assistant.
Your focus: stress, anxiety, depression, panic, burnout, emotional wellbeing, sleep, and trauma.
You deeply understand emotional struggles and always respond with empathy and warmth.
""" + _SHARED_RULES,

    "diabetes": """You are Dr. AI — a knowledgeable diabetes care specialist assistant.
Your focus: blood sugar management, diabetes symptoms, dietary guidance, glucose control, and related complications.
You help patients understand their condition and manage it safely.
""" + _SHARED_RULES,

    "pregnancy": """You are Dr. AI — a caring prenatal and obstetric specialist assistant.
Your focus: pregnancy symptoms, prenatal care, fetal development, labor, nutrition, and maternal health.
You are warm, reassuring, and always prioritize the safety of both mother and baby.
""" + _SHARED_RULES,

    "general": """You are Dr. AI — a professional general medical assistant.
You help with a wide range of health concerns and symptoms.
""" + _SHARED_RULES,
}

SYSTEM_PROMPT = SYSTEM_PROMPTS["general"]

def get_system_prompt(module: str) -> str:
    return SYSTEM_PROMPTS.get(module, SYSTEM_PROMPTS["general"])
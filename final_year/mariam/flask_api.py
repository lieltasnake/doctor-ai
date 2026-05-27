import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from medical_reasoning_prompt import (
    get_greeting, is_greeting,
    is_off_topic, get_off_topic_note,
    get_system_prompt, GREETING_PROMPT
)

app = Flask(__name__)
CORS(app)

# ── Groq client — perfectly integrated from mariam folder ──────────
from llm_engine import call_llm, client, MODEL

# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_risk(text: str) -> str:
    t = (text or "").lower()
    if "high 🔴" in t or ("high" in t and "risk" in t): return "High"
    if "medium 🟡" in t or ("medium" in t and "risk" in t): return "Medium"
    return "Low"

def _extract_condition(text: str, module: str) -> str:
    t = (text or "").lower()
    if module == "mental":
        if "anxiety"  in t: return "Anxiety"
        if "depress"  in t: return "Depression"
        if "stress"   in t: return "Stress"
        if "burnout"  in t: return "Burnout"
        if "panic"    in t: return "Panic Disorder"
        if "insomnia" in t or "sleep" in t: return "Sleep Disorder"
        if "crisis"   in t or "emergency" in t: return "Severe Distress"
        return "Mental Health Concern"
    if module == "diabetes":
        if "high" in t and "sugar" in t: return "High Blood Sugar"
        if "low"  in t and "sugar" in t: return "Low Blood Sugar"
        if "diabet" in t: return "Diabetes Risk"
        if "insulin" in t: return "Insulin-related"
        return "Diabetes Concern"
    if module == "pregnancy":
        if "concern" in t or "risk" in t: return "Pregnancy Concern"
        if "normal"  in t:                return "Normal Pregnancy"
        if "labor"   in t or "contraction" in t: return "Labor Signs"
        if "nausea"  in t or "sick" in t: return "Morning Sickness"
        return "Pregnancy Query"
    return "General Health"

def _call_groq(messages: list) -> str:
    return call_llm(messages)

def _run(message: str, module: str, history: list = None, language: str = 'english') -> dict:
    history = history or []

    # ── Count prior USER turns ────────────────────────────────────────────────
    user_turns = sum(1 for h in history if h.get("role") == "user")

    # ── 1. Pure greeting (no prior turns) ─────────────────────────────────────
    if is_greeting(message) and user_turns == 0:
        greeting = get_greeting()
        messages = [
            {"role": "system", "content": GREETING_PROMPT.format(greeting=greeting)},
            {"role": "user",   "content": message}
        ]
        if language not in ('english', 'en'):
            supported = {'am': 'Amharic', 'om': 'Afaan Oromo', 'ti': 'Tigrinya'}
            lang_name = supported.get(language)
            if lang_name:
                system_instruction = (
                    f"CRITICAL: You are Dr. AI, acting as a professional, native-level medical assistant in {lang_name}. "
                    f"You must perform all your normal medical reasoning in English internally, but your FINAL output MUST be strictly in highly fluent, idiomatic, and grammatically perfect {lang_name}. "
                    "Never translate word-for-word. Do NOT output any English words."
                )
                messages[0]["content"] += "\n\n" + system_instruction
            
        reply = _call_groq(messages)
        return {"reply": reply, "condition": None, "risk": None, "phase": "greeting"}

    # ── 2. Off-topic detection ────────────────────────────────────────────────
    off_topic     = is_off_topic(message, module)
    note_prefix   = get_off_topic_note(message, module) if off_topic else ""

    # ── 3. Build messages with specialized system prompt + history ────────────
    system_prompt = get_system_prompt(module)
    
    if language not in ('english', 'en'):
        supported = {'am': 'Amharic', 'om': 'Afaan Oromo', 'ti': 'Tigrinya'}
        lang_name = supported.get(language)
        if lang_name:
            system_prompt += (
                f"\n\nCRITICAL LANGUAGE INSTRUCTION:\n"
                f"You MUST format your response according to the rules above, but output EVERYTHING in highly fluent, idiomatic, and grammatically perfect {lang_name}. "
                f"Do NOT do a literal translation. Think about the medical meaning and express it naturally for a native {lang_name} speaker. "
                "Keep the warm, empathetic medical tone. NEVER output English text."
            )

    messages = [{"role": "system", "content": system_prompt}]

    for h in history:
        role    = h.get("role", "user")
        content = h.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})

    reply = _call_groq(messages)

    # ── 4. Prepend off-topic note to the reply ────────────────────────────────
    if note_prefix:
        reply = note_prefix + reply

    # ── 5. Extract condition/risk only in diagnosis phase ─────────────────────
    in_diagnosis = (
        user_turns >= 3
        or "Assessment Summary" in reply
        or "Risk Level:" in reply
        or "Risk Level" in reply
    )
    condition = _extract_condition(reply, module) if in_diagnosis else None
    risk      = _extract_risk(reply)              if in_diagnosis else None

    return {
        "reply":     reply,
        "condition": condition,
        "risk":      risk,
        "phase":     "diagnosis" if in_diagnosis else "conversation",
        "off_topic": off_topic
    }

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.route("/ai/speech-to-text", methods=["POST"])
def speech_to_text():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    file = request.files["audio"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        # Save audio file temporarily
        temp_path = os.path.join(os.path.dirname(__file__), "temp_audio_" + file.filename)
        file.save(temp_path)

        # Transcribe using Groq Whisper
        with open(temp_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(temp_path, audio_file.read()),
                model="whisper-large-v3-turbo",
                response_format="json"
            )
        
        # Cleanup
        os.remove(temp_path)
        
        return jsonify({"text": transcription.text})
    except Exception as e:
        print(f"[Groq STT error] {e}")
        # Cleanup on error
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"error": str(e)}), 500

@app.route("/ai/mental", methods=["POST"])
def mental():
    data    = request.json or {}
    message = data.get("message", "").strip()
    history = data.get("history", [])
    language = data.get("language", "english")
    if not message:
        return jsonify({"reply": "Please describe how you are feeling.", "condition": None, "risk": None}), 400
    return jsonify(_run(message, "mental", history, language))

@app.route("/ai/diabetes", methods=["POST"])
def diabetes():
    data    = request.json or {}
    message = data.get("message", "").strip()
    history = data.get("history", [])
    language = data.get("language", "english")
    if not message:
        return jsonify({"reply": "Please describe your symptoms.", "condition": None, "risk": None}), 400
    return jsonify(_run(message, "diabetes", history, language))

@app.route("/ai/pregnancy", methods=["POST"])
def pregnancy():
    data    = request.json or {}
    message = data.get("message", "").strip()
    history = data.get("history", [])
    language = data.get("language", "english")
    if not message:
        return jsonify({"reply": "Please describe your symptoms.", "condition": None, "risk": None}), 400
    return jsonify(_run(message, "pregnancy", history, language))

@app.route("/predict", methods=["POST"])
def predict():
    """General endpoint used by Node backend's handleChatMessage."""
    data     = request.json or {}
    category = data.get("category", "general")
    language = data.get("language", "english")
    message  = data.get("message", "")
    history  = data.get("history", [])

    module = category if category in ("mental", "diabetes", "pregnancy") else "general"
    result = _run(message, module, history, language)
    if language != "english":
        result["language"] = language
    return jsonify(result)

@app.route("/", methods=["GET"])
def index():
    return jsonify({"status": "Doctor AI (final_year) API running on port 5001"})

if __name__ == "__main__":
    print("Starting Doctor AI Flask API on http://127.0.0.1:5001 ...")
    app.run(host="127.0.0.1", port=5001, debug=False)

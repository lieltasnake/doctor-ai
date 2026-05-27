from llm_engine import call_llm
from medical_reasoning_prompt import SYSTEM_PROMPT


def doctor_response(user_input, history):

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
    ]

    # 🧠 Convert your custom memory format → LLM format
    for h in history:

        role = h.get("role")
        content = h.get("content")

        if not content:
            continue

        if role == "patient":
            messages.append({"role": "user", "content": content})

        elif role == "doctor":
            messages.append({"role": "assistant", "content": content})

    # 🧠 current patient message
    messages.append({"role": "user", "content": user_input})

    # 🧠 call model safely
    try:
        return call_llm(messages)

    except Exception as e:
        print("LLM ERROR:", e)
        return "I’m having trouble responding right now. Please try again."
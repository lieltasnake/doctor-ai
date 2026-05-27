from llm_engine import call_llm
from repository import save_record
from memory import add_message, get_history

print("🩺 REAL AI DOCTOR STARTED")

while True:
    user_input = input("\nPatient: ")

    if user_input.lower() == "exit":
        break

    # 1. Add user message to memory
    add_message("user", user_input)

    # 2. Get history
    history = get_history()

    # 3. AI reasoning
    result = call_llm(user_input, history)

    # 4. Save to DB
    save_record(
        user_input=user_input,
        symptoms=result.get("symptoms"),
        diagnosis=result.get("possible_conditions")
    )

    # 5. Add AI response to memory
    add_message("assistant", str(result))

    # 6. Output
    print("\n🧠 AI RESULT:")
    print(result)
from doctor_brain import doctor_response
from voice_input import listen
from voice_output import speak

history = []

print("🧠 ChatGPT Voice Doctor Started")

while True:

    user_input = listen()

    if not user_input:
        continue

    if user_input.lower() in ["exit", "quit", "stop"]:
        speak("Goodbye. Take care.")
        break

    print("🧍 Patient:", user_input)

    reply = doctor_response(user_input, history)

    speak(reply)

    history.append({"role": "patient", "content": user_input})
    history.append({"role": "doctor", "content": reply})
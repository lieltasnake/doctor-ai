import pyttsx3

engine = pyttsx3.init()

def speak(text):
    print("🧠 Doctor:", text)
    engine.say(text)
    engine.runAndWait()
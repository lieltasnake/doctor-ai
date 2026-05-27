from groq import Groq
import os
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
if api_key:
    client = Groq(api_key=api_key, timeout=120)
else:
    client = None  # No key – will return a friendly error message

MODEL = "llama-3.3-70b-versatile"


def call_llm(messages):
    """Send messages to the LLM and return the response.
    If the GROQ client is not configured (missing API key), a clear error
    message is returned so the FastAPI server can start without crashing.
    """
    if client is None:
        # No API key – inform the caller
        raise RuntimeError(
            "GROQ_API_KEY is not set. Add it to a .env file or set the environment variable."
        )
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=250,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"LLM ERROR: {e}")
        return (
            "I’m having trouble connecting to the medical reasoning system right now. "
            "Please try again in a moment."
        )
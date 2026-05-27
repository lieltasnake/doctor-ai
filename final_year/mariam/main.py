from llm_engine import call_llm
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from medical_reasoning_prompt import SYSTEM_PROMPT

import os
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import RedirectResponse
from fastapi import Request
from authlib.integrations.starlette_client import OAuth

app = FastAPI(title="Doctor AI - FastAPI Server")

# Enable CORS for all origins (required for Expo Go)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── GOOGLE OAUTH SETUP ────────────────────────────────────────────────────────
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET", "super-secret-key"))

oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID", "YOUR_GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET", "YOUR_GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

ANTIGRAVITY_URL = os.getenv("ANTIGRAVITY_URL", "https://your-app.antigravity.app")

@app.get("/login")
async def login(request: Request):
    redirect_uri = f"{ANTIGRAVITY_URL}/auth/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/callback")
async def auth_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user = token.get('userinfo')
    
    # Redirect back to Expo app using Expo Deep Linking
    # Replace the IP below with your actual Expo Go IP
    expo_deep_link = f"exp://10.98.141.184:8081/--/Home?email={user.get('email')}&name={user.get('name')}"
    return RedirectResponse(url=expo_deep_link)
# ──────────────────────────────────────────────────────────────────────────────

@app.post("/doctor")
async def doctor_endpoint(user_input: str, history: list = None):
    return doctor_response(user_input, history)

if __name__ == "__main__":
    print("Starting Doctor AI FastAPI server on port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
def doctor_response(user_input, history=None):
    """Generate a response from the LLM.
    Parameters
    ----------
    user_input: str
        The latest user query.
    history: list[dict] | None
        Optional chat history; each entry must have ``role`` and ``content`` keys.
    """
    # ✅ Step 1: safe history handling
    if history is None:
        history = []

    # ✅ Step 2: ensure history is valid format
    safe_history = []
    for item in history:
        if isinstance(item, dict) and "role" in item and "content" in item:
            safe_history.append(item)

    # ✅ Step 3: build messages
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *safe_history,
        {"role": "user", "content": user_input},
    ]

    # ✅ Step 4: call model safely
    try:
        response = call_llm(messages)
        if not response:
            raise HTTPException(status_code=500, detail="Empty response from model")
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
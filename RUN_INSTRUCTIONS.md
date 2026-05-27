# Doctor AI - Setup, Testing, & Run Guide

## 🔷 STEP 8: INTEGRATION & DATA FLOW
Here is exactly how the system is wired together:
1. **User Input:** The user speaks or types symptoms into the **React Native Frontend**.
2. **Authentication:** The frontend securely attaches a JWT Token and sends a `POST` request to the **Node.js Backend**.
3. **Database Logging (Part 1):** The backend verifies the token and immediately saves the symptom to the **PostgreSQL Database**.
4. **AI Processing:** The backend forwards the text via HTTP to the **Python AI Module**.
5. **NLP Analysis:** The AI module uses `spaCy` to extract keywords, cross-references its medical rules engine, and returns a JSON payload with a `condition`, `risk_level`, and `advice`.
6. **Database Logging (Part 2):** The backend saves the AI's assessment and recommendation into PostgreSQL, and logs the entire exchange into the `history` table.
7. **Frontend Output:** The JSON is passed back to React Native. The UI displays it in a chat bubble, and the app uses `expo-speech` to read the advice out loud.

---

## 🔷 STEP 9: HOW TO RUN THE PROJECT

To bring the whole system online, you need to start 3 separate terminals (one for each layer).

### 1. Database Setup (PostgreSQL)
1. Open pgAdmin or your PostgreSQL CLI.
2. Create a new database named `doctor_ai`.
3. Copy the contents of `database/schema.sql` and execute it. This will create all 6 tables and insert sample user data.

### 2. Start the AI Module (Python)
1. Open a terminal and navigate to the `ai-module` directory:
   ```bash
   cd doctor-ai/ai-module
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Download the NLP language model:
   ```bash
   python -m spacy download en_core_web_sm
   ```
4. Start the FastAPI server:
   ```bash
   python main.py
   ```
*(Runs on `http://localhost:8000`)*

### 3. Start the Backend API (Node.js)
1. Open a new terminal and navigate to the `backend` directory:
   ```bash
   cd doctor-ai/backend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Express server:
   ```bash
   npm run dev
   ```
*(Runs on `http://localhost:5000`)*

### 4. Start the Frontend (React Native)
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd doctor-ai/frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npm start
   ```
*(Press `a` to open in Android Emulator, `i` for iOS simulator, or scan the QR code with the Expo Go app on your physical phone)*

---

## 🔷 STEP 10: TESTING APIs (POSTMAN)

If you want to test the backend directly without using the mobile app, use Postman:

**1. Register a New User**
* **Method:** `POST`
* **URL:** `http://localhost:5000/register`
* **Body (JSON):**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123"
  }
  ```

**2. Login to Get Token**
* **Method:** `POST`
* **URL:** `http://localhost:5000/login`
* **Body (JSON):**
  ```json
  {
    "email": "jane@example.com",
    "password": "password123"
  }
  ```
* *Action:* Copy the `token` string from the response.

**3. Analyze Symptoms**
* **Method:** `POST`
* **URL:** `http://localhost:5000/analyze-symptoms`
* **Headers:** Add a header where Key = `Authorization` and Value = `Bearer <paste_your_token_here>`
* **Body (JSON):**
  ```json
  {
    "description": "I woke up with a severe headache and nausea."
  }
  ```

**Example AI Output:**
```json
{
  "condition": "Tension Headache / Migraine",
  "risk": "Low",
  "advice": "Rest in a quiet, dark room and stay hydrated. Over-the-counter pain relievers may help.\n\nDisclaimer: I am an AI, not a doctor. This is not professional medical advice."
}
```

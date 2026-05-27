const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey && apiKey !== "dummy-key" ? new GoogleGenerativeAI(apiKey) : null;

const SYSTEM_PROMPT = `You are a highly intelligent medical assistant that speaks like a real human.

Your behavior:
- Speak naturally like ChatGPT
- Be friendly and conversational
- Understand greetings and respond appropriately
- If user says 'hi' → greet based on time
- If user asks general question → answer normally
- If user describes symptoms → analyze carefully

For medical:
- Understand symptoms even if user does not mention disease
- Infer possible condition
- Give simple explanation
- Suggest what to do
- Recommend doctor if serious

DO NOT:
- sound robotic
- list like machine
- use strict labels (Condition:, Risk:)

Speak like a caring human.`;

// Helper to get time-based smart greeting
function getSmartGreeting(message) {
  const msgLower = (message || "").toLowerCase().trim();
  const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"];
  
  const hasGreeting = greetings.some(g => msgLower.startsWith(g) || msgLower === g);
  
  if (hasGreeting) {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "Good morning";
    } else if (hour >= 12 && hour < 18) {
      return "Good afternoon";
    } else {
      return "Good evening";
    }
  }
  return null;
}

// Unified Gemini runner
async function runAI(message, context) {
  const greeting = getSmartGreeting(message);
  let greetingContext = "";
  if (greeting) {
    greetingContext = `\nUser greeted you. You MUST respond warmly and start your conversation with the time-based greeting: "${greeting}".`;
  }

  if (!genAI) {
    console.log(`[Gemini SDK] No valid API key. Running high-fidelity ChatGPT-style local mock engine...`);
    return getLocalMockResponse(message, context);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `${SYSTEM_PROMPT}${greetingContext}\nContext: ${context}\nUser: ${message}`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error(`[Gemini SDK] Real API request failed: ${err.message}`);
    // If Gemini fails, return standard error message
    return "Something went wrong. Please try again.";
  }
}

// Local mock ChatGPT-style conversation engine
function getLocalMockResponse(message, context) {
  const msgLower = (message || "").toLowerCase().trim();
  
  // 1. Smart greetings detection
  const greeting = getSmartGreeting(message);
  if (greeting) {
    return `${greeting} 😊 How are you feeling today?`;
  }

  // 2. Chat dialogues
  if (msgLower === "how are you" || msgLower.includes("how are you feeling")) {
    return "I'm here and ready to help you 😊 What’s on your mind?";
  }

  // 3. Mental health context
  if (context.includes("emotional support") || msgLower.includes("anxious") || msgLower.includes("stress") || msgLower.includes("depressed")) {
    return "I understand how you're feeling. That sounds really difficult. You might try taking a short break and focusing on your breathing. If it continues, consider speaking with a professional.";
  }

  // 4. Pregnancy context
  if (context.includes("pregnant") || msgLower.includes("pregnant") || msgLower.includes("pregnancy")) {
    if (msgLower.includes("pain") || msgLower.includes("cramp")) {
      return "I'm so sorry you're feeling pain during your pregnancy. Abdominal pain or cramping is something you should definitely discuss with a doctor or nurse right away to ensure you and your baby are safe. Please rest and seek professional medical guidance immediately.";
    }
    return "I completely understand that pregnancy brings up so many new feelings and questions. Make sure you are taking good care of yourself, drinking plenty of water, getting lots of rest, and taking your prenatal vitamins. Let me know how you are feeling.";
  }

  // 5. Diabetes context
  if (context.includes("diabetic") || msgLower.includes("diabetic") || msgLower.includes("sugar") || msgLower.includes("urinate")) {
    if (msgLower.includes("urinate") || msgLower.includes("sugar")) {
      return "Frequent urination can be an early sign of elevated blood sugar levels or diabetes. It's really important to monitor your sugar intake, keep track of your symptoms, and consider checking in with a doctor or specialist for a proper health assessment.";
    }
    return "Managing diabetes can be challenging, but taking it one step at a time is key. Try to focus on balanced meals with lean proteins, plenty of vegetables, and walking after meals to keep your blood sugar steady.";
  }

  // 6. Symptom understanding without category
  if (msgLower.includes("tired") && msgLower.includes("dizzy")) {
    return "Feeling tired and dizzy can happen for many reasons, such as dehydration, low blood sugar, or lack of rest. Please make sure you drink some water, sit down in a safe place, and rest. If it doesn't get better, checking in with a healthcare provider is highly recommended.";
  }

  if (msgLower.includes("headache")) {
    return "I'm sorry you're dealing with a headache today. Tension and dehydration are common causes, so please try to drink a glass of water and rest in a quiet, cool room with the lights dimmed. If it worsens, a mild over-the-counter pain reliever might help, but do see a doctor if it persists.";
  }

  return "I hear you, and I'm ready to help. Please tell me a bit more about how you are feeling, or ask any health questions you might have.";
}

async function pregnancyAI(message) {
  const context = "This user is pregnant. Focus on pregnancy-related advice.";
  const reply = await runAI(message, context);
  return { reply };
}

async function diabetesAI(message) {
  const context = "User is diabetic. Focus on sugar, diet, symptoms.";
  const reply = await runAI(message, context);
  return { reply };
}

async function mentalAI(message) {
  const context = "User needs emotional support.";
  const reply = await runAI(message, context);
  return { reply };
}

async function generalAI(message) {
  const context = "General medical consultation.";
  const reply = await runAI(message, context);
  return { reply };
}

module.exports = {
  pregnancyAI,
  diabetesAI,
  mentalAI,
  generalAI
};

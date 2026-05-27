const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_for_doctor_ai';

// Generate a valid mock user token
const mockToken = jwt.sign({ id: 1, email: 'test@example.com' }, JWT_SECRET, { expiresIn: '1h' });

async function runDoctorIntegrationTests() {
  console.log("=== STARTING MEDICAL INTERACTIVE DOCTOR TESTS ===");

  // Simulating a progressive conversational diagnostic flow
  const pregnancyFlow = [
    { message: "hi", expected: "Hello. What seems to be the problem today?" },
    { message: "nausea and vomiting", expected: "Have you experienced any missed periods recently?" },
    { message: "yes", expected: "Have you taken a pregnancy test?" },
    { message: "no", expected: "FINAL MEDICAL REPORT" }
  ];

  console.log("\nStarting Interactive Pregnancy Diagnosis Flow:");
  const userId = "test_user_pregnancy";
  
  for (let i = 0; i < pregnancyFlow.length; i++) {
    const step = pregnancyFlow[i];
    console.log(`\n[Step ${i + 1}] Patient: "${step.message}"`);
    try {
      const response = await axios.post(`http://127.0.0.1:5000/api/chat/pregnancy`, 
        { message: step.message },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );
      const reply = response.data.reply;
      console.log(`Doctor: \n${reply}`);
      if (reply.includes(step.expected) || (step.expected === "FINAL MEDICAL REPORT" && reply.startsWith("FINAL MEDICAL REPORT"))) {
        console.log(`✅ Step ${i + 1} passed perfectly!`);
      } else {
        console.warn(`⚠️ Warning: Expected doctor to say something containing "${step.expected}"`);
      }
    } catch (err) {
      console.error(`❌ Step ${i + 1} failed:`, err.message);
    }
  }

  console.log("\n=== MEDICAL INTERACTIVE DOCTOR TESTS COMPLETE ===");
}

setTimeout(runDoctorIntegrationTests, 1000);

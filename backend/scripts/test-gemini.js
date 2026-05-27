const geminiService = require('./services/geminiService');

async function runTests() {
  console.log("=== STARTING SMART HUMAN-LIKE GEMINI TESTS ===");

  const tests = [
    {
      name: "Smart Greeting Test",
      fn: geminiService.generalAI,
      message: "hi"
    },
    {
      name: "General Conversation Test",
      fn: geminiService.generalAI,
      message: "how are you"
    },
    {
      name: "Mental Health Context Test",
      fn: geminiService.mentalAI,
      message: "I feel anxious"
    },
    {
      name: "Pregnancy Context Test",
      fn: geminiService.pregnancyAI,
      message: "I feel pain during pregnancy"
    },
    {
      name: "Diabetes Context Test",
      fn: geminiService.diabetesAI,
      message: "I urinate frequently"
    },
    {
      name: "General Symptom Understanding Test",
      fn: geminiService.generalAI,
      message: "I feel tired and dizzy"
    }
  ];

  for (const test of tests) {
    console.log(`\nRunning: ${test.name}`);
    console.log(`Input Message: "${test.message}"`);
    try {
      const response = await test.fn(test.message);
      console.log("Response:", JSON.stringify(response, null, 2));
    } catch (err) {
      console.error(`❌ Failed: ${test.name}`);
      console.error(`Error details: ${err.message}`);
    }
  }

  console.log("\n=== SMART HUMAN-LIKE GEMINI TESTS COMPLETE ===");
}

runTests();

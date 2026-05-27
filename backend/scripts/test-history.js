const jwt = require('jsonwebtoken');
const axios = require('axios');
const pool = require('./config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_for_doctor_ai';
const mockToken = jwt.sign({ id: 1, email: 'test@example.com' }, JWT_SECRET, { expiresIn: '1h' });

async function testHistoryAPI() {
  console.log("=== RUNNING HISTORY API TESTS ===");

  try {
    // 1. Clear database tables
    await pool.query('DELETE FROM chat_messages;');
    await pool.query('DELETE FROM chat_sessions;');

    // 2. Start a conversation
    console.log("Sending initial message...");
    const res1 = await axios.post(`http://127.0.0.1:5000/api/chat/pregnancy`, 
      { message: "vomiting" },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      }
    );

    const sessionId = res1.data.session_id;
    console.log(`Initial message sent. Session ID: ${sessionId}`);

    // Send second message in same session
    console.log("Sending follow-up message...");
    await axios.post(`http://127.0.0.1:5000/chat/message`, 
      { session_id: sessionId, message: "yes", category: "pregnancy" },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      }
    );

    // 3. Test Sessions API
    console.log("\nTesting GET /api/chat/sessions/1...");
    const sessionsRes = await axios.get(`http://127.0.0.1:5000/api/chat/sessions/1`, {
      headers: { 'Authorization': `Bearer ${mockToken}` }
    });
    console.log("Sessions API Response:", sessionsRes.data);

    if (sessionsRes.data.length > 0 && sessionsRes.data[0].title === "vomiting") {
      console.log("✅ Sessions API passed!");
    } else {
      console.error("❌ Sessions API failed!");
    }

    // 4. Test Session Messages API
    console.log(`\nTesting GET /api/chat/session/${sessionId}...`);
    const messagesRes = await axios.get(`http://127.0.0.1:5000/api/chat/session/${sessionId}`, {
      headers: { 'Authorization': `Bearer ${mockToken}` }
    });
    console.log("Messages API Response:", messagesRes.data);

    if (messagesRes.data.length === 4) {
      console.log("✅ Session Messages API passed (4 messages: 2 user, 2 AI)!");
    } else {
      console.error(`❌ Session Messages API failed! Expected 4, got ${messagesRes.data.length}`);
    }

  } catch (err) {
    console.error("❌ Test failed with error:", err.message);
    if (err.response) {
      console.error("Error Response Data:", err.response.data);
    }
  } finally {
    pool.end();
    console.log("\n=== HISTORY API TESTS RUN COMPLETE ===");
  }
}

testHistoryAPI();

const jwt = require('jsonwebtoken');
const axios = require('axios');
const pool = require('./config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_for_doctor_ai';
const mockToken = jwt.sign({ id: 1, email: 'test@example.com' }, JWT_SECRET, { expiresIn: '1h' });

async function testLanguageAndDelete() {
  console.log("=== RUNNING MULTI-LANGUAGE AND DELETE API TESTS ===");

  try {
    // 1. Clean database tables
    await pool.query('DELETE FROM chat_messages;');
    await pool.query('DELETE FROM chat_sessions;');

    // 2. Test Amharic message flow
    console.log("\nTesting Amharic message flow...");
    const amharicRes = await axios.post(`http://127.0.0.1:5000/chat/message`, 
      { message: "hi", category: "pregnancy", language: "amharic" },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      }
    );
    console.log("Amharic AI Response:", amharicRes.data.reply);

    if (amharicRes.data.reply === "ሰላም ጤና ይስጥልኝ። ዛሬ ምን እንድረዳዎት ይፈልጋሉ?") {
      console.log("✅ Amharic language mapping passed perfectly!");
    } else {
      console.error("❌ Amharic language mapping failed!");
    }

    // 3. Test Oromo message flow
    console.log("\nTesting Oromo message flow...");
    const oromoRes = await axios.post(`http://127.0.0.1:5000/chat/message`, 
      { message: "hi", category: "pregnancy", language: "oromo" },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      }
    );
    console.log("Oromo AI Response:", oromoRes.data.reply);

    if (oromoRes.data.reply === "Akkam jirtu. Har'a maal si gargaaruu danda'a?") {
      console.log("✅ Oromo language mapping passed perfectly!");
    } else {
      console.error("❌ Oromo language mapping failed!");
    }

    // 4. Test session delete API
    const deleteSessionId = amharicRes.data.session_id;
    console.log(`\nTesting session delete API for ID: ${deleteSessionId}`);
    
    const deleteRes = await axios.delete(`http://127.0.0.1:5000/api/chat/session/${deleteSessionId}`, {
      headers: { 'Authorization': `Bearer ${mockToken}` }
    });
    console.log("Delete Response Status:", deleteRes.status, deleteRes.data);

    // Verify database tables are empty/removed
    const sessionsRes = await pool.query('SELECT * FROM chat_sessions WHERE id = $1', [deleteSessionId]);
    const messagesRes = await pool.query('SELECT * FROM chat_messages WHERE session_id = $1', [deleteSessionId]);

    if (sessionsRes.rows.length === 0 && messagesRes.rows.length === 0) {
      console.log("✅ Individual session delete and CASCADE verification passed perfectly!");
    } else {
      console.error("❌ Session delete failed to clear database entries!");
    }

  } catch (err) {
    console.error("❌ Test failed with error:", err.message);
    if (err.response) {
      console.error("Error Response Data:", err.response.data);
    }
  } finally {
    pool.end();
    console.log("\n=== MULTI-LANGUAGE AND DELETE API TESTS COMPLETE ===");
  }
}

testLanguageAndDelete();

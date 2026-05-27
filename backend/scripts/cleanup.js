const pool = require('./config/db');
require('dotenv').config();

async function cleanup() {
  try {
    await pool.query('DELETE FROM chat_messages;');
    await pool.query('DELETE FROM chat_sessions;');
    console.log("Database chat tables cleaned successfully.");
  } catch (err) {
    console.error("Cleanup error:", err.message);
  } finally {
    pool.end();
  }
}

cleanup();

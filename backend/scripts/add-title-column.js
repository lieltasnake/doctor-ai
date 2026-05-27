const pool = require('./config/db');

async function addTitleColumn() {
  try {
    // 1. Alter table chat_sessions to add title if it doesn't exist
    await pool.query(`
      ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS title TEXT;
    `);
    console.log("✅ Column 'title' ensured in chat_sessions table.");
  } catch (err) {
    console.error("❌ Error adding title column:", err.message);
  } finally {
    pool.end();
  }
}

addTitleColumn();

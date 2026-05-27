const pool = require('./config/db');
require('dotenv').config();

async function checkSchema() {
  try {
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );
    console.log("Tables:", tables.rows.map(r => r.table_name));

    for (const table of ['chat_sessions', 'chat_messages']) {
      const res = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}';`
      );
      console.log(`Schema for ${table}:`, res.rows);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

checkSchema();

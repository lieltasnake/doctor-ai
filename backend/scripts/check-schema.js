const pool = require('./config/db');
require('dotenv').config();

async function checkSchema() {
  try {
    const res = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';"
    );
    console.log(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

checkSchema();

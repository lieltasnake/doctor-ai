const pool = require('./config/db');

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log("USERS SCHEMA:", res.rows);
  } catch (err) {
    console.error("Error checking users table:", err.message);
  } finally {
    pool.end();
  }
}

check();

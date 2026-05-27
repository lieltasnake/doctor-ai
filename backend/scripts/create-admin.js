const pool = require('./config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const admin = await pool.query(
      "INSERT INTO users (full_name, email, password, role) VALUES ('Admin User', 'admin@doctorai.com', $1, 'admin') RETURNING *",
      [hashedPassword]
    );
    
    console.log('Admin user created:', admin.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
        console.log('Admin user already exists.');
    } else {
        console.error('Error:', err.message);
    }
  } finally {
    pool.end();
    process.exit(0);
  }
}

createAdmin();

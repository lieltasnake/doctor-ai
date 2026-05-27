const pool = require('./config/db');
require('dotenv').config();

async function ensureTables() {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS chat_history CASCADE;
      CREATE TABLE chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        disease_category VARCHAR(100) DEFAULT 'General',
        message TEXT,
        response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Insert some mock chats
      INSERT INTO chat_history (user_id, disease_category, message, response) VALUES
      (1, 'Pregnancy', 'I have morning sickness.', 'Try to eat crackers in the morning.'),
      (1, 'Diabetes', 'My blood sugar is high.', 'Please consult your endocrinologist.'),
      (1, 'Mental Health', 'I feel anxious.', 'Deep breathing might help.');
    `);
    console.log('Tables ensured successfully.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

ensureTables();

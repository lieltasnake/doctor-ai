const pool = require('./config/db');
require('dotenv').config();

async function setupDatabase() {
  console.log("=== STARTING DATABASE SCHEMA SETUP ===");
  try {
    // 1. Drop existing tables if they exist to start fresh and clean
    console.log("Dropping existing tables if any...");
    await pool.query('DROP TABLE IF EXISTS chat_messages CASCADE;');
    await pool.query('DROP TABLE IF EXISTS chat_sessions CASCADE;');

    // 2. Create chat_sessions table
    console.log("Creating chat_sessions table...");
    await pool.query(`
      CREATE TABLE chat_sessions (
        id UUID PRIMARY KEY,
        user_id INTEGER NOT NULL,
        category TEXT CHECK (category IN ('pregnancy', 'diabetes', 'mental', 'general')),
        title TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create chat_messages table
    console.log("Creating chat_messages table...");
    await pool.query(`
      CREATE TABLE chat_messages (
        id UUID PRIMARY KEY,
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role TEXT CHECK (role IN ('user', 'assistant')),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Database schema setup completed successfully!");

  } catch (err) {
    console.error("❌ Database schema setup failed:", err.message);
  } finally {
    pool.end();
    console.log("=== DATABASE SCHEMA SETUP FINISHED ===");
  }
}

setupDatabase();

const pool = require('./config/db');

async function createTables() {
  try {
    // 1. Try to create users table with UUID if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        full_name TEXT,
        email TEXT UNIQUE,
        password TEXT
      );
    `).catch(err => {
      console.log("Note: users table might already exist:", err.message);
    });

    // Detect data type of users.id to prevent reference type mismatches
    const typeRes = await pool.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id';
    `);
    
    let userIdType = "UUID";
    if (typeRes.rows.length > 0) {
      const dbType = typeRes.rows[0].data_type.toLowerCase();
      if (dbType.includes("integer") || dbType.includes("serial")) {
        userIdType = "INTEGER";
      } else {
        userIdType = "UUID";
      }
    }
    console.log(`Detected users.id type: ${userIdType}`);

    // 2. Create chat_sessions table matching user_id type
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY,
        user_id ${userIdType} REFERENCES users(id) ON DELETE CASCADE,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create chat_messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY,
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role TEXT,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ PostgreSQL tables created/verified successfully.");
  } catch (err) {
    console.error("❌ Error ensuring tables:", err.message);
  } finally {
    pool.end();
  }
}

createTables();

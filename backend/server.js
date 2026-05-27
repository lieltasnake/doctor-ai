const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const pool = require('./config/db');
const authMiddleware = require('./middleware/auth');
const crypto = require('crypto');
require('dotenv').config();
const geminiService = require('./services/geminiService');
const app = express();
app.use(cors());
app.use(express.json());

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: 'User exists' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 'patient') RETURNING id, full_name, email, role",
      [name, email, hashedPassword]
    );
    res.status(201).json({ message: 'Success', user: newUser.rows[0] });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found with this email' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password=$1 WHERE email=$2', [hashedPassword, email]);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (user.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    const payload = { id: user.rows[0].id, role: user.rows[0].role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user.rows[0].id, 
        full_name: user.rows[0].full_name, 
        email: user.rows[0].email, 
        role: user.rows[0].role,
        profile_image: user.rows[0].profile_image,
        created_at: user.rows[0].created_at
      } 
    });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const users = await pool.query('SELECT id, full_name, email, role, created_at FROM users');
    res.json(users.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.delete('/users/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/admin/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    let query = 'SELECT id, full_name, email, role, created_at FROM users';
    let params = [];
    if (req.query.role) {
      query += ' WHERE role=$1';
      params.push(req.query.role);
    }
    query += ' ORDER BY created_at DESC';
    const users = await pool.query(query, params);
    res.json(users.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/admin/chats', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    let query = `
      SELECT 
        s.id, 
        u.full_name as user_name, 
        s.category as disease_category, 
        COALESCE(s.title, (SELECT message FROM chat_messages WHERE session_id = s.id AND role = 'user' ORDER BY created_at ASC LIMIT 1), 'New Consultation') as message_preview, 
        s.created_at 
      FROM chat_sessions s
      LEFT JOIN users u ON s.user_id = u.id
    `;
    let params = [];
    
    let dbCategory = req.query.category;
    if (dbCategory) {
       const catLower = dbCategory.toLowerCase();
       if (catLower.includes('pregnancy')) dbCategory = 'pregnancy';
       else if (catLower.includes('diabetes')) dbCategory = 'diabetes';
       else if (catLower.includes('mental')) dbCategory = 'mental';
       else dbCategory = catLower;

       query += ' WHERE s.category = $1';
       params.push(dbCategory);
    }
    
    query += ' ORDER BY s.created_at DESC';
    const chats = await pool.query(query, params);
    res.json(chats.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.put('/admin/user/:id/role', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { role } = req.body;
    await pool.query('UPDATE users SET role=$1 WHERE id=$2', [role, req.params.id]);
    res.json({ message: 'Role updated' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.delete('/admin/user/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/admin/stats', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const usersRes = await pool.query('SELECT COUNT(*) FROM users');
    const patientsRes = await pool.query("SELECT COUNT(*) FROM users WHERE role='patient'");
    const adminsRes = await pool.query("SELECT COUNT(*) FROM users WHERE role='admin'");
    const chatsRes = await pool.query('SELECT COUNT(*) FROM chat_sessions');
    
    const topCategoryRes = await pool.query(
      'SELECT category as disease_category, COUNT(*) as count FROM chat_sessions GROUP BY category ORDER BY count DESC LIMIT 1'
    );
    const mostUsedCategory = topCategoryRes.rows.length > 0 ? topCategoryRes.rows[0].disease_category : 'N/A';
    
    const activeUsersRes = await pool.query('SELECT COUNT(DISTINCT user_id) FROM chat_sessions');

    let healthScore = 100;
    try {
      const aiUrl = process.env.AI_MODULE_URL || 'http://127.0.0.1:5001';
      await axios.get(`${aiUrl}/`, { timeout: 3000 });
    } catch (e) {
      // If AI server is down, we deduct 50%
      healthScore -= 50;
    }

    res.json({
      totalUsers: parseInt(usersRes.rows[0].count || 0),
      totalPatients: parseInt(patientsRes.rows[0].count || 0),
      totalAdmins: parseInt(adminsRes.rows[0].count || 0),
      totalChats: parseInt(chatsRes.rows[0].count || 0),
      mostUsedCategory,
      activeUsers: parseInt(activeUsersRes.rows[0].count || 0),
      systemHealth: healthScore
    });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

app.put('/update-account', authMiddleware, async (req, res) => {
  const { name, email, password, profile_image } = req.body;
  try {
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await pool.query('UPDATE users SET full_name=$1, email=$2, password=$3, profile_image=$4 WHERE id=$5', [name, email, hashedPassword, profile_image, req.user.id]);
    } else {
      await pool.query('UPDATE users SET full_name=$1, email=$2, profile_image=$3 WHERE id=$4', [name, email, profile_image, req.user.id]);
    }
    const updatedUser = await pool.query('SELECT id, full_name, email, role, profile_image, created_at FROM users WHERE id=$1', [req.user.id]);
    res.json({ message: 'Updated', user: updatedUser.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

app.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file' });
  try {
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(req.file.path), req.file.originalname);
    
    const aiResponse = await axios.post(`${process.env.AI_MODULE_URL}/ai/speech-to-text`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000,
    });
    
    fs.unlinkSync(req.file.path);
    res.json({ text: aiResponse.data.text });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Speech error:', err.message);
    res.status(500).json({ error: 'Speech recognition failed', detail: err.message });
  }
});

app.post('/analyze-symptoms', authMiddleware, async (req, res) => {
  const { description } = req.body;
  try {
    let aiResponse;
    try { aiResponse = await axios.post(`${process.env.AI_MODULE_URL}/analyze`, { text: description }); }
    catch (e) { aiResponse = { data: { condition: 'Undetermined', risk: 'Low', advice: 'AI Offline' } }; }
    
    const reply = aiResponse.data.reply || aiResponse.data.advice || 'No response from AI.';
    const condition = aiResponse.data.condition || 'General';
    await pool.query(
      'INSERT INTO chat_history (user_id, disease_category, message, response) VALUES ($1, $2, $3, $4)', 
      [req.user.id, condition, description, reply]
    );
    res.json(aiResponse.data);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

const handleChatMessage = async (req, res, forceCategory) => {
  const { session_id, message, category: bodyCategory, language } = req.body;
  const userId = req.user.id;
  const category = forceCategory || bodyCategory || 'general';

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Gracefully generate a session ID if not passed
  let sessionId = session_id;
  if (!sessionId) {
    const sessionRes = await pool.query(
      'SELECT id FROM chat_sessions WHERE user_id = $1 AND category = $2 LIMIT 1',
      [userId, category]
    );
    if (sessionRes.rows.length > 0) {
      sessionId = sessionRes.rows[0].id;
    } else {
      sessionId = crypto.randomUUID();
      await pool.query(
        'INSERT INTO chat_sessions (id, user_id, category) VALUES ($1, $2, $3)',
        [sessionId, userId, category]
      );
    }
  } else {
    // Ensure session exists
    const sessionRes = await pool.query(
      'SELECT id FROM chat_sessions WHERE id = $1 LIMIT 1',
      [sessionId]
    );
    if (sessionRes.rows.length === 0) {
      await pool.query(
        'INSERT INTO chat_sessions (id, user_id, category) VALUES ($1, $2, $3)',
        [sessionId, userId, category]
      );
    }
  }

  try {
    // 1. Fetch existing messages from DB
    const historyRes = await pool.query(
      'SELECT role, message FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );

    // 2. Build history in simple format for final_year Flask API
    const history = historyRes.rows.map(row => ({
      role: row.role === 'user' ? 'user' : 'assistant',
      content: row.message
    }));

    // 3. Call final_year Flask API at /predict
    let aiResponse;
    try {
      aiResponse = await axios.post(`${process.env.AI_MODULE_URL || 'http://127.0.0.1:5001'}/predict`, {
        category: category,
        message: message,
        history: history,
        language: language || 'english'
      });
    } catch (aiErr) {
      console.error('AI Module failure:', aiErr.message);
      return res.status(503).json({ error: 'AI temporarily unavailable.' });
    }

    const reply     = aiResponse.data.reply     || '';
    const condition = aiResponse.data.condition || null;
    const risk      = aiResponse.data.risk      || null;
    const phase     = aiResponse.data.phase     || null;

    // 4. Save user message and AI reply
    await pool.query(
      'INSERT INTO chat_messages (id, session_id, role, message) VALUES ($1, $2, $3, $4)',
      [crypto.randomUUID(), sessionId, 'user', message]
    );
    await pool.query(
      'INSERT INTO chat_messages (id, session_id, role, message) VALUES ($1, $2, $3, $4)',
      [crypto.randomUUID(), sessionId, 'assistant', reply]
    );

    // 5. Auto-set title from first message
    const titleRes = await pool.query('SELECT title FROM chat_sessions WHERE id = $1', [sessionId]);
    if (titleRes.rows.length > 0 && !titleRes.rows[0].title) {
      await pool.query('UPDATE chat_sessions SET title = $1 WHERE id = $2', [message.substring(0, 50), sessionId]);
    }

    // 6. Return response
    res.json({ reply, condition, risk, phase, session_id: sessionId });

  } catch (err) {
    console.error('Error in handleChatMessage:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
app.post('/api/chat/session', authMiddleware, async (req, res) => {
  const { user_id, category } = req.body;
  const userId = user_id || req.user.id;
  
  let dbCategory = 'general';
  const catLower = (category || '').toLowerCase();
  if (catLower.includes('pregnancy')) dbCategory = 'pregnancy';
  else if (catLower.includes('diabetes')) dbCategory = 'diabetes';
  else if (catLower.includes('mental')) dbCategory = 'mental';

  const sessionId = crypto.randomUUID();
  try {
    await pool.query(
      'INSERT INTO chat_sessions (id, user_id, category) VALUES ($1, $2, $3)',
      [sessionId, userId, dbCategory]
    );
    res.status(201).json({ session_id: sessionId });
  } catch (err) {
    console.error("Error creating session:", err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/chat/message', authMiddleware, async (req, res) => {
  await handleChatMessage(req, res);
});

app.post('/chat/message', authMiddleware, async (req, res) => {
  await handleChatMessage(req, res);
});

app.post('/api/chat/pregnancy', authMiddleware, async (req, res) => {
  await handleChatMessage(req, res, 'pregnancy');
});

app.post('/api/chat/diabetes', authMiddleware, async (req, res) => {
  await handleChatMessage(req, res, 'diabetes');
});

app.post('/api/chat/mental', async (req, res) => {
  const { message, session_id } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  try {
    // Load conversation history if session exists
    let history = [];
    if (session_id) {
      const sessionCheck = await pool.query('SELECT id FROM chat_sessions WHERE id=$1', [session_id]);
      if (sessionCheck.rows.length > 0) {
        const historyRes = await pool.query(
          'SELECT role, message FROM chat_messages WHERE session_id=$1 ORDER BY created_at ASC',
          [session_id]
        );
        history = historyRes.rows.map(r => ({
          role: r.role === 'user' ? 'user' : 'assistant',
          content: r.message
        }));
      }
    }

    const aiResponse = await axios.post(
      `${process.env.AI_MODULE_URL || 'http://127.0.0.1:5001'}/ai/mental`,
      { message, history, language: req.body.language || 'english' }
    );
    const reply     = aiResponse.data.reply     || '';
    const condition = aiResponse.data.condition || null;
    const risk      = aiResponse.data.risk      || null;
    const phase     = aiResponse.data.phase     || null;

    // Save messages if session exists
    if (session_id) {
      const sessionCheck = await pool.query('SELECT id FROM chat_sessions WHERE id=$1', [session_id]);
      if (sessionCheck.rows.length > 0) {
        await pool.query('INSERT INTO chat_messages (id, session_id, role, message) VALUES ($1,$2,$3,$4)', [crypto.randomUUID(), session_id, 'user', message]);
        await pool.query('INSERT INTO chat_messages (id, session_id, role, message) VALUES ($1,$2,$3,$4)', [crypto.randomUUID(), session_id, 'assistant', reply]);
        const t = await pool.query('SELECT title FROM chat_sessions WHERE id=$1', [session_id]);
        if (t.rows.length > 0 && !t.rows[0].title) {
          await pool.query('UPDATE chat_sessions SET title=$1 WHERE id=$2', [message.substring(0,50), session_id]);
        }
      }
    }
    res.json({ reply, condition, risk, phase });
  } catch (err) {
    console.error('Error /api/chat/mental:', err.message);
    res.status(500).json({ error: 'AI server error' });
  }
});

app.post('/api/chat/general', authMiddleware, async (req, res) => {
  await handleChatMessage(req, res, 'general');
});


app.get('/api/chat/sessions/:user_id', authMiddleware, async (req, res) => {
  const userId = req.params.user_id;
  console.log("Fetching sessions:", userId);
  try {
    const sessionsRes = await pool.query(
      `SELECT s.id, s.category, s.created_at,
              COALESCE(s.title, (SELECT message FROM chat_messages WHERE session_id = s.id ORDER BY created_at ASC LIMIT 1), 'New Consultation') as title
       FROM chat_sessions s
       WHERE s.user_id = $1
       AND EXISTS (SELECT 1 FROM chat_messages WHERE session_id = s.id)
       ORDER BY s.created_at DESC`,
      [userId]
    );
    const sessions = sessionsRes.rows.map(row => ({
      id: row.id,
      title: row.title || 'New Consultation',
      category: row.category,
      created_at: row.created_at
    }));
    console.log("Sessions:", sessions);
    res.json(sessions);
  } catch (err) {
    console.error("Error fetching sessions:", err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/chat/session/:session_id', authMiddleware, async (req, res) => {
  const sessionId = req.params.session_id;
  console.log("Fetching messages:", sessionId);
  try {
    const messagesRes = await pool.query(
      'SELECT role, message FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );
    console.log("Messages:", messagesRes.rows);
    res.json(messagesRes.rows);
  } catch (err) {
    console.error("Error fetching messages:", err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await pool.query('SELECT disease_category, message, response, created_at FROM chat_history WHERE user_id=$1 ORDER BY created_at ASC', [req.user.id]);
    res.json(history.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/chat/session/:session_id', authMiddleware, async (req, res) => {
  const sessionId = req.params.session_id;
  try {
    await pool.query('DELETE FROM chat_sessions WHERE id = $1', [sessionId]);
    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error("Error deleting session:", err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/history', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM chat_history WHERE user_id=$1', [req.user.id]);
    await pool.query('DELETE FROM chat_sessions WHERE user_id=$1', [req.user.id]);
    res.json({ message: 'History deleted' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await pool.query('SELECT id, full_name, email, role, profile_image, created_at FROM users WHERE id=$1', [req.user.id]);
    res.json(user.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'patient',
        profile_image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(50),
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY,
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role VARCHAR(50) CHECK (role IN ('user', 'assistant')),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        disease_category VARCHAR(100) DEFAULT 'General',
        message TEXT,
        response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Seed admin accounts
    const admins = [
      { name: 'Mahlet', email: 'mahletalemu@gmail.com', password: 'Mahlet@2412' },
      { name: 'Lielt', email: 'lieltasnake@gmail.com', password: 'lielt@1234' }
    ];

    for (let admin of admins) {
      const res = await pool.query('SELECT * FROM users WHERE email=$1', [admin.email]);
      if (res.rows.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(admin.password, salt);
        await pool.query(
          "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 'admin')",
          [admin.name, admin.email, hashedPassword]
        );
        console.log(`✅ Created admin: ${admin.email}`);
      } else if (res.rows[0].role !== 'admin') {
        await pool.query("UPDATE users SET role='admin' WHERE email=$1", [admin.email]);
        console.log(`✅ Upgraded to admin: ${admin.email}`);
      }
    }

    console.log('✅ Database tables ensured.');
  } catch (err) {
    console.error('❌ Error initializing database tables:', err.message);
  }
};

initDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => console.log(`Backend running on 0.0.0.0:${PORT}`));
});


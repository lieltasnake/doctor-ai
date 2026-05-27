const { Pool } = require('pg');
require('dotenv').config();

// Initialize the database connection pool using environment variables
const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
          }
        : {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
          }
);

pool.connect()
    .then(() => console.log('✅ PostgreSQL connected successfully'))
    .catch(err => console.error('❌ PostgreSQL connection error', err.stack));

module.exports = pool;

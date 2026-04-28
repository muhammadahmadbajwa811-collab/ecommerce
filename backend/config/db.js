// config/db.js
// ─────────────────────────────────────────────────────────────
//  Creates a MySQL connection POOL.
//  A pool = a bucket of ready-made connections so the server
//  never has to wait to "dial up" the database each time.
// ─────────────────────────────────────────────────────────────
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'ecommerce_db',
  port:     process.env.DB_PORT     || 3306,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

// Quick test on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
})();

module.exports = pool;

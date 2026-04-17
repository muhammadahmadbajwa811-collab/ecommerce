// server.js  — the HEART of the backend
// ─────────────────────────────────────────────────────────────
//  This file starts the Express web server, connects all the
//  route files, and listens on a port for incoming requests.
// ─────────────────────────────────────────────────────────────
require('dotenv').config();           // load .env variables first
const express = require('express');
const cors    = require('cors');

const app = express();

// ── Middleware ────────────────────────────────────────────────
// CORS: allow the frontend (running on a different port) to talk to us
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ],
  credentials: true,
}));

// Parse incoming JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));

// ── Health check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🛒 E-Commerce API is running!',
    version: '1.0.0',
    endpoints: ['/api/auth', '/api/products', '/api/cart', '/api/orders'],
  });
});

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
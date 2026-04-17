// routes/auth.js
// ─────────────────────────────────────────────────────────────
//  POST /api/auth/register  — create account
//  POST /api/auth/login     — get token
//  GET  /api/auth/me        — get current user (needs token)
// ─────────────────────────────────────────────────────────────
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db       = require('../config/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── Helper: generate a signed JWT ───────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// ─────────────────────────────────────────────────────────────
//  REGISTER
// ─────────────────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    // 1. Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // 2. Check if email already exists
      const [existing] = await db.execute(
        'SELECT id FROM users WHERE email = ?', [email]
      );
      if (existing.length > 0) {
        return res.status(409).json({ message: 'Email already registered.' });
      }

      // 3. Hash the password (bcrypt adds a "salt" automatically)
      const hashed = await bcrypt.hash(password, 12);

      // 4. Insert new user
      const [result] = await db.execute(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashed]
      );

      // 5. Return token so user is instantly logged in
      const user = { id: result.insertId, email, name, role: 'user' };
      const token = signToken(user);

      res.status(201).json({ token, user: { id: user.id, name, email, role: 'user' } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─────────────────────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // 1. Find user by email
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE email = ?', [email]
      );
      if (rows.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const user = rows[0];

      // 2. Compare submitted password with stored hash
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // 3. Return token
      const token = signToken(user);
      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─────────────────────────────────────────────────────────────
//  GET CURRENT USER  (protected)
// ─────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
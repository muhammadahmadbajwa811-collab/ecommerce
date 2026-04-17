// routes/cart.js
// ─────────────────────────────────────────────────────────────
//  All cart routes require a logged-in user (JWT token)
//
//  GET    /api/cart         — view cart
//  POST   /api/cart         — add item
//  PUT    /api/cart/:id     — update quantity
//  DELETE /api/cart/:id     — remove one item
//  DELETE /api/cart         — clear entire cart
// ─────────────────────────────────────────────────────────────
const express  = require('express');
const db       = require('../config/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All cart routes are protected
router.use(protect);

// ── GET cart ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [items] = await db.execute(
      `SELECT c.id, c.quantity,
              p.id AS product_id, p.name, p.price, p.image_url, p.stock
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    res.json({ items, total: parseFloat(total.toFixed(2)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── ADD to cart ───────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ message: 'product_id required' });

  try {
    // Check product exists and has stock
    const [[product]] = await db.execute(
      'SELECT id, stock FROM products WHERE id = ?', [product_id]
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ message: 'Not enough stock' });

    // Insert or update quantity if already in cart
    await db.execute(
      `INSERT INTO cart (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.user.id, product_id, quantity]
    );

    res.json({ message: 'Added to cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── UPDATE quantity ───────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ message: 'quantity >= 1 required' });

  try {
    const [result] = await db.execute(
      'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Cart item not found' });
    res.json({ message: 'Quantity updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── REMOVE one item ───────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await db.execute(
      'DELETE FROM cart WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── CLEAR entire cart ─────────────────────────────────────────
router.delete('/', async (req, res) => {
  try {
    await db.execute('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
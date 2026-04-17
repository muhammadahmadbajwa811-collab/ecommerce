// routes/orders.js
// ─────────────────────────────────────────────────────────────
//  POST /api/orders          — place order (checkout)
//  GET  /api/orders          — my order history
//  GET  /api/orders/:id      — single order detail
//  PUT  /api/orders/:id/status — update status (admin)
// ─────────────────────────────────────────────────────────────
const express  = require('express');
const db       = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ── PLACE ORDER (checkout) ────────────────────────────────────
router.post('/', async (req, res) => {
  const { shipping_name, shipping_address, shipping_city, shipping_zip } = req.body;

  if (!shipping_name || !shipping_address || !shipping_city || !shipping_zip) {
    return res.status(400).json({ message: 'All shipping fields required' });
  }

  // Use a DB connection so we can do a TRANSACTION
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Get user's cart
    const [cartItems] = await conn.execute(
      `SELECT c.quantity, p.id AS product_id, p.price, p.stock, p.name
       FROM cart c JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    if (cartItems.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // 2. Check stock for every item
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        await conn.rollback();
        return res.status(400).json({ message: `"${item.name}" has insufficient stock.` });
      }
    }

    // 3. Calculate total
    const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // 4. Create the order header
    const [orderResult] = await conn.execute(
      `INSERT INTO orders (user_id, total, shipping_name, shipping_address, shipping_city, shipping_zip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, total.toFixed(2), shipping_name, shipping_address, shipping_city, shipping_zip]
    );
    const orderId = orderResult.insertId;

    // 5. Insert order items & decrement stock
    for (const item of cartItems) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?,?,?,?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      await conn.execute(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 6. Clear the cart
    await conn.execute('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

    await conn.commit();

    res.status(201).json({ message: 'Order placed successfully!', orderId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error during checkout' });
  } finally {
    conn.release();
  }
});

// ── GET my orders ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [orders] = await db.execute(
      `SELECT o.*, COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET single order ──────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [[order]] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const [items] = await db.execute(
      `SELECT oi.*, p.name, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── UPDATE order status (admin) ───────────────────────────────
router.put('/:id/status', adminOnly, async (req, res) => {
  const { status } = req.body;
  const valid = ['pending','processing','shipped','delivered','cancelled'];
  if (!valid.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
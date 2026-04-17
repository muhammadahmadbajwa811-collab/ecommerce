// routes/products.js  (FIXED VERSION)
const express = require('express');
const db      = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── GET all categories (must be BEFORE /:id) ─────────────────
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET all products ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.max(1, parseInt(req.query.limit) || 12);
    const offset = (page - 1) * limit;

    let whereSql = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereSql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      whereSql += ' AND p.category_id = ?';
      params.push(parseInt(category));
    }

    const sortMap = {
      price_asc:  'p.price ASC',
      price_desc: 'p.price DESC',
      newest:     'p.created_at DESC',
      name:       'p.name ASC',
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';

    // KEY FIX: LIMIT and OFFSET go directly in SQL, NOT as ? params
    const sql = `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await db.execute(sql, params);

    const countSql = `SELECT COUNT(*) AS total FROM products p ${whereSql}`;
    const [[{ total }]] = await db.execute(countSql, params);

    res.json({ products: rows, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Products list error:', err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// ── GET single product ────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [parseInt(req.params.id)]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Product get error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── CREATE product (admin) ────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  const { name, description, price, stock, image_url, category_id } = req.body;
  if (!name || !price) return res.status(400).json({ message: 'name and price required' });
  try {
    const [result] = await db.execute(
      'INSERT INTO products (name, description, price, stock, image_url, category_id) VALUES (?,?,?,?,?,?)',
      [name, description, parseFloat(price), parseInt(stock) || 0, image_url, category_id || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Product created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── UPDATE product (admin) ────────────────────────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  const { name, description, price, stock, image_url, category_id } = req.body;
  try {
    await db.execute(
      'UPDATE products SET name=?, description=?, price=?, stock=?, image_url=?, category_id=? WHERE id=?',
      [name, description, parseFloat(price), parseInt(stock), image_url, category_id, parseInt(req.params.id)]
    );
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE product (admin) ────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await db.execute('DELETE FROM products WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
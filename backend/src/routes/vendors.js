const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/vendors  — public list
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.id,v.shop_name,v.description,v.location,v.image_url,v.is_open,v.rating,v.total_ratings,u.name AS owner_name
       FROM vendors v JOIN users u ON v.user_id=u.id WHERE v.is_approved=true ORDER BY v.is_open DESC,v.rating DESC`
    );
    res.json({ vendors: result.rows });
  } catch { res.status(500).json({ error: 'Failed to fetch vendors' }); }
});

// GET /api/vendors/my/profile  — must come BEFORE /:id
router.get('/my/profile', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM vendors WHERE user_id=$1', [req.user.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ vendor: r.rows[0] });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// PATCH /api/vendors/my/profile
router.patch('/my/profile', authenticate, requireRole('vendor'), async (req, res) => {
  const { shop_name, description, location, image_url } = req.body;
  try {
    const r = await pool.query(
      `UPDATE vendors SET shop_name=COALESCE($1,shop_name),description=COALESCE($2,description),
       location=COALESCE($3,location),image_url=COALESCE($4,image_url),updated_at=NOW()
       WHERE user_id=$5 RETURNING *`,
      [shop_name, description, location, image_url, req.user.id]
    );
    res.json({ vendor: r.rows[0] });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// PATCH /api/vendors/my/toggle
router.patch('/my/toggle', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE vendors SET is_open=NOT is_open,updated_at=NOW() WHERE user_id=$1 RETURNING id,shop_name,is_open`,
      [req.user.id]
    );
    res.json({ vendor: r.rows[0] });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// GET /api/vendors/my/menu
router.get('/my/menu', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const v = await pool.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    if (!v.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    const items = await pool.query(
      'SELECT * FROM menu_items WHERE vendor_id=$1 ORDER BY category,name', [v.rows[0].id]
    );
    res.json({ menu: items.rows });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// POST /api/vendors/my/menu
router.post('/my/menu', authenticate, requireRole('vendor'), [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, description, price, image_url, category } = req.body;
  try {
    const v = await pool.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    if (!v.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    const r = await pool.query(
      `INSERT INTO menu_items (vendor_id,name,description,price,image_url,category)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [v.rows[0].id, name, description||null, price, image_url||null, category||'food']
    );
    res.status(201).json({ item: r.rows[0] });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// PATCH /api/vendors/my/menu/:itemId
router.patch('/my/menu/:itemId', authenticate, requireRole('vendor'), async (req, res) => {
  const { itemId } = req.params;
  const { name, description, price, image_url, category, is_available } = req.body;
  try {
    const v = await pool.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    if (!v.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    const r = await pool.query(
      `UPDATE menu_items SET name=COALESCE($1,name),description=COALESCE($2,description),
       price=COALESCE($3,price),image_url=COALESCE($4,image_url),category=COALESCE($5,category),
       is_available=COALESCE($6,is_available),updated_at=NOW()
       WHERE id=$7 AND vendor_id=$8 RETURNING *`,
      [name, description, price, image_url, category, is_available, itemId, v.rows[0].id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Item not found' });
    res.json({ item: r.rows[0] });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// DELETE /api/vendors/my/menu/:itemId
router.delete('/my/menu/:itemId', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const v = await pool.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    if (!v.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    await pool.query('DELETE FROM menu_items WHERE id=$1 AND vendor_id=$2', [req.params.itemId, v.rows[0].id]);
    res.json({ message: 'Item deleted' });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// GET /api/vendors/:id  — public single vendor + menu
router.get('/:id', async (req, res) => {
  try {
    const vr = await pool.query(
      `SELECT v.id,v.shop_name,v.description,v.location,v.image_url,v.is_open,v.rating,v.total_ratings,u.name AS owner_name
       FROM vendors v JOIN users u ON v.user_id=u.id WHERE v.id=$1 AND v.is_approved=true`,
      [req.params.id]
    );
    if (!vr.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    const menu = await pool.query(
      'SELECT id,name,description,price,image_url,category,is_available FROM menu_items WHERE vendor_id=$1 ORDER BY category,name',
      [req.params.id]
    );
    res.json({ vendor: vr.rows[0], menu: menu.rows });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;

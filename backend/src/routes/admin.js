const express = require('express');
const bcrypt  = require('bcryptjs');
const pool    = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require admin — except the bootstrap seed
router.use((req, res, next) => {
  if (req.path === '/seed' && req.method === 'POST') return next();
  authenticate(req, res, () => requireRole('admin')(req, res, next));
});

// POST /api/admin/seed  — creates first admin (only works when no admins exist)
router.post('/seed', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  try {
    const adminCount = await pool.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
    if (adminCount.rows.length) return res.status(403).json({ error: 'Admin already exists. Use login.' });
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email taken' });
    const hash = await bcrypt.hash(password, 12);
    const r = await pool.query(
      `INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,'admin') RETURNING id,name,email,role`,
      [name, email, hash]
    );
    res.status(201).json({ message: 'Admin created', user: r.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// GET /api/admin/stats
router.get('/stats', async (_req, res) => {
  try {
    const [users, vendors, orders, revenue] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total,
        SUM(CASE WHEN role='student' THEN 1 ELSE 0 END) AS students,
        SUM(CASE WHEN role='delivery_partner' THEN 1 ELSE 0 END) AS delivery_partners FROM users WHERE is_active=true`),
      pool.query(`SELECT COUNT(*) AS total,
        SUM(CASE WHEN is_approved THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN is_open THEN 1 ELSE 0 END) AS open FROM vendors`),
      pool.query(`SELECT COUNT(*) AS total,
        SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) AS delivered,
        SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled,
        SUM(CASE WHEN DATE(created_at)=CURRENT_DATE THEN 1 ELSE 0 END) AS today FROM orders`),
      pool.query(`SELECT COALESCE(SUM(commission),0) AS total_commission,
        COALESCE(SUM(delivery_fee),0) AS total_delivery_fees FROM orders WHERE status='delivered'`),
    ]);
    res.json({ users: users.rows[0], vendors: vendors.rows[0], orders: orders.rows[0], revenue: revenue.rows[0] });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  let where = '';
  if (role) { where = 'WHERE role=$1'; params.push(role); }
  params.push(limit, offset);
  try {
    const r = await pool.query(
      `SELECT id,name,email,student_id,phone,role,hostel,room_number,reward_points,is_active,created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    res.json({ users: r.rows });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// PATCH /api/admin/users/:id/toggle
router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE users SET is_active=NOT is_active WHERE id=$1 RETURNING id,name,email,role,is_active`,
      [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: r.rows[0] });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// GET /api/admin/vendors
router.get('/vendors', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT v.*,u.name AS owner_name,u.email AS owner_email,u.phone AS owner_phone
       FROM vendors v JOIN users u ON v.user_id=u.id ORDER BY v.created_at DESC`
    );
    res.json({ vendors: r.rows });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// PATCH /api/admin/vendors/:id/approve
router.patch('/vendors/:id/approve', async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE vendors SET is_approved=true WHERE id=$1 RETURNING id,shop_name,is_approved`,
      [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ vendor: r.rows[0] });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// PATCH /api/admin/vendors/:id/reject
router.patch('/vendors/:id/reject', async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE vendors SET is_approved=false WHERE id=$1 RETURNING id,shop_name,is_approved`,
      [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ vendor: r.rows[0] });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  const { status, page = 1, limit = 30 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  let where = '';
  if (status) { where = 'WHERE o.status=$1'; params.push(status); }
  params.push(limit, offset);
  try {
    const r = await pool.query(
      `SELECT o.id,o.status,o.total_amount,o.delivery_fee,o.commission,o.delivery_address,o.created_at,
              u.name AS student_name,v.shop_name,dp.name AS delivery_partner_name
       FROM orders o JOIN users u ON o.student_id=u.id JOIN vendors v ON o.vendor_id=v.id
       LEFT JOIN users dp ON o.delivery_partner_id=dp.id
       ${where} ORDER BY o.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    res.json({ orders: r.rows });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;

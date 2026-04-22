const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const DELIVERY_FEE = 15.00;
const COMMISSION_RATE = 0.10;

async function addPoints(userId, points, reason, orderId = null) {
  await pool.query('UPDATE users SET reward_points=reward_points+$1 WHERE id=$2', [points, userId]);
  await pool.query(
    'INSERT INTO reward_transactions (user_id,points,reason,order_id) VALUES ($1,$2,$3,$4)',
    [userId, points, reason, orderId]
  );
}

async function emitStatus(io, orderId, status, extra = {}) {
  if (io) io.to(`order:${orderId}`).emit('order:status_update', { order_id: orderId, status, ...extra });
}

// GET /api/orders/my  — must be before /:id
router.get('/my', authenticate, requireRole('student'), async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT o.*,v.shop_name,v.location AS vendor_location,u.name AS delivery_partner_name
       FROM orders o JOIN vendors v ON o.vendor_id=v.id LEFT JOIN users u ON o.delivery_partner_id=u.id
       WHERE o.student_id=$1 ORDER BY o.created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const result = [];
    for (const o of orders.rows) {
      const items = await pool.query('SELECT * FROM order_items WHERE order_id=$1', [o.id]);
      result.push({ ...o, items: items.rows });
    }
    res.json({ orders: result });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// GET /api/orders/vendor/incoming  — must be before /:id
router.get('/vendor/incoming', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const v = await pool.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    if (!v.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    const orders = await pool.query(
      `SELECT o.*,u.name AS student_name,u.phone AS student_phone
       FROM orders o JOIN users u ON o.student_id=u.id
       WHERE o.vendor_id=$1 AND o.status NOT IN ('delivered','cancelled') ORDER BY o.created_at ASC`,
      [v.rows[0].id]
    );
    const result = [];
    for (const o of orders.rows) {
      const items = await pool.query('SELECT * FROM order_items WHERE order_id=$1', [o.id]);
      result.push({ ...o, items: items.rows });
    }
    res.json({ orders: result });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// POST /api/orders
router.post('/', authenticate, requireRole('student'), [
  body('vendor_id').isUUID(),
  body('items').isArray({ min: 1 }),
  body('delivery_address').trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { vendor_id, items, delivery_address, special_note } = req.body;
  const io = req.app.get('io');
  try {
    const vr = await pool.query('SELECT id,shop_name,is_open,is_approved FROM vendors WHERE id=$1', [vendor_id]);
    if (!vr.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    const vendor = vr.rows[0];
    if (!vendor.is_approved) return res.status(400).json({ error: 'Vendor not approved' });
    if (!vendor.is_open)     return res.status(400).json({ error: 'Vendor is closed' });

    const itemIds = items.map(i => i.menu_item_id);
    const menuRes = await pool.query(
      'SELECT id,name,price,is_available,vendor_id FROM menu_items WHERE id=ANY($1::uuid[])', [itemIds]
    );
    const menuMap = {};
    menuRes.rows.forEach(m => menuMap[m.id] = m);

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const m = menuMap[item.menu_item_id];
      if (!m) return res.status(400).json({ error: `Item not found` });
      if (!m.is_available) return res.status(400).json({ error: `${m.name} unavailable` });
      if (m.vendor_id !== vendor_id) return res.status(400).json({ error: 'Item/vendor mismatch' });
      const line = parseFloat(m.price) * item.quantity;
      subtotal += line;
      orderItems.push({ menu_item_id: item.menu_item_id, name: m.name, quantity: item.quantity, unit_price: m.price });
    }

    const commission   = parseFloat((subtotal * COMMISSION_RATE).toFixed(2));
    const total_amount = parseFloat((subtotal + DELIVERY_FEE).toFixed(2));

    const or = await pool.query(
      `INSERT INTO orders (student_id,vendor_id,delivery_address,special_note,subtotal,delivery_fee,commission,total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, vendor_id, delivery_address, special_note||null, subtotal, DELIVERY_FEE, commission, total_amount]
    );
    const order = or.rows[0];

    for (const item of orderItems) {
      await pool.query(
        'INSERT INTO order_items (order_id,menu_item_id,name,quantity,unit_price) VALUES ($1,$2,$3,$4,$5)',
        [order.id, item.menu_item_id, item.name, item.quantity, item.unit_price]
      );
    }

    await addPoints(req.user.id, 5, 'order_placed', order.id);

    if (io) io.to(`vendor:${vendor_id}`).emit('order:new', {
      order_id: order.id, student_name: req.user.name, delivery_address,
      items: orderItems, total_amount, special_note,
    });

    res.status(201).json({ order: { ...order, items: orderItems } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to place order' }); }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const or = await pool.query(
      `SELECT o.*,v.shop_name,v.location AS vendor_location,u.name AS student_name,u.phone AS student_phone,
              dp.name AS delivery_partner_name,dp.phone AS delivery_partner_phone
       FROM orders o JOIN vendors v ON o.vendor_id=v.id JOIN users u ON o.student_id=u.id
       LEFT JOIN users dp ON o.delivery_partner_id=dp.id WHERE o.id=$1`,
      [req.params.id]
    );
    if (!or.rows.length) return res.status(404).json({ error: 'Order not found' });
    const order = or.rows[0];
    const vr = await pool.query('SELECT user_id FROM vendors WHERE id=$1', [order.vendor_id]);
    const allowed = order.student_id === req.user.id ||
                    vr.rows[0]?.user_id === req.user.id ||
                    order.delivery_partner_id === req.user.id ||
                    req.user.role === 'admin';
    if (!allowed) return res.status(403).json({ error: 'Access denied' });
    const items = await pool.query('SELECT * FROM order_items WHERE order_id=$1', [req.params.id]);
    res.json({ order: { ...order, items: items.rows } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// PATCH /api/orders/:id/cancel
router.patch('/:id/cancel', authenticate, requireRole('student'), async (req, res) => {
  const io = req.app.get('io');
  try {
    const or = await pool.query('SELECT * FROM orders WHERE id=$1 AND student_id=$2', [req.params.id, req.user.id]);
    if (!or.rows.length) return res.status(404).json({ error: 'Not found' });
    if (or.rows[0].status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    await pool.query('UPDATE orders SET status=\'cancelled\',updated_at=NOW() WHERE id=$1', [req.params.id]);
    emitStatus(io, req.params.id, 'cancelled');
    res.json({ message: 'Cancelled' });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// Vendor status transitions
async function vendorTransition(req, res, from, to) {
  const io = req.app.get('io');
  try {
    const v = await pool.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    if (!v.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    const r = await pool.query(
      `UPDATE orders SET status=$1,updated_at=NOW() WHERE id=$2 AND vendor_id=$3 AND status=$4 RETURNING *`,
      [to, req.params.id, v.rows[0].id, from]
    );
    if (!r.rows.length) return res.status(400).json({ error: `Cannot move from ${from} to ${to}` });
    emitStatus(io, req.params.id, to);
    res.json({ order: r.rows[0] });
  } catch { res.status(500).json({ error: 'Failed' }); }
}

router.patch('/:id/accept',    authenticate, requireRole('vendor'), (req, res) => vendorTransition(req, res, 'pending',   'accepted'));
router.patch('/:id/preparing', authenticate, requireRole('vendor'), (req, res) => vendorTransition(req, res, 'accepted',  'preparing'));
router.patch('/:id/reject',    authenticate, requireRole('vendor'), async (req, res) => {
  const io = req.app.get('io');
  try {
    const v = await pool.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    const r = await pool.query(
      `UPDATE orders SET status='cancelled',updated_at=NOW() WHERE id=$1 AND vendor_id=$2 AND status='pending' RETURNING *`,
      [req.params.id, v.rows[0].id]
    );
    if (!r.rows.length) return res.status(400).json({ error: 'Cannot reject' });
    emitStatus(io, req.params.id, 'cancelled');
    res.json({ message: 'Rejected' });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

router.patch('/:id/ready', authenticate, requireRole('vendor'), async (req, res) => {
  const io = req.app.get('io');
  try {
    const v = await pool.query('SELECT id FROM vendors WHERE user_id=$1', [req.user.id]);
    const r = await pool.query(
      `UPDATE orders SET status='ready',updated_at=NOW() WHERE id=$1 AND vendor_id=$2 AND status='preparing' RETURNING *`,
      [req.params.id, v.rows[0].id]
    );
    if (!r.rows.length) return res.status(400).json({ error: 'Cannot mark ready' });
    const order = r.rows[0];
    emitStatus(io, req.params.id, 'ready');
    if (io) io.to('delivery_partners').emit('order:available', {
      id: order.id, vendor_id: order.vendor_id,
      delivery_address: order.delivery_address, total_amount: order.total_amount,
    });
    res.json({ order });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// POST /api/orders/:id/rate
router.post('/:id/rate', authenticate, requireRole('student'), [
  body('stars').isInt({ min: 1, max: 5 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { stars, comment } = req.body;
  try {
    const or = await pool.query(
      `SELECT * FROM orders WHERE id=$1 AND student_id=$2 AND status='delivered'`,
      [req.params.id, req.user.id]
    );
    if (!or.rows.length) return res.status(400).json({ error: 'Cannot rate' });
    await pool.query(
      `INSERT INTO ratings (order_id,student_id,vendor_id,stars,comment) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (order_id) DO NOTHING`,
      [req.params.id, req.user.id, or.rows[0].vendor_id, stars, comment||null]
    );
    await pool.query(
      `UPDATE vendors SET total_ratings=total_ratings+1, rating=((rating*total_ratings)+$1)/(total_ratings+1) WHERE id=$2`,
      [stars, or.rows[0].vendor_id]
    );
    res.json({ message: 'Rated' });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;

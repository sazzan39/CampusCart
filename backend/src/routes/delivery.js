const express = require('express');
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const PARTNER_POINTS = 20;

// GET /api/delivery/available
router.get('/available', authenticate, requireRole('delivery_partner'), async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT o.id,o.delivery_address,o.total_amount,o.delivery_fee,o.special_note,o.created_at,
              v.shop_name,v.location AS pickup_location
       FROM orders o JOIN vendors v ON o.vendor_id=v.id
       WHERE o.status='ready' AND o.delivery_partner_id IS NULL ORDER BY o.created_at ASC`
    );
    res.json({ orders: r.rows });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// GET /api/delivery/my
router.get('/my', authenticate, requireRole('delivery_partner'), async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT o.id,o.status,o.delivery_address,o.delivery_fee,o.created_at,o.updated_at,
              v.shop_name,v.location AS pickup_location
       FROM orders o JOIN vendors v ON o.vendor_id=v.id
       WHERE o.delivery_partner_id=$1 ORDER BY o.created_at DESC LIMIT 30`,
      [req.user.id]
    );
    res.json({ orders: r.rows });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// GET /api/delivery/earnings
router.get('/earnings', authenticate, requireRole('delivery_partner'), async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [td, all, pts] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS count, COALESCE(SUM(delivery_fee),0) AS total_fee
         FROM orders WHERE delivery_partner_id=$1 AND status='delivered' AND DATE(updated_at)=$2`,
        [req.user.id, today]
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM orders WHERE delivery_partner_id=$1 AND status='delivered'`,
        [req.user.id]
      ),
      pool.query('SELECT reward_points FROM users WHERE id=$1', [req.user.id]),
    ]);
    res.json({
      today: { deliveries: parseInt(td.rows[0].count), earnings: parseFloat(td.rows[0].total_fee) },
      all_time: { deliveries: parseInt(all.rows[0].count) },
      reward_points: pts.rows[0].reward_points,
    });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// POST /api/delivery/orders/:id/accept
router.post('/orders/:id/accept', authenticate, requireRole('delivery_partner'), async (req, res) => {
  const io = req.app.get('io');
  try {
    const active = await pool.query(
      `SELECT id FROM orders WHERE delivery_partner_id=$1 AND status='picked_up'`, [req.user.id]
    );
    if (active.rows.length) return res.status(400).json({ error: 'Complete current delivery first' });

    const r = await pool.query(
      `UPDATE orders SET delivery_partner_id=$1,status='picked_up',updated_at=NOW()
       WHERE id=$2 AND status='ready' AND delivery_partner_id IS NULL RETURNING *`,
      [req.user.id, req.params.id]
    );
    if (!r.rows.length) return res.status(409).json({ error: 'Order already taken or not available' });

    const order = r.rows[0];
    const v = await pool.query('SELECT shop_name,location FROM vendors WHERE id=$1', [order.vendor_id]);

    if (io) {
      io.to(`order:${req.params.id}`).emit('order:status_update', {
        order_id: req.params.id, status: 'picked_up',
        delivery_partner: { name: req.user.name },
      });
      io.to('delivery_partners').emit('order:taken', { order_id: req.params.id });
    }

    res.json({ order, pickup: v.rows[0], dropoff: { address: order.delivery_address } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// PATCH /api/delivery/orders/:id/delivered
router.patch('/orders/:id/delivered', authenticate, requireRole('delivery_partner'), async (req, res) => {
  const io = req.app.get('io');
  try {
    const r = await pool.query(
      `UPDATE orders SET status='delivered',updated_at=NOW()
       WHERE id=$1 AND delivery_partner_id=$2 AND status='picked_up' RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!r.rows.length) return res.status(400).json({ error: 'Cannot mark delivered' });
    const order = r.rows[0];

    await pool.query('UPDATE users SET reward_points=reward_points+$1 WHERE id=$2', [PARTNER_POINTS, req.user.id]);
    await pool.query(
      'INSERT INTO reward_transactions (user_id,points,reason,order_id) VALUES ($1,$2,\'delivery_completed\',$3)',
      [req.user.id, PARTNER_POINTS, req.params.id]
    );
    await pool.query('UPDATE users SET reward_points=reward_points+5 WHERE id=$1', [order.student_id]);
    await pool.query(
      'INSERT INTO reward_transactions (user_id,points,reason,order_id) VALUES ($1,5,\'order_delivered\',$2)',
      [order.student_id, req.params.id]
    );

    if (io) io.to(`order:${req.params.id}`).emit('order:status_update', { order_id: req.params.id, status: 'delivered' });

    res.json({ message: 'Delivered', points_earned: PARTNER_POINTS });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;

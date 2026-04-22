const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool     = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return true; }
  return false;
};

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('role').isIn(['student','delivery_partner','vendor']).withMessage('Invalid role'),
], async (req, res) => {
  if (validate(req, res)) return;
  const { name, email, password, role, student_id, phone, hostel, room_number, shop_name, description, location } = req.body;
  try {
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name,email,student_id,phone,password_hash,role,hostel,room_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,name,email,role,hostel,room_number,reward_points`,
      [name, email, student_id||null, phone||null, password_hash, role, hostel||null, room_number||null]
    );
    const user = result.rows[0];

    if (role === 'vendor') {
      await pool.query(
        `INSERT INTO vendors (user_id,shop_name,description,location) VALUES ($1,$2,$3,$4)`,
        [user.id, shop_name||'My Shop', description||null, location||null]
      );
    }
    if (role === 'student') {
      await pool.query('UPDATE users SET reward_points=50 WHERE id=$1', [user.id]);
      await pool.query(
        `INSERT INTO reward_transactions (user_id,points,reason) VALUES ($1,50,'signup_bonus')`,
        [user.id]
      );
      user.reward_points = 50;
    }

    res.status(201).json({ token: generateToken(user.id), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  if (validate(req, res)) return;
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT id,name,email,password_hash,role,hostel,room_number,reward_points,is_active FROM users WHERE email=$1`,
      [email]
    );
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid email or password' });
    const user = result.rows[0];
    if (!user.is_active) return res.status(403).json({ error: 'Account deactivated' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });
    delete user.password_hash;
    res.json({ token: generateToken(user.id), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    let vendor = null;
    if (req.user.role === 'vendor') {
      const v = await pool.query(
        `SELECT id,shop_name,description,location,is_open,is_approved,rating FROM vendors WHERE user_id=$1`,
        [req.user.id]
      );
      vendor = v.rows[0] || null;
    }
    res.json({ user: req.user, vendor });
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, async (req, res) => {
  const { name, phone, hostel, room_number, expo_push_token } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET name=COALESCE($1,name), phone=COALESCE($2,phone),
       hostel=COALESCE($3,hostel), room_number=COALESCE($4,room_number),
       expo_push_token=COALESCE($5,expo_push_token), updated_at=NOW()
       WHERE id=$6 RETURNING id,name,email,role,hostel,room_number,reward_points`,
      [name, phone, hostel, room_number, expo_push_token, req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

module.exports = router;

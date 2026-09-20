const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { query } = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const { logActivity }  = require('../services/activityLogger');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  // Check existing
  const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (exists.rows.length) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, phone, address)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, status`,
    [name, email, hash, phone, address]
  );

  await logActivity(rows[0].id, 'USER_REGISTERED', 'user', rows[0].id);

  res.status(201).json({
    message: 'Registration successful. Awaiting admin approval.',
    user: rows[0]
  });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.status, u.avatar_url, r.name AS role
     FROM users u JOIN roles r ON u.role_id = r.id
     WHERE u.email = $1`,
    [email]
  );

  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = rows[0];
  if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended' });
  if (user.status === 'pending')   return res.status(403).json({ error: 'Account pending approval' });

  const token = signToken(user.id);
  await logActivity(user.id, 'USER_LOGIN', 'user', user.id);

  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.status, u.avatar_url, u.phone, u.address,
            u.created_at, r.name AS role
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
    [req.user.id]
  );
  res.json({ user: rows[0] });
});

// POST /api/auth/refresh
exports.refresh = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
  const exp = decoded.exp * 1000;

  // Allow refresh up to 1 day after expiry
  if (Date.now() > exp + 86400000) {
    return res.status(401).json({ error: 'Token too old to refresh' });
  }

  const newToken = signToken(decoded.userId);
  res.json({ token: newToken });
});

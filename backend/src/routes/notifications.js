// ─── routes/notifications.js ─────────────────────────────────────
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const router  = express.Router();

// GET /api/notifications
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 50`,
    [req.user.id]
  );
  const unread = rows.filter(n => !n.is_read).length;
  res.json({ notifications: rows, unread });
}));

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, asyncHandler(async (req, res) => {
  await query(
    'UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  res.json({ message: 'Marked as read' });
}));

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id]);
  res.json({ message: 'All marked as read' });
}));

module.exports = router;

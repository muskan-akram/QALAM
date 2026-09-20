const { query } = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const { logActivity }  = require('../services/activityLogger');
const { sendNotification } = require('../services/notificationService');

// GET /api/admin/dashboard
exports.dashboard = asyncHandler(async (req, res) => {
  const [books, users, transactions, overdue, recent] = await Promise.all([
    query('SELECT COUNT(*) AS total, SUM(available_copies) AS available FROM books'),
    query(`SELECT COUNT(*) AS total,
            SUM(CASE WHEN status='active'    THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN status='pending'   THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status='suspended' THEN 1 ELSE 0 END) AS suspended
           FROM users WHERE role_id = 2`),
    query(`SELECT COUNT(*) AS total,
            SUM(CASE WHEN status='borrowed' THEN 1 ELSE 0 END) AS borrowed,
            SUM(CASE WHEN status='returned' THEN 1 ELSE 0 END) AS returned
           FROM transactions`),
    query(`SELECT COUNT(*) FROM transactions
           WHERE status='borrowed' AND due_date < NOW()`),
    query(`SELECT t.id, t.borrow_date, t.status, b.title AS book_title,
                  u.name AS user_name
           FROM transactions t
           JOIN books b ON t.book_id = b.id
           JOIN users u ON t.user_id = u.id
           ORDER BY t.created_at DESC LIMIT 10`)
  ]);

  res.json({
    stats: {
      books:        books.rows[0],
      users:        users.rows[0],
      transactions: transactions.rows[0],
      overdue:      parseInt(overdue.rows[0].count)
    },
    recentTransactions: recent.rows
  });
});

// GET /api/admin/users
exports.listUsers = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = ['r.name = \'user\''];
  let idx = 1;

  if (status) { conditions.push(`u.status = $${idx++}`); params.push(status); }
  if (search) {
    conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`);
    params.push(`%${search}%`); idx++;
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.status, u.phone, u.created_at, u.avatar_url,
            r.name AS role,
            COUNT(t.id) FILTER (WHERE t.status='borrowed') AS active_borrows
     FROM users u
     JOIN roles r ON u.role_id = r.id
     LEFT JOIN transactions t ON t.user_id = u.id
     ${where}
     GROUP BY u.id, r.name
     ORDER BY u.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, parseInt(limit), offset]
  );
  res.json({ users: rows });
});

// PATCH /api/admin/users/:id/status
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['active', 'suspended', 'pending'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const { rows } = await query(
    'UPDATE users SET status=$1 WHERE id=$2 RETURNING id, name, email, status',
    [status, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });

  await logActivity(req.user.id, `USER_${status.toUpperCase()}`, 'user', req.params.id);

  if (status === 'active') {
    await sendNotification({
      userId: req.params.id,
      title:  'Account Approved',
      message: 'Your QALAM account has been approved. You can now borrow books.',
      type:   'approval'
    });
  }

  res.json({ user: rows[0] });
});

// GET /api/admin/analytics
exports.analytics = asyncHandler(async (req, res) => {
  const [topBooks, overdueUsers, monthly, genreStats] = await Promise.all([
    // Most borrowed books
    query(`SELECT b.id, b.title, b.author, b.genre, COUNT(t.id) AS borrow_count
           FROM books b LEFT JOIN transactions t ON t.book_id = b.id
           GROUP BY b.id ORDER BY borrow_count DESC LIMIT 10`),

    // Users with overdue books
    query(`SELECT u.id, u.name, u.email,
                  COUNT(t.id) AS overdue_count,
                  MAX(EXTRACT(DAY FROM NOW()-t.due_date)) AS max_days_overdue
           FROM users u
           JOIN transactions t ON t.user_id = u.id
           WHERE t.status='borrowed' AND t.due_date < NOW()
           GROUP BY u.id ORDER BY overdue_count DESC LIMIT 10`),

    // Monthly borrow activity (last 12 months)
    query(`SELECT TO_CHAR(borrow_date,'YYYY-MM') AS month, COUNT(*) AS borrows
           FROM transactions
           WHERE borrow_date >= NOW() - INTERVAL '12 months'
           GROUP BY month ORDER BY month`),

    // Books by genre
    query(`SELECT genre, COUNT(*) AS count FROM books GROUP BY genre ORDER BY count DESC`)
  ]);

  res.json({
    topBooks:     topBooks.rows,
    overdueUsers: overdueUsers.rows,
    monthlyActivity: monthly.rows,
    genreStats:   genreStats.rows
  });
});

// GET /api/admin/logs
exports.activityLogs = asyncHandler(async (req, res) => {
  const { action, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];
  let idx = 1;

  if (action) { conditions.push(`al.action = $${idx++}`); params.push(action); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT al.*, u.name AS actor_name, u.email AS actor_email
     FROM activity_logs al
     LEFT JOIN users u ON al.actor_id = u.id
     ${where}
     ORDER BY al.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, parseInt(limit), offset]
  );
  res.json({ logs: rows });
});
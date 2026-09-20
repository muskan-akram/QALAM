const nodemailer = require('nodemailer');
const { query }  = require('../db/pool');
const logger     = require('../utils/logger');

// ─── Email Transporter ───────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST  || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Create in-app notification + optionally send email
 * @param {object} opts
 */
async function sendNotification({ userId, title, message, type, relatedId, sendEmail = true }) {
  try {
    // Save in-app notification
    await query(
      `INSERT INTO notifications (user_id, title, message, type, related_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, message, type, relatedId || null]
    );

    // Fetch user email for external notification
    if (sendEmail && process.env.SMTP_USER) {
      const userRes = await query('SELECT email, name FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length) {
        const { email, name } = userRes.rows[0];
        await sendEmail({ to: email, name, subject: title, body: message });
        await query(
          'UPDATE notifications SET email_sent=true WHERE user_id=$1 AND title=$2 AND created_at > NOW()-INTERVAL \'1 minute\'',
          [userId, title]
        );
      }
    }
  } catch (err) {
    logger.error('Notification error:', err.message);
  }
}

/**
 * Send email via SMTP
 */
async function sendEmail({ to, name, subject, body }) {
  if (!process.env.SMTP_USER) return;
  try {
    await transporter.sendMail({
      from:    `"QALAM Library" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject: `QALAM – ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#1a56db">📚 QALAM Library</h2>
          <p>Hello ${name},</p>
          <p>${body}</p>
          <hr/>
          <small style="color:#888">This is an automated message from QALAM Library System.</small>
        </div>`
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    logger.error(`Email failed to ${to}:`, err.message);
  }
}

/**
 * Bulk notify overdue users
 */
async function notifyOverdueUsers() {
  const { rows } = await query(
    `SELECT t.id AS txn_id, t.user_id, t.due_date, b.title,
            EXTRACT(DAY FROM NOW()-t.due_date) AS days_late
     FROM transactions t
     JOIN books b ON t.book_id = b.id
     WHERE t.status='borrowed' AND t.due_date < NOW()`
  );

  for (const row of rows) {
    await sendNotification({
      userId:    row.user_id,
      title:     'Overdue Book Alert',
      message:   `"${row.title}" is ${Math.ceil(row.days_late)} day(s) overdue. Please return immediately.`,
      type:      'overdue',
      relatedId: row.txn_id
    });
    // Update transaction status
    await query(`UPDATE transactions SET status='overdue' WHERE id=$1`, [row.txn_id]);
  }
  logger.info(`Notified ${rows.length} overdue transactions`);
}

/**
 * Send due-date reminders (1 day before)
 */
async function sendDueReminders() {
  const { rows } = await query(
    `SELECT t.id AS txn_id, t.user_id, t.due_date, b.title
     FROM transactions t
     JOIN books b ON t.book_id = b.id
     WHERE t.status='borrowed'
       AND t.due_date BETWEEN NOW() AND NOW() + INTERVAL '1 day'`
  );

  for (const row of rows) {
    await sendNotification({
      userId:    row.user_id,
      title:     'Due Date Reminder',
      message:   `"${row.title}" is due tomorrow (${new Date(row.due_date).toDateString()}).`,
      type:      'due_reminder',
      relatedId: row.txn_id
    });
  }
  logger.info(`Sent ${rows.length} due reminders`);
}

module.exports = { sendNotification, sendEmail, notifyOverdueUsers, sendDueReminders };

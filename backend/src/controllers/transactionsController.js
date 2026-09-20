const { query, pool } = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const { logActivity } = require('../services/activityLogger');
const { sendNotification } = require('../services/notificationService');

const BORROW_DAYS = 14;

// ─────────────────────────────────────────────────────────────
// 1. USER REQUEST: POST /api/transactions/request
//    Creates a pending request. User must not already have one.
// ─────────────────────────────────────────────────────────────
exports.requestBorrow = asyncHandler(async (req, res) => {
    const { book_id } = req.body;
    const user_id = req.user.id;

    const existing = await query(
        `SELECT id FROM transactions 
         WHERE book_id = $1 AND user_id = $2 AND status IN ('pending', 'borrowed')`,
        [book_id, user_id]
    );
    if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'You already have an active request for this book' });
    }

    // due_date is not yet known for pending requests — it is set properly on approval.
    // Insert a placeholder (NOW() + 14 days) to satisfy the NOT NULL constraint;
    // the real value will overwrite it when the admin approves.
    // Preferred long-term fix: ALTER TABLE transactions ALTER COLUMN due_date DROP NOT NULL;
    const placeholderDue = new Date(Date.now() + BORROW_DAYS * 86400000);

    const txnRes = await query(
        `INSERT INTO transactions (user_id, book_id, status, borrow_date, due_date)
         VALUES ($1, $2, 'pending', NOW(), $3) RETURNING *`,
        [user_id, book_id, placeholderDue]
    );

    res.status(201).json({ 
        transaction: txnRes.rows[0], 
        message: 'Request sent! Waiting for admin approval.' 
    });
});

// ─────────────────────────────────────────────────────────────
// 2. ADMIN APPROVAL: PATCH /api/transactions/:id/approve
//    pending → borrowed, decrements available_copies, notifies user
// ─────────────────────────────────────────────────────────────
exports.approveRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const txnRes = await client.query(
            `SELECT t.*, b.available_copies, b.title 
             FROM transactions t 
             JOIN books b ON t.book_id = b.id 
             WHERE t.id = $1 FOR UPDATE`, [id]
        );
        if (txnRes.rows.length === 0) throw new Error('Transaction not found');
        const txn = txnRes.rows[0];
        if (txn.status !== 'pending') throw new Error('Request is already processed');
        if (txn.available_copies < 1) throw new Error('No copies available to fulfil this request');

        const due_date = new Date(Date.now() + BORROW_DAYS * 86400000);

        await client.query(
            `UPDATE transactions 
             SET status = 'borrowed', borrow_date = NOW(), due_date = $1, issued_by = $2 
             WHERE id = $3`,
            [due_date, req.user.id, id]
        );
        await client.query(
            'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
            [txn.book_id]
        );

        await client.query('COMMIT');

        await logActivity(req.user.id, 'REQUEST_APPROVED', 'transaction', id);
        await sendNotification({
            userId: txn.user_id,
            title: 'Request Approved! 📚',
            message: `Your request for "${txn.title}" is ready! Show your QR code at the library to collect.`,
            type: 'general',
            relatedId: id
        });

        res.json({ message: 'Approved successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ─────────────────────────────────────────────────────────────
// 3. CANCEL REQUEST: PATCH /api/transactions/:id/cancel
//    Admin or the owning user can cancel a 'pending' request.
//    Cancelling a 'borrowed' transaction is not allowed here —
//    that must go through the return flow.
// ─────────────────────────────────────────────────────────────
exports.cancelRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const txnRes = await query(
        `SELECT * FROM transactions WHERE id = $1`, [id]
    );
    if (txnRes.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
    }
    const txn = txnRes.rows[0];

    // Only the owner or an admin can cancel
    if (req.user.role !== 'admin' && txn.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    if (txn.status !== 'pending') {
        return res.status(400).json({ error: `Cannot cancel a transaction with status '${txn.status}'` });
    }

    await query(
        `UPDATE transactions SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [id]
    );

    await logActivity(req.user.id, 'REQUEST_CANCELLED', 'transaction', id);

    res.json({ message: 'Request cancelled successfully' });
});

// ─────────────────────────────────────────────────────────────
// 4. ADMIN DIRECT ISSUE (via QR scanner): POST /api/transactions/issue
//    Admin scans a Book QR and selects a user to issue directly.
//    Skips the pending step — creates a 'borrowed' record immediately.
// ─────────────────────────────────────────────────────────────
exports.issueBook = asyncHandler(async (req, res) => {
    const { book_id, user_id } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Lock the book row
        const bookRes = await client.query(
            'SELECT * FROM books WHERE id = $1 FOR UPDATE', [book_id]
        );
        if (bookRes.rows.length === 0) throw new Error('Book not found');
        const book = bookRes.rows[0];
        if (book.available_copies < 1) throw new Error('No copies currently available');

        // Check if user already has this book
        const existing = await client.query(
            `SELECT id FROM transactions 
             WHERE book_id = $1 AND user_id = $2 AND status IN ('pending', 'borrowed')`,
            [book_id, user_id]
        );
        if (existing.rows.length > 0) {
            throw new Error('This member already has an active borrow or pending request for this book');
        }

        const due_date = new Date(Date.now() + BORROW_DAYS * 86400000);

        const txnRes = await client.query(
            `INSERT INTO transactions (user_id, book_id, status, borrow_date, due_date, issued_by)
             VALUES ($1, $2, 'borrowed', NOW(), $3, $4) RETURNING *`,
            [user_id, book_id, due_date, req.user.id]
        );

        await client.query(
            'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [book_id]
        );

        await client.query('COMMIT');

        await logActivity(req.user.id, 'BOOK_ISSUED', 'transaction', txnRes.rows[0].id);
        await sendNotification({
            userId: user_id,
            title: 'Book Issued! 📚',
            message: `"${book.title}" has been issued to you. Due back by ${due_date.toDateString()}.`,
            type: 'general',
            relatedId: txnRes.rows[0].id
        });

        res.status(201).json({ 
            transaction: txnRes.rows[0],
            message: 'Book issued successfully'
        });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ─────────────────────────────────────────────────────────────
// 5. RETURN BOOK: POST /api/transactions/return
//    borrowed → returned, increments available_copies
// ─────────────────────────────────────────────────────────────
exports.returnBook = asyncHandler(async (req, res) => {
    const { transaction_id } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const txnRes = await client.query(
            `SELECT t.*, b.title FROM transactions t 
             JOIN books b ON t.book_id = b.id 
             WHERE t.id = $1 AND t.status = 'borrowed' FOR UPDATE`, [transaction_id]
        );
        if (!txnRes.rows.length) throw new Error('Active borrowed transaction not found');

        const txn = txnRes.rows[0];
        const isOverdue = txn.due_date && new Date() > new Date(txn.due_date);
        const daysOverdue = isOverdue 
            ? Math.ceil((Date.now() - new Date(txn.due_date)) / 86400000)
            : 0;
        const fine_amount = daysOverdue * 10; // PKR 10 per day (adjust as needed)

        await client.query(
            `UPDATE transactions 
             SET status = 'returned', return_date = NOW(), returned_to = $1, fine_amount = $2
             WHERE id = $3`,
            [req.user.id, fine_amount, transaction_id]
        );
        await client.query(
            'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
            [txn.book_id]
        );

        await client.query('COMMIT');

        await logActivity(req.user.id, 'BOOK_RETURNED', 'transaction', transaction_id);

        res.json({ 
            message: 'Book returned successfully',
            fine_amount,
            days_overdue: daysOverdue
        });
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally { client.release(); }
});

// ─────────────────────────────────────────────────────────────
// 6. LIST: GET /api/transactions
//    ?status=pending|borrowed|returned|cancelled
//    ?book_id=<uuid>   (admin only, for scanner return flow)
// ─────────────────────────────────────────────────────────────
exports.listTransactions = asyncHandler(async (req, res) => {
    const { status, book_id } = req.query;
    let sql = `
        SELECT t.*, b.title AS book_title, b.author, b.isbn, u.name AS user_name 
        FROM transactions t 
        JOIN books b ON t.book_id = b.id 
        JOIN users u ON t.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (req.user.role !== 'admin') {
        conditions.push(`t.user_id = $${params.length + 1}`);
        params.push(req.user.id);
    }
    if (status) {
        conditions.push(`t.status = $${params.length + 1}`);
        params.push(status);
    }
    // Admin can filter by book_id (used by scanner to find active borrows for a specific book)
    if (book_id && req.user.role === 'admin') {
        conditions.push(`t.book_id = $${params.length + 1}`);
        params.push(book_id);
    }

    if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ` ORDER BY t.created_at DESC`;

    const { rows } = await query(sql, params);
    res.json({ transactions: rows });
});
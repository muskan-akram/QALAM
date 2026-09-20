const express = require('express');
const router = express.Router();
const txnController = require('../controllers/transactionsController');
const { authenticate, authorize } = require('../middleware/auth');

// ── USER ROUTES ──────────────────────────────────────────────

// Submit a new borrow request (status: pending)
router.post('/request', authenticate, txnController.requestBorrow);

// Get my history (user) OR all transactions (admin)
// Supports ?status= and ?book_id= (admin only) filters
router.get('/', authenticate, txnController.listTransactions);

// Cancel a pending request — user can cancel their own; admin can cancel any
router.patch('/:id/cancel', authenticate, txnController.cancelRequest);


// ── ADMIN ROUTES ─────────────────────────────────────────────

// Approve a pending request (pending → borrowed), notifies user
router.patch('/:id/approve', authenticate, authorize('admin'), txnController.approveRequest);

// Direct issue via QR scanner (skips pending step, creates borrowed directly)
router.post('/issue', authenticate, authorize('admin'), txnController.issueBook);

// Process a return (borrowed → returned)
router.post('/return', authenticate, authorize('admin'), txnController.returnBook);

module.exports = router;
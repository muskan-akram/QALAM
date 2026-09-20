// ─── routes/admin.js ─────────────────────────────────────────────
const express  = require('express');
const ctrl     = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const router   = express.Router();

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

router.get('/dashboard',        ctrl.dashboard);
router.get('/users',            ctrl.listUsers);
router.patch('/users/:id/status', ctrl.updateUserStatus);
router.get('/analytics',        ctrl.analytics);
router.get('/logs',             ctrl.activityLogs);

module.exports = router;

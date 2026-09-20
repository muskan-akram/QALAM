const express  = require('express');
const ctrl     = require('../controllers/usersController');
const { authenticate } = require('../middleware/auth');
const router   = express.Router();

router.get('/profile',    authenticate, ctrl.getProfile);
router.put('/profile',    authenticate, ctrl.updateProfile);
router.get('/history',    authenticate, ctrl.borrowHistory);

module.exports = router;

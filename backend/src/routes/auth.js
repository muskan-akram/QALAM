const express   = require('express');
const { body }  = require('express-validator');
const ctrl      = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate  = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/register
router.post('/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name too short'),
    body('email').isEmail().normalizeEmail(),
    body('password').isStrongPassword({ minLength: 8, minNumbers: 1, minUppercase: 1 })
      .withMessage('Password must be 8+ chars with uppercase and number'),
  ],
  validate,
  ctrl.register
);

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  ctrl.login
);

// GET /api/auth/me
router.get('/me', authenticate, ctrl.me);

// POST /api/auth/refresh
router.post('/refresh', ctrl.refresh);

module.exports = router;

const express  = require('express');
const { body, query: vQuery } = require('express-validator');
const multer   = require('multer');
const path     = require('path');
const ctrl     = require('../controllers/booksController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Multer for cover image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/covers')),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET  /api/books          – list/search (public read after auth)
router.get('/', authenticate, ctrl.listBooks);

// GET  /api/books/:id
router.get('/:id', authenticate, ctrl.getBook);

// POST /api/books          – admin only
router.post('/',
  authenticate, authorize('admin'),
  upload.single('cover'),
  [
    body('title').trim().notEmpty(),
    body('author').trim().notEmpty(),
    body('total_copies').isInt({ min: 1 }),
  ],
  validate,
  ctrl.createBook
);

// PUT  /api/books/:id
router.put('/:id',
  authenticate, authorize('admin'),
  upload.single('cover'),
  ctrl.updateBook
);

// DELETE /api/books/:id
router.delete('/:id', authenticate, authorize('admin'), ctrl.deleteBook);

// GET  /api/books/:id/qr   – get QR code for book
router.get('/:id/qr', authenticate, authorize('admin'), ctrl.getQR);

// POST /api/books/:id/qr   – regenerate QR
router.post('/:id/qr', authenticate, authorize('admin'), ctrl.regenerateQR);

module.exports = router;

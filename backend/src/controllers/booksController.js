const QRCode    = require('qrcode');
const { query } = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const { logActivity }  = require('../services/activityLogger');

// GET /api/books
exports.listBooks = asyncHandler(async (req, res) => {
  const { search, genre, available, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(
      `(to_tsvector('english', title || ' ' || author) @@ plainto_tsquery('english', $${paramIdx})
       OR isbn ILIKE $${paramIdx + 1})`
    );
    params.push(search, `%${search}%`);
    paramIdx += 2;
  }
  if (genre) {
    conditions.push(`genre = $${paramIdx}`);
    params.push(genre);
    paramIdx++;
  }
  if (available === 'true') {
    conditions.push('available_copies > 0');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM books ${where}`, params);
  const total    = parseInt(countRes.rows[0].count);

  const books = await query(
    `SELECT id, title, author, isbn, genre, tags, cover_url, available_copies,
            total_copies, location, published_year, description
     FROM books ${where}
     ORDER BY title ASC
     LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...params, parseInt(limit), offset]
  );

  res.json({
    books: books.rows,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
  });
});

// GET /api/books/:id
exports.getBook = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM books WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Book not found' });
  res.json({ book: rows[0] });
});

// POST /api/books
exports.createBook = asyncHandler(async (req, res) => {
  const {
    title, author, isbn, publisher, published_year,
    genre, tags, description, total_copies, location, language, pages
  } = req.body;

  const cover_url = req.file ? `/uploads/covers/${req.file.filename}` : null;
  const tagsArr   = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);
  const copies    = parseInt(total_copies);

  const { rows } = await query(
    `INSERT INTO books
       (title, author, isbn, publisher, published_year, genre, tags,
        description, cover_url, total_copies, available_copies, location, language, pages)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11,$12,$13)
     RETURNING *`,
    [title, author, isbn, publisher, published_year, genre, `{${tagsArr.join(',')}}`,
     description, cover_url, copies, location, language, pages]
  );

  const book = rows[0];

  // Generate QR code
  const qrData  = JSON.stringify({ bookId: book.id, title: book.title, isbn: book.isbn });
  const qrImage = await QRCode.toDataURL(qrData, { width: 256, margin: 2 });

  await query('UPDATE books SET qr_code_data = $1 WHERE id = $2', [qrImage, book.id]);
  book.qr_code_data = qrImage;

  await logActivity(req.user.id, 'BOOK_CREATED', 'book', book.id, { title });
  res.status(201).json({ book });
});

// PUT /api/books/:id
exports.updateBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await query('SELECT * FROM books WHERE id = $1', [id]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Book not found' });

  const old = existing.rows[0];
  const {
    title = old.title, author = old.author, isbn = old.isbn,
    publisher = old.publisher, published_year = old.published_year,
    genre = old.genre, tags = old.tags, description = old.description,
    total_copies = old.total_copies, location = old.location,
    language = old.language, pages = old.pages
  } = req.body;

  const cover_url = req.file ? `/uploads/covers/${req.file.filename}` : old.cover_url;
  const diff = parseInt(total_copies) - old.total_copies;
  const newAvailable = Math.max(0, old.available_copies + diff);

  const { rows } = await query(
    `UPDATE books SET title=$1, author=$2, isbn=$3, publisher=$4, published_year=$5,
       genre=$6, tags=$7, description=$8, cover_url=$9, total_copies=$10,
       available_copies=$11, location=$12, language=$13, pages=$14
     WHERE id=$15 RETURNING *`,
    [title, author, isbn, publisher, published_year, genre,
     Array.isArray(tags) ? `{${tags.join(',')}}` : tags,
     description, cover_url, parseInt(total_copies), newAvailable,
     location, language, pages, id]
  );

  await logActivity(req.user.id, 'BOOK_UPDATED', 'book', id);
  res.json({ book: rows[0] });
});

// DELETE /api/books/:id
exports.deleteBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('DELETE FROM books WHERE id = $1 RETURNING title', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Book not found' });

  await logActivity(req.user.id, 'BOOK_DELETED', 'book', id, { title: rows[0].title });
  res.json({ message: 'Book deleted' });
});

// GET /api/books/:id/qr
exports.getQR = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT qr_code_data, title FROM books WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Book not found' });
  res.json({ qr: rows[0].qr_code_data, title: rows[0].title });
});

// POST /api/books/:id/qr  – regenerate
exports.regenerateQR = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT id, title, isbn FROM books WHERE id = $1', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Book not found' });

  const book    = rows[0];
  const qrData  = JSON.stringify({ bookId: book.id, title: book.title, isbn: book.isbn });
  const qrImage = await QRCode.toDataURL(qrData, { width: 256, margin: 2 });

  await query('UPDATE books SET qr_code_data = $1 WHERE id = $2', [qrImage, id]);
  res.json({ qr: qrImage });
});

const bcrypt    = require('bcryptjs');
const { query } = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.address, u.avatar_url,
            u.created_at, r.name AS role, u.status
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
    [req.user.id]
  );
  res.json({ user: rows[0] });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, password, profile_picture } = req.body;
  let hashClause = '';
  
  // Base params: [name, phone, address]
  const params = [name, phone, address];

  // If a password is being updated, hash it and inject it into the parameters array
  if (password) {
    const hash = await bcrypt.hash(password, 12);
    hashClause = `, password_hash=$${params.length + 1}`;
    params.push(hash);
  }

  // Inject avatar_url clause and add profile_picture value to parameters array
  let avatarClause = '';
  if (profile_picture) {
    avatarClause = `, avatar_url=$${params.length + 1}`;
    params.push(profile_picture);
  }

  // Finally, append the logged-in User ID ($4, $5, or $6 depending on password/avatar presence)
  params.push(req.user.id);
  const idPlaceholder = `$${params.length}`;

  const { rows } = await query(
    `UPDATE users 
     SET name=$1, phone=$2, address=$3${hashClause}${avatarClause}
     WHERE id=${idPlaceholder} 
     RETURNING id, name, email, phone, address, avatar_url`,
    params
  );

  res.json({ user: rows[0] });
});

exports.borrowHistory = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT t.id, t.borrow_date, t.due_date, t.return_date, t.status,
            t.fine_amount, b.title, b.author, b.cover_url, b.isbn
     FROM transactions t
     JOIN books b ON t.book_id = b.id
     WHERE t.user_id = $1
     ORDER BY t.borrow_date DESC`,
    [req.user.id]
  );
  res.json({ history: rows });
});

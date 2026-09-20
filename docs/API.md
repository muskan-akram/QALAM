# QALAM API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication

### POST /auth/register
Register a new user (status = pending until admin approves).

**Request:**
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "Jane@1234", "phone": "01234567890" }
```
**Response 201:**
```json
{ "message": "Registration successful. Awaiting admin approval.", "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com", "status": "pending" } }
```

---

### POST /auth/login
**Request:**
```json
{ "email": "admin@qalam.io", "password": "Admin@1234" }
```
**Response 200:**
```json
{ "token": "eyJ...", "user": { "id": "...", "name": "System Admin", "email": "admin@qalam.io", "role": "admin", "status": "active" } }
```

---

### GET /auth/me
Returns the current authenticated user.

---

## Books

### GET /books
Query params: `search`, `genre`, `available=true`, `page`, `limit`

**Response 200:**
```json
{
  "books": [{ "id": "...", "title": "Clean Code", "author": "Robert C. Martin", "available_copies": 2, "total_copies": 2, "genre": "Technology", "tags": ["programming"] }],
  "pagination": { "total": 8, "page": 1, "limit": 20, "pages": 1 }
}
```

### POST /books  `[Admin]`
Multipart form data with optional `cover` image file.

**Fields:** `title*`, `author*`, `isbn`, `publisher`, `published_year`, `genre`, `tags` (JSON array string), `description`, `total_copies*`, `location`, `language`, `pages`

**Response 201:** Full book object including generated `qr_code_data` (base64 PNG)

### PUT /books/:id  `[Admin]`
Same fields as POST, partial update supported.

### DELETE /books/:id  `[Admin]`

### GET /books/:id/qr  `[Admin]`
```json
{ "qr": "data:image/png;base64,...", "title": "Clean Code" }
```

### POST /books/:id/qr  `[Admin]`
Regenerate QR code.

---

## Transactions

### POST /transactions/issue  `[Admin]`
```json
{ "book_id": "uuid", "user_id": "uuid" }
```
**Response 201:**
```json
{ "transaction": { "id": "...", "user_id": "...", "book_id": "...", "borrow_date": "2024-01-15T...", "due_date": "2024-01-29T...", "status": "borrowed" }, "message": "Book issued successfully" }
```

### POST /transactions/return  `[Admin]`
```json
{ "transaction_id": "uuid" }
```
**Response 200:**
```json
{ "message": "Book returned successfully", "fine_amount": 2.00, "overdue": true }
```

### GET /transactions
Query: `status` (borrowed|returned|overdue), `page`, `limit`
- Admin: sees all transactions
- User: sees own transactions

### GET /transactions/overdue  `[Admin]`
Returns all overdue transactions with `days_overdue`.

---

## Admin

### GET /admin/dashboard  `[Admin]`
```json
{
  "stats": {
    "books": { "total": 8, "available": 30 },
    "users": { "total": 5, "active": 3, "pending": 2, "suspended": 0 },
    "transactions": { "total": 12, "borrowed": 4, "returned": 8 },
    "overdue": 1
  },
  "recentTransactions": [...]
}
```

### GET /admin/users  `[Admin]`
Query: `status`, `search`, `page`, `limit`

### PATCH /admin/users/:id/status  `[Admin]`
```json
{ "status": "active" }   // active | suspended | pending
```

### GET /admin/analytics  `[Admin]`
Returns: `topBooks`, `overdueUsers`, `monthlyActivity`, `genreStats`

### GET /admin/logs  `[Admin]`
Query: `action`, `page`, `limit`

---

## Users

### GET /users/profile
### PUT /users/profile
```json
{ "name": "Jane Doe", "phone": "...", "address": "...", "password": "NewPass@123" }
```

### GET /users/history
Returns user's complete borrow history.

---

## Notifications

### GET /notifications
```json
{ "notifications": [...], "unread": 3 }
```

### PATCH /notifications/:id/read
### PATCH /notifications/read-all

---

## Chatbot

### POST /chatbot/message
```json
{ "message": "recommend books on machine learning", "history": [] }
```
**Response 200:**
```json
{
  "reply": "📚 Based on your interest, here are my top picks:\n• **Deep Learning** by Ian Goodfellow...",
  "recommendations": [
    { "id": "...", "title": "Deep Learning", "author": "Ian Goodfellow", "similarity_score": 0.8943, "available_copies": 2, ... }
  ]
}
```

### GET /chatbot/history
Returns last 100 messages for the current user.

---

## AI Service (port 8000)

### POST /chat
```json
{ "message": "string", "user_id": "string", "history": [] }
```

### POST /recommend
```json
{ "query": "machine learning", "top_k": 5 }
```

### POST /reindex
Rebuild the embedding index after adding new books.

### GET /health

---

## Error Responses

All errors follow:
```json
{ "error": "Human-readable message", "details": [...] }
```

| Code | Meaning |
|------|---------|
| 400  | Bad request / validation |
| 401  | Unauthenticated |
| 403  | Forbidden (wrong role or suspended) |
| 404  | Not found |
| 409  | Conflict (duplicate, already borrowed) |
| 422  | Validation failed |
| 500  | Internal server error |

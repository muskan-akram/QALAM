# QALAM Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        ROLES                                │
│  id (PK)  │  name (admin|user)  │  created_at              │
└─────────────────────────────────────────────────────────────┘
                              │ 1
                              │
                              │ N
┌─────────────────────────────────────────────────────────────┐
│                        USERS                                │
│  id (UUID PK)  │  name  │  email (UNIQUE)                  │
│  password_hash │  role_id (FK→roles)                       │
│  status (pending|active|suspended)                          │
│  avatar_url  │  phone  │  address                          │
│  created_at  │  updated_at                                  │
└─────────────────────────────────────────────────────────────┘
      │ 1                              │ 1
      │                                │
      │ N (borrower)                   │ N (notifications)
      ▼                                ▼
┌────────────────────────┐    ┌────────────────────────────┐
│     TRANSACTIONS       │    │       NOTIFICATIONS        │
│  id (UUID PK)          │    │  id (UUID PK)              │
│  user_id (FK→users)    │    │  user_id (FK→users)        │
│  book_id (FK→books)    │    │  title  │  message  │ type │
│  issued_by (FK→users)  │    │  is_read │  email_sent     │
│  returned_to(FK→users) │    │  related_id (UUID)         │
│  borrow_date           │    │  created_at                │
│  due_date              │    └────────────────────────────┘
│  return_date           │
│  status(borrowed|      │
│    returned|overdue)   │
│  fine_amount           │
│  fine_paid             │    ┌────────────────────────────┐
│  created_at            │    │       CHAT_HISTORY         │
└────────────────────────┘    │  id (UUID PK)              │
      │ N                      │  user_id (FK→users)        │
      │                        │  role (user|assistant)     │
      │ 1                      │  content (TEXT)            │
┌────────────────────────┐    │  created_at                │
│         BOOKS          │    └────────────────────────────┘
│  id (UUID PK)          │
│  title  │  author      │    ┌────────────────────────────┐
│  isbn (UNIQUE)         │    │      ACTIVITY_LOGS         │
│  publisher             │    │  id (UUID PK)              │
│  published_year        │    │  actor_id (FK→users)       │
│  genre                 │    │  action (VARCHAR)          │
│  tags (TEXT[])         │    │  entity_type │ entity_id   │
│  description           │    │  metadata (JSONB)          │
│  cover_url             │    │  ip_address (INET)         │
│  total_copies          │    │  created_at                │
│  available_copies      │    └────────────────────────────┘
│  location              │
│  language  │  pages    │
│  embedding (VECTOR)    │
│  qr_code_data (TEXT)   │
│  created_at │ updated_at│
└────────────────────────┘
```

## Key Relationships

| From        | To            | Type       | Via                      |
|-------------|---------------|------------|--------------------------|
| Users       | Roles         | Many→One   | users.role_id            |
| Transactions| Users         | Many→One   | transactions.user_id     |
| Transactions| Books         | Many→One   | transactions.book_id     |
| Transactions| Users (admin) | Many→One   | transactions.issued_by   |
| Notifications| Users        | Many→One   | notifications.user_id    |
| Chat History | Users        | Many→One   | chat_history.user_id     |
| Activity Log | Users        | Many→One   | activity_logs.actor_id   |

## Business Rules

1. A user can only have **one active borrow** of the same book at a time
2. `available_copies` is decremented on issue, incremented on return (atomic transaction)
3. Books are automatically marked **overdue** by the nightly cron job when `due_date < NOW()`
4. Fine = **$1.00 per day** past due date, calculated at return time
5. New users start with status `pending` – admin must approve to `active`
6. Embeddings (384-dim) stored in `books.embedding` for semantic search (optional pgvector)

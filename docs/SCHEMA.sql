-- QALAM Library Management System
-- PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- ─────────────────────────────────────────
-- ROLES
-- ─────────────────────────────────────────
CREATE TABLE roles (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(50) UNIQUE NOT NULL, -- 'admin' | 'user'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name) VALUES ('admin'), ('user');

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(150)  NOT NULL,
  email         VARCHAR(255)  UNIQUE NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  role_id       INT           NOT NULL REFERENCES roles(id) DEFAULT 2,
  status        VARCHAR(20)   NOT NULL DEFAULT 'pending', -- pending|active|suspended
  avatar_url    TEXT,
  phone         VARCHAR(20),
  address       TEXT,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- ─────────────────────────────────────────
-- BOOKS
-- ─────────────────────────────────────────
CREATE TABLE books (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(500)  NOT NULL,
  author        VARCHAR(300)  NOT NULL,
  isbn          VARCHAR(20)   UNIQUE,
  publisher     VARCHAR(200),
  published_year INT,
  genre         VARCHAR(100),
  tags          TEXT[],                    -- array of tag strings
  description   TEXT,
  cover_url     TEXT,
  total_copies  INT           NOT NULL DEFAULT 1,
  available_copies INT        NOT NULL DEFAULT 1,
  location      VARCHAR(100),             -- shelf location
  language      VARCHAR(50)   DEFAULT 'English',
  pages         INT,
  embedding     VECTOR(384),             -- sentence-transformer embedding (pgvector if available)
  qr_code_data  TEXT,                    -- base64 QR image or URL
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX idx_books_title  ON books USING gin(to_tsvector('english', title));
CREATE INDEX idx_books_author ON books USING gin(to_tsvector('english', author));
CREATE INDEX idx_books_genre  ON books(genre);
CREATE INDEX idx_books_isbn   ON books(isbn);

-- ─────────────────────────────────────────
-- TRANSACTIONS (borrow / return)
-- ─────────────────────────────────────────
CREATE TABLE transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  book_id       UUID NOT NULL REFERENCES books(id)  ON DELETE CASCADE,
  issued_by     UUID REFERENCES users(id),          -- admin who issued
  returned_to   UUID REFERENCES users(id),          -- admin who accepted return
  borrow_date   TIMESTAMPTZ   DEFAULT NOW(),
  due_date      TIMESTAMPTZ   NOT NULL,
  return_date   TIMESTAMPTZ,
  status        VARCHAR(20)   NOT NULL DEFAULT 'borrowed', -- borrowed|returned|overdue
  fine_amount   DECIMAL(10,2) DEFAULT 0.00,
  fine_paid     BOOLEAN       DEFAULT FALSE,
  notes         TEXT,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX idx_txn_user   ON transactions(user_id);
CREATE INDEX idx_txn_book   ON transactions(book_id);
CREATE INDEX idx_txn_status ON transactions(status);
CREATE INDEX idx_txn_due    ON transactions(due_date);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  message     TEXT         NOT NULL,
  type        VARCHAR(50)  NOT NULL, -- due_reminder|overdue|approval|general
  is_read     BOOLEAN      DEFAULT FALSE,
  email_sent  BOOLEAN      DEFAULT FALSE,
  related_id  UUID,                  -- transaction or book id for deep-link
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_notif_user   ON notifications(user_id);
CREATE INDEX idx_notif_unread ON notifications(user_id, is_read);

-- ─────────────────────────────────────────
-- ACTIVITY LOGS
-- ─────────────────────────────────────────
CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,  -- e.g. BOOK_ISSUED, USER_APPROVED
  entity_type VARCHAR(50),
  entity_id   UUID,
  metadata    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_log_actor  ON activity_logs(actor_id);
CREATE INDEX idx_log_action ON activity_logs(action);
CREATE INDEX idx_log_time   ON activity_logs(created_at DESC);

-- ─────────────────────────────────────────
-- CHAT HISTORY (AI Chatbot)
-- ─────────────────────────────────────────
CREATE TABLE chat_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(20) NOT NULL,   -- 'user' | 'assistant'
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_user ON chat_history(user_id, created_at DESC);

-- ─────────────────────────────────────────
-- HELPER: auto-update updated_at
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at  BEFORE UPDATE ON users  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_books_updated_at  BEFORE UPDATE ON books  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_txn_updated_at    BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

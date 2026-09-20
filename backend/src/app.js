const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const path         = require('path');

const authRoutes   = require('./routes/auth');
const bookRoutes   = require('./routes/books');
const userRoutes   = require('./routes/users');
const txnRoutes    = require('./routes/transactions');
const notifRoutes  = require('./routes/notifications');
const chatRoutes   = require('./routes/chatbot');
const adminRoutes  = require('./routes/admin');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── Security Middleware ─────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// ─── Rate Limiting ───────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// ─── Parsers & Logger ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Static Uploads ──────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Health Check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'QALAM Backend' }));

// ─── Routes ──────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/books',         bookRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/transactions',  txnRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/chatbot',       chatRoutes);
app.use('/api/admin',         adminRoutes);

// ─── Global Error Handler ─────────────────────────────────────────
app.use(errorHandler);

module.exports = app;

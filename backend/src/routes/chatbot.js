const express = require('express');
const axios   = require('axios');
const { authenticate } = require('../middleware/auth');
const { query }  = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const router  = express.Router();

const AI_URL  = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// POST /api/chatbot/message
router.post('/message', authenticate, asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  // Save user message
  await query(
    'INSERT INTO chat_history (user_id, role, content) VALUES ($1,$2,$3)',
    [req.user.id, 'user', message]
  );

  // Forward to AI microservice
  const aiRes = await axios.post(`${AI_URL}/chat`, {
    message,
    user_id: req.user.id,
    history
  }, { timeout: 30000 });

  const { reply, recommendations } = aiRes.data;

  // Save assistant reply
  await query(
    'INSERT INTO chat_history (user_id, role, content) VALUES ($1,$2,$3)',
    [req.user.id, 'assistant', reply]
  );

  res.json({ reply, recommendations });
}));

// GET /api/chatbot/history
router.get('/history', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT id, role, content, created_at FROM chat_history
     WHERE user_id = $1 ORDER BY created_at ASC LIMIT 100`,
    [req.user.id]
  );
  res.json({ history: rows });
}));
// This goes in your Node.js Backend, NOT the Python or React files
router.post('/message', async (req, res) => {
    try {
        // This line forwards the message to your Python script
        const pythonResponse = await axios.post('http://localhost:5000/chatbot', req.body);
        res.json(pythonResponse.data);
    } catch (error) {
        res.status(500).send("Node.js could not reach the Python AI");
    }
});
module.exports = router;

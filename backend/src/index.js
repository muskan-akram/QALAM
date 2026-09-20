// QALAM Backend – Entry Point
require('dotenv').config();
const app      = require('./app');
const { pool } = require('./db/pool');
const cron     = require('./services/cronJobs');
const logger   = require('./utils/logger');

const PORT = process.env.PORT || 5000;

(async () => {
  // Verify DB connection
  try {
    await pool.query('SELECT 1');
    logger.info('✅ PostgreSQL connected');
  } catch (err) {
    logger.error('❌ DB connection failed:', err.message);
    process.exit(1);
  }

  // Start cron jobs (overdue checks, reminders)
  cron.start();

  app.listen(PORT, () => {
    logger.info(`🚀 QALAM API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
})();

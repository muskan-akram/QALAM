const { Pool } = require('pg');
const logger   = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.includes('amazonaws')
    ? { rejectUnauthorized: false }
    : false
});

pool.on('error', (err) => {
  logger.error('Unexpected DB pool error:', err);
});

/**
 * Execute a query with optional client (for transactions)
 * @param {string} text - SQL query
 * @param {Array}  params - Query parameters
 * @param {object} client - Optional pg client for transactions
 */
async function query(text, params, client) {
  const start  = Date.now();
  const caller = client || pool;
  const result = await caller.query(text, params);
  const dur    = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    logger.debug(`[DB] ${text.substring(0, 80)} | ${dur}ms | ${result.rowCount} rows`);
  }
  return result;
}

module.exports = { pool, query };

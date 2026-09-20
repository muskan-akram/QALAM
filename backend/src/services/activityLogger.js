const { query } = require('../db/pool');
const logger    = require('../utils/logger');

/**
 * Log an admin/user action
 */
async function logActivity(actorId, action, entityType, entityId, metadata = {}) {
  try {
    await query(
      `INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [actorId, action, entityType, entityId, JSON.stringify(metadata)]
    );
  } catch (err) {
    logger.error('Activity log error:', err.message);
  }
}

module.exports = { logActivity };

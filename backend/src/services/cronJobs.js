const cron   = require('node-cron');
const logger = require('../utils/logger');
const { notifyOverdueUsers, sendDueReminders } = require('./notificationService');

exports.start = () => {
  // Check overdue every day at 9am
  cron.schedule('0 9 * * *', async () => {
    logger.info('[CRON] Running overdue check...');
    await notifyOverdueUsers();
  });

  // Send due reminders every day at 8am
  cron.schedule('0 8 * * *', async () => {
    logger.info('[CRON] Sending due reminders...');
    await sendDueReminders();
  });

  logger.info('✅ Cron jobs started');
};

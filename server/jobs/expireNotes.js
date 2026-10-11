const cron = require('node-cron');
const Note = require('../models/Note');

const startExpiryCronJob = () => {
  // Run every 60 seconds using 6-field cron expression
  cron.schedule('*/60 * * * * *', async () => {
    try {
      const now = new Date();
      const filter = {
        isPermanent: false,
        isDeleted: false,
        expiresAt: { $ne: null, $lt: now },
      };

      const expiredNotes = await Note.find(filter);
      const count = expiredNotes.length;

      if (count > 0) {
        await Note.deleteMany(filter);
        console.log(`Cron: deleted ${count} expired notes`);
      }
    } catch (err) {
      console.error('Cron job error:', err);
    }
  });
};

module.exports = { startExpiryCronJob };

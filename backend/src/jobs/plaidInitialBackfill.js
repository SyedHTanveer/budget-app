const { enqueue } = require('../queue/bullmq');

async function queuePlaidInitialBackfill(userId, itemId) {
  return enqueue('plaid','initial_backfill',{ userId, itemId });
}

module.exports = { queuePlaidInitialBackfill };

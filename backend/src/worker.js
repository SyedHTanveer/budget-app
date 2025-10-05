require('dotenv').config();
const { createWorker } = require('./queue/bullmq');
const { logger } = require('./logger');
const { db } = require('./config/database');
const JSZip = require('jszip');
const { toCSV } = require('./utils/csv');

// Workers will return null if Redis unavailable - gracefully handle
const plaidWorker = createWorker('plaid', async job => {
  if (job.name === 'initial_backfill') {
    const { userId, itemId } = job.data;
    const { logger } = require('./logger');
    const PlaidService = require('./services/plaidService');
    const res = await PlaidService.historicalBackfill(userId, itemId);
    logger.info({ userId, itemId, jobId: job.id, added: res.added }, 'plaid initial backfill complete');
    return res;
  }
  if (job.name === 'incremental_sync') {
    const { userId, itemId } = job.data;
    const PlaidService = require('./services/plaidService');
    return await PlaidService.syncIncremental(userId, itemId);
  }
});

const exportWorker = createWorker('export', async job => {
  if (job.name === 'generate_user_export') {
    const { userId, jobId } = job.data;
    logger.info({ jobId, userId }, 'export job started');
    try {
      await db('export_jobs').where({ id: jobId }).update({ status: 'processing', updated_at: new Date() });

      // Fetch datasets
      const [accounts, transactions, categories, goals, vacations, prefs, aiUsage] = await Promise.all([
        db('accounts').where({ user_id: userId }),
        db('transactions').where({ user_id: userId }).limit(20000),
        db('budget_categories').where({ user_id: userId }).catch(()=>[]),
        db('goals').where({ user_id: userId }).catch(()=>[]),
        db('vacation_periods').where({ user_id: userId }).catch(()=>[]),
        db('user_budget_prefs').where({ user_id: userId }).catch(()=>[]),
        db('ai_chat_usage').where({ user_id: userId }).catch(()=>[])
      ]);

      const zip = new JSZip();
      zip.file('metadata.json', JSON.stringify({ generatedAt: new Date().toISOString(), version: 1 }, null, 2));
      zip.file('accounts.csv', toCSV(accounts));
      zip.file('transactions.csv', toCSV(transactions));
      zip.file('categories.csv', toCSV(categories));
      zip.file('goals.csv', toCSV(goals));
      zip.file('vacation_periods.csv', toCSV(vacations));
      zip.file('user_budget_prefs.csv', toCSV(prefs));
      zip.file('ai_chat_usage.csv', toCSV(aiUsage));

      const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      const base64 = content.toString('base64');
      await db('export_jobs').where({ id: jobId }).update({
        status: 'complete',
        zip_base64: base64,
        bytes: content.length,
        completed_at: new Date(),
        updated_at: new Date()
      });
      logger.info({ jobId, userId, bytes: content.length }, 'export job complete');
      return { bytes: content.length };
    } catch (err) {
      logger.error({ err, jobId, userId }, 'export job failed');
      await db('export_jobs').where({ id: jobId }).update({ status: 'failed', error: err.message, updated_at: new Date() });
      throw err;
    }
  }
  if (job.name === 'cleanup_old_exports') {
    const days = job.data.days || 7;
    const cutoff = new Date(Date.now() - days*24*60*60*1000);
    const removed = await db('export_jobs')
      .where(function() {
        this.whereNotNull('downloaded_at').andWhere('downloaded_at','<', cutoff)
          .orWhere(function() { this.where('status','complete').andWhere('completed_at','<', cutoff); });
      })
      .del();
    logger.info({ removed, days }, 'export cleanup done');
    return { removed };
  }
});

const alertsWorker = createWorker('alerts', async job => {
  if (job.name === 'evaluate_user_alerts') {
    const { userId } = job.data;
    const AlertsEngine = require('./services/alertsEngine');
    const events = await AlertsEngine.evaluateUser(userId);
    if (events.length) {
      const { logger } = require('./logger');
      logger.info({ userId, events: events.length }, 'alerts triggered');
    }
    return { events: events.length };
  }
});

const rolloverWorker = createWorker('rollover', async job => {
  if (job.name === 'close_month') {
    const { userId } = job.data;
    const RolloverService = require('./services/rolloverService');
    return await RolloverService.closeMonth(userId);
  }
});

if (plaidWorker || exportWorker || alertsWorker || rolloverWorker) {
  logger.info('Worker started with available queues');
} else {
  logger.warn('Worker started but Redis unavailable - background jobs disabled');
}

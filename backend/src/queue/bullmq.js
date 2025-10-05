const { Queue, Worker, QueueScheduler, JobsOptions } = require('bullmq');
const IORedis = require('ioredis');
const { logger } = require('../logger');

// Create Redis connection with graceful degradation
// If Redis is unavailable, queue operations will no-op
let connection = null;
let redisAvailable = false;

try {
  connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => {
      // Stop retrying after 3 attempts
      if (times > 3) {
        logger.warn('Redis unavailable - queue operations will be disabled');
        return null;
      }
      return Math.min(times * 50, 2000);
    }
  });

  // Handle connection errors gracefully
  connection.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      redisAvailable = false;
      // Silently ignore - already logged in retryStrategy
    } else {
      logger.error({ err }, 'Redis connection error');
    }
  });

  connection.on('ready', () => {
    redisAvailable = true;
    logger.info('Redis connected - queue operations enabled');
  });

  // Attempt connection but don't block startup
  connection.connect().catch(() => {
    redisAvailable = false;
    logger.warn('Redis unavailable at startup - queue operations disabled');
  });
} catch (err) {
  logger.warn({ err }, 'Failed to initialize Redis connection - queue operations disabled');
  connection = null;
}

const queues = {};
function getQueue(name) {
  if (!connection || !redisAvailable) {
    // Return a mock queue that no-ops
    return {
      add: async () => ({ id: 'no-op' }),
      getJobCounts: async () => ({ waiting: 0, active: 0, completed: 0, failed: 0 })
    };
  }
  
  if (!queues[name]) {
    queues[name] = new Queue(name, { connection, prefix: process.env.QUEUE_PREFIX || 'budgetapp' });
    new QueueScheduler(name, { connection }); // ensures delayed jobs processed
  }
  return queues[name];
}

function createWorker(name, processor, opts = {}) {
  if (!connection || !redisAvailable) {
    logger.warn({ queue: name }, 'Worker not started - Redis unavailable');
    return null;
  }
  
  return new Worker(name, async job => {
    try {
      return await processor(job);
    } catch (err) {
      logger.error({ err, jobId: job.id, queue: name }, 'job failed');
      throw err;
    }
  }, { connection, concurrency: opts.concurrency || 1 });
}

async function enqueue(queueName, name, data = {}, opts = {}) {
  if (!connection || !redisAvailable) {
    logger.debug({ queue: queueName, job: name }, 'Queue operation skipped - Redis unavailable');
    return 'no-op';
  }
  
  const q = getQueue(queueName);
  const job = await q.add(name, data, opts);
  return job.id;
}

module.exports = { getQueue, createWorker, enqueue, connection };

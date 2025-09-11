const { Queue, Worker, QueueScheduler, JobsOptions } = require('bullmq');
const IORedis = require('ioredis');
const { logger } = require('../logger');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

const queues = {};
function getQueue(name) {
  if (!queues[name]) {
    queues[name] = new Queue(name, { connection, prefix: process.env.QUEUE_PREFIX || 'budgetapp' });
    new QueueScheduler(name, { connection }); // ensures delayed jobs processed
  }
  return queues[name];
}

function createWorker(name, processor, opts = {}) {
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
  const q = getQueue(queueName);
  const job = await q.add(name, data, opts);
  return job.id;
}

module.exports = { getQueue, createWorker, enqueue, connection };

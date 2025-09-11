// Generic queue adapter interface (future alternate implementations)
class QueueAdapter {
  async enqueue(queueName, name, data, opts) { throw new Error('not implemented'); }
  async getJob(queueName, id) { throw new Error('not implemented'); }
  async getState(queueName, id) { throw new Error('not implemented'); }
}
module.exports = { QueueAdapter };

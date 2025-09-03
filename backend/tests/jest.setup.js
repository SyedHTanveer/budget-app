// Global Jest setup for backend tests
process.env.NODE_ENV = 'test';
process.env.LOCAL_ONLY_MODE = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'x'.repeat(32); // exactly 32 for env test expectations
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test';
process.env.PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || 'plaid-client-test';
process.env.PLAID_SECRET = process.env.PLAID_SECRET || 'plaid-secret-test';

// Mock queue enqueue to avoid Redis dependency
jest.mock('../src/queue/bullmq', () => ({ enqueue: async () => 'test-job-id' }));

// Mock OpenAI to avoid network & control quota behavior
jest.mock('openai', () => ({
  OpenAI: function() {
    return {
      chat: { completions: { create: async () => ({ choices: [{ message: { content: 'stub response' } }] }) } }
    };
  }
}));

// Teardown: close knex connection after all tests
afterAll(async () => {
  const { db } = require('../src/config/database');
  await db.destroy();
});

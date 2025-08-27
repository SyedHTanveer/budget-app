const request = require('supertest');
const express = require('express');
const aiRoutes = require('../src/routes/ai');
const authRoutes = require('../src/routes/auth');
const requestContext = require('../src/middleware/common/requestContext');
const errorHandler = require('../src/middleware/common/errorHandler');
const { db } = require('../src/config/database');
const { signAccessToken } = require('../src/utils/tokens');
const { v4: uuid } = require('uuid');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecretkeytestsecretkey123456';

function makeApp(token) {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use('/api/v1/ai', (req,res,next)=> { req.headers.authorization = `Bearer ${token}`; next(); }, aiRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

describe('AI quota enforcement', () => {
  test('exceeds daily limit returns 429', async () => {
    const userId = uuid();
    await db('users').insert({ id: userId, email: `${userId}@ex.com`, password_hash: 'x' });
    const token = signAccessToken({ id: userId, email: `${userId}@ex.com` });
    const app = makeApp(token);

    // Insert usage reaching limit (10 + 2 soft overflow) artificially
    const today = new Date().toISOString().slice(0,10);
    await db('ai_chat_usage').insert({ id: uuid(), user_id: userId, date: today, chats_used: 12 });

    const resp = await request(app).post('/api/v1/ai/chat').send({ query: 'Test' });
    expect(resp.status).toBe(429);
    expect(resp.body.error.code).toBe('CHAT_LIMIT');
  });
});
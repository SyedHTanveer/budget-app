const { db } = require('../src/config/database');
const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/routes/auth');
const requestContext = require('../src/middleware/common/requestContext');
const errorHandler = require('../src/middleware/common/errorHandler');
const { signAccessToken, generateRefreshToken, persistRefreshToken } = require('../src/utils/tokens');
const { v4: uuid } = require('uuid');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecretkeytestsecretkey123456';

function makeApp() {
  const app = express();
  app.use(requestContext);
  app.use(require('cookie-parser')());
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

describe('Sessions endpoints', () => {
  test('list and revoke sessions', async () => {
    const userId = uuid();
    await db('users').insert({ id: userId, email: `${userId}@ex.com`, password_hash: 'x' });
    // create two refresh tokens
    const t1 = generateRefreshToken();
    await persistRefreshToken(userId, t1, 'UA1', '127.0.0.1');
    const t2 = generateRefreshToken();
    await persistRefreshToken(userId, t2, 'UA2', '127.0.0.1');

    const access = signAccessToken({ id: userId, email: `${userId}@ex.com` });
    const app = makeApp();

    const list = await request(app).get('/api/v1/auth/sessions').set('Authorization', `Bearer ${access}`);
    expect(list.body.sessions.length).toBeGreaterThanOrEqual(2);

    const firstId = list.body.sessions[0].id;
    await request(app).delete(`/api/v1/auth/sessions/${firstId}`).set('Authorization', `Bearer ${access}`);

    const list2 = await request(app).get('/api/v1/auth/sessions').set('Authorization', `Bearer ${access}`);
    expect(list2.body.sessions.find(s => s.id === firstId)).toBeUndefined();
  });
});
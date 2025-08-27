const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('../src/routes/auth');
const requestContext = require('../src/middleware/common/requestContext');
const errorHandler = require('../src/middleware/common/errorHandler');
const { db } = require('../src/config/database');
require('dotenv').config();

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecretkeytestsecretkey123456';

function makeApp() {
  const app = express();
  app.use(requestContext);
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

describe('Refresh Token Flow', () => {
  let email, password;
  beforeAll(async () => {
    const hasUsers = await db.schema.hasTable('users');
    if (!hasUsers) {
      console.warn('users table missing, skipping refresh tests');
      jest.skip();
    }
    email = `rt_${Date.now()}@ex.com`;
    password = 'password123';
  });

  test('register -> refresh -> logout', async () => {
    const app = makeApp();
    const reg = await request(app).post('/api/v1/auth/register').send({ email, password, firstName: 'R', lastName: 'T' });
    expect([201,400]).toContain(reg.status);

    const login = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    const cookie = login.headers['set-cookie'].find(c => c.startsWith('refresh_token'));
    expect(cookie).toBeDefined();
    const token = login.body.token;

    const refresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .send({ currentToken: token });
    expect(refresh.status).toBe(200);
    expect(refresh.body.token).toBeDefined();

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie);
    expect(logout.status).toBe(200);
  });
});

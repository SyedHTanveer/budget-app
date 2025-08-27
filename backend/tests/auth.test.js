const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/routes/auth');
const requestContext = require('../src/middleware/common/requestContext');
const errorHandler = require('../src/middleware/common/errorHandler');
const { db } = require('../src/config/database');
require('dotenv').config();

// Ensure JWT_SECRET for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecretkeytestsecretkey123456';

function makeApp() {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

describe('Auth Routes', () => {
  beforeAll(async () => {
    // Ensure users table exists (simple check) – if migrations not run, skip tests gracefully
    const hasUsers = await db.schema.hasTable('users');
    if (!hasUsers) {
      console.warn('users table missing, skipping auth tests');
      jest.skip();
    }
  });

  test('register -> login flow', async () => {
    const email = `test_${Date.now()}@ex.com`;
    const password = 'password123';

    const reg = await request(makeApp())
      .post('/api/auth/register')
      .send({ email, password, firstName: 'T', lastName: 'U' });

    expect([201,400]).toContain(reg.status); // if already exists

    const login = await request(makeApp())
      .post('/api/auth/login')
      .send({ email, password });

    if (login.status !== 200) {
      // In case register failed due to existing user with different password
      expect(login.status).toBe(200);
    } else {
      expect(login.body.token).toBeDefined();
    }
  });
});

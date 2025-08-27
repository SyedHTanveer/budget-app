const express = require('express');
const request = require('supertest');
const errorHandler = require('../src/middleware/common/errorHandler');
const requestContext = require('../src/middleware/common/requestContext');
const { AppError, ValidationError } = require('../src/errors/AppError');

function makeApp() {
  const app = express();
  app.use(requestContext);
  app.get('/ok', (req, res) => res.json({ ok: true }));
  app.get('/validation', () => { throw new ValidationError('Bad input'); });
  app.get('/generic', () => { throw new Error('Boom'); });
  app.use((req,res,next)=>next(new AppError({ code:'CUSTOM', message:'Custom', httpStatus:418 })));
  app.use(errorHandler);
  return app;
}

describe('Error Handler', () => {
  test('returns validation error', async () => {
    const res = await request(makeApp()).get('/validation');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
  test('returns internal error for generic', async () => {
    const res = await request(makeApp()).get('/generic');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });
  test('custom app error', async () => {
    const res = await request(makeApp()).get('/unknown');
    expect(res.status).toBe(418);
    expect(res.body.error.code).toBe('CUSTOM');
  });
  test('sets request id header', async () => {
    const res = await request(makeApp()).get('/ok');
    expect(res.headers['x-request-id']).toBeDefined();
  });
});

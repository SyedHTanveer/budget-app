const express = require('express');
const request = require('supertest');
const requestContext = require('../src/middleware/common/requestContext');

function makeApp() {
  const app = express();
  app.use(requestContext);
  app.get('/ping', (req,res)=> res.json({ id: req.id }));
  return app;
}

describe('Request Context', () => {
  test('injects request id', async () => {
    const res = await request(makeApp()).get('/ping');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.body.id).toBeDefined();
  });
});

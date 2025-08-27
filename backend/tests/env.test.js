const { loadEnv } = require('../src/config/env');

describe('Environment Validation', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('fails when JWT_SECRET missing', () => {
    delete process.env.JWT_SECRET;
    const spy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => loadEnv()).toThrow('exit');
    spy.mockRestore();
  });

  test('loads valid env', () => {
    process.env.JWT_SECRET = 'x'.repeat(32);
    const env = loadEnv();
    expect(env.JWT_SECRET).toHaveLength(32);
    expect(env.ACCESS_TOKEN_TTL_MINUTES).toBe('15');
  });
});

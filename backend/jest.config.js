module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.{js,ts}', '!src/index.js'],
  coverageDirectory: 'coverage',
  reporters: ['default'],
};

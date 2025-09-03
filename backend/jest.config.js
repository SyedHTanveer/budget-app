module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  collectCoverageFrom: ['src/**/*.{js,ts}', '!src/index.js'],
  coverageDirectory: 'coverage',
  reporters: ['default'],
};

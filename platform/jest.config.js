/** Jest config for the platform orchestrator's own test suite. */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
};

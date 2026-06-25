// Jest config for the Expo / React Native frontend.
//
// The `jest-expo` preset wires up babel-jest (with babel-preset-expo) and the
// correct transformIgnorePatterns so React Native / Expo ESM packages are
// transformed instead of failing with "Cannot use import statement outside a
// module". Tests are co-located in __tests__ folders under src.
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.{test,spec}.{ts,tsx}'],
};

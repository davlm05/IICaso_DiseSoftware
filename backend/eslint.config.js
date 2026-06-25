// ESLint v9 flat config for the SmartCart backend (apps/**/*.ts).
// ESLint 9 requires this file (the old .eslintrc format is no longer the
// default). This is a parse-clean baseline using the TypeScript parser; tighten
// by adding `...tseslint.configs.recommended` once the modules are cleaned to
// satisfy the recommended rule set.
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.config.*', '**/prisma/**'],
  },
  {
    files: ['apps/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    },
    // No rules enabled yet, so don't flag inline eslint-disable comments that
    // reference (not-yet-enabled) rules as "unused directives".
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: {},
  },
);

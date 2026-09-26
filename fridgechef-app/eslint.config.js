// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  // Last, so it switches off every stylistic rule that Prettier owns.
  prettierConfig,
  {
    ignores: ['dist/*', '.verify-dist/*', '.expo/*'],
  },
]);

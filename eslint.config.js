// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'writable',
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
      sourceType: 'commonjs',
    },
    ignores: [
      'node_modules',
      'dist',
      'build',
      '.expo',
      '.next',
      '.nuxt',
      'out',
      'coverage',
      '*.log',
      '.env.local',
      '.env.*.local',
    ],
  },
]);

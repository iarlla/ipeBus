module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: ['node_modules/', 'coverage/'],
  rules: {
    'no-console': 'off',
  },
  overrides: [
    {
      files: ['src/browser/**/*.js'],
      env: {
        browser: true,
      },
    },
  ],
};

module.exports = {
  env: {
    node: true,
  },
  overrides: [
    {
      files: ['**/*.js'],
      excludedFiles: '*.spec.js',
      rules: {
        'no-unused-vars': 'error',
      },
    },
    {
      files: ['**/*.spec.js'],
      rules: {
        'max-lines': 'off',
        'no-useless-escape': 'off',
      },
    },
  ],
  parserOptions: {
    ecmaFeatures: {
      impliedStrict: true,
    },
    ecmaVersion: 13,
    sourceType: 'module',
  },
  rules: {},
};

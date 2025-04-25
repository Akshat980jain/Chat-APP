module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
  ],
  rules: {
    // No specific rule needed here
  },
  overrides: [
    {
      files: ['**/*.js'],
      rules: {
        'import/no-webpack-loader-syntax': 'off'
      }
    }
  ],
  // Ignore node_modules when linting
  ignorePatterns: ['node_modules/**/*', 'build/**/*'],
}; 
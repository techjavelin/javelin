/* ESLint configuration adding custom auth mode rule */
module.exports = {
  root: true,
  env: { es2022: true, browser: true, node: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  extends: [],
  plugins: [ 'local-rules' ],
  rules: {
    'local-rules/require-auth-mode': 'warn'
  },
  settings: {},
  'local-rules': {
    // Map rule name to path
    'require-auth-mode': require('./eslint-rules/require-auth-mode.js')
  }
};

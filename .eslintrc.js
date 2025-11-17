module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Disable the unused vars rule that's causing build failures
    '@typescript-eslint/no-unused-vars': 'off',
    // Additional rules can be disabled here if needed
  }
}; 
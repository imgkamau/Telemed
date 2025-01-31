module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'react/no-unescaped-entities': 'off'
  },
  // Completely disable ESLint for build
  ignorePatterns: ['**/*'],
  // Disable ESLint during development
  settings: {
    next: {
      rootDir: 'src'
    }
  }
} 
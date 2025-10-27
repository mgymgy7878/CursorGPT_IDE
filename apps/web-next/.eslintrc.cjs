module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react'],
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'react/no-unescaped-entities': 'warn',
    'prefer-const': 'warn'
  },
  overrides: [
    { 
      files: ['**/*.d.ts'], 
      rules: { '@typescript-eslint/no-explicit-any': 'off' } 
    },
    { 
      files: ['_legacy/**', '**/__tests__/**'],
      rules: { 
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-empty': 'off',
        'react/no-unescaped-entities': 'off' 
      } 
    }
  ]
};
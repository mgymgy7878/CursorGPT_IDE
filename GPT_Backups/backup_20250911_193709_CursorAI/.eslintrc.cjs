module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended','plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['**/node_modules/**','**/.next/**','**/dist/**','coverage/**','evidence/**','**/*.d.ts'],
  overrides: [
    {
      files: ['apps/web-next/**/*.{ts,tsx,js,jsx}'],
      extends: ['next/core-web-vitals'],
      settings: { next: { rootDir: ['apps/web-next'] } },
      rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] }
    }
  ]
};
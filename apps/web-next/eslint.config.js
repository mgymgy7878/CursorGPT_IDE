import { FlatCompat } from '@eslint/eslintrc';
import regex from 'eslint-plugin-regex';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**']
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'regex': regex,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      'prefer-const': 'error',
      // Token-only v1: Tailwind arbitrary values ([]) yasak
      'regex/invalid': [
        'error',
        [
          {
            id: 'no-tailwind-arbitrary',
            message: 'Tailwind arbitrary values ([]) yasak — token-only.',
            regex: String.raw`className\s*=\s*(?:\`[^\`]*\[[^\`]*\`|"[^"]*\[[^"]*"|'[^']*\[[^']*')`
          }
        ]
      ]
    },
  },
  ...compat.extends('next/core-web-vitals'),
];

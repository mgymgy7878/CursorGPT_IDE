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
      ],
      // Lightweight Charts v5 migration guard: Eski add*Series API'si yasak
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.type="MemberExpression"][callee.property.name=/^add(Area|Line|Candlestick|Histogram|Baseline|Bar)Series$/]',
          message: 'Lightweight Charts v5: add*Series() kaldırıldı. chartSeries.ts helper\'ını kullanın: import { addAreaSeries } from "@/lib/charts/chartSeries";'
        }
      ],
      // Lightweight Charts v5: Series type ve createChart importlarını sadece wrapper içinde allowed yap
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lightweight-charts',
              importNames: ['AreaSeries', 'LineSeries', 'CandlestickSeries', 'HistogramSeries', 'BaselineSeries', 'BarSeries', 'createChart'],
              message: 'Series type ve createChart importları yasak. chartSeries.ts ve createSparkChart.ts helper\'larını kullanın: import { addAreaSeries } from "@/lib/charts/chartSeries"; import { createSparkChart } from "@/lib/charts/createSparkChart";'
            }
          ]
        }
      ]
    },
  },
  // Allow Series type imports in chartSeries.ts (wrapper itself)
  {
    files: ['src/lib/charts/chartSeries.ts'],
    rules: {
      'no-restricted-imports': 'off'
    }
  },
  // Allow createChart import in createSparkChart.ts (factory itself)
  {
    files: ['src/lib/charts/createSparkChart.ts'],
    rules: {
      'no-restricted-imports': 'off'
    }
  },
  ...compat.extends('next/core-web-vitals'),
];

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/indicators/__tests__/**/*.test.ts'],
    environment: 'node',
  },
});


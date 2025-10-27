import type { Config } from "jest";

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/services', '<rootDir>/apps'],
  moduleNameMapper: {
    '^@spark/(.*)$': '<rootDir>/packages/@spark/$1/src'
  },
  collectCoverageFrom: [
    'packages/@spark/**/src/**/*.{ts,tsx}',
    '!**/*.d.ts'
  ]
};

export default config; 
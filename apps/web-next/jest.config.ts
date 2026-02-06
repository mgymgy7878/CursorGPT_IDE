import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__generated__/**",
    "!src/app/**/layout.tsx", // Layout'lar genelde gürültü yapar
    "!src/app/**/page.tsx", // Sayfaları E2E ile doğruluyoruz
    "!src/**/*.stories.tsx",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/__tests__/**",
  ],
  coverageReporters: ["text", "lcov", "html", "json"],
  // Kademeli artıracağız: İlk hafta 30%, 2. hafta 50%, 3-4. hafta 70%
  coverageThreshold: {
    global: {
      lines: 30,
      statements: 30,
      functions: 25,
      branches: 20,
    },
  },
  testMatch: ["**/__tests__/**/*.{ts,tsx}", "**/?(*.)+(spec|test).{ts,tsx}"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/e2e/", "/tests/"],
};

export default createJestConfig(customJestConfig);

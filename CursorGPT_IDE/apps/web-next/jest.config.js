module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/tests/',
    '<rootDir>/node_modules/'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@spark/(.*)$': '<rootDir>/../../packages/@spark/$1/src'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
}; 
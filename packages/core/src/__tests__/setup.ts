// Jest setup file for global test configuration

// Mock fetch globally for all tests
global.fetch = jest.fn();

// Console log filtering for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  // Reset fetch mock before each test
  (global.fetch as jest.Mock).mockClear();
  
  // Optionally suppress console logs during tests
  // Remove this if you want to see logs during tests
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Restore console methods after each test
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Global test timeout
jest.setTimeout(10000);

// Mock process.env for consistent test environment
process.env.NODE_ENV = 'test'; 
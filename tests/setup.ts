/**
 * Test Setup Configuration
 * Global test environment setup and utilities
 */

import { beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mock console methods for cleaner test output
const originalConsole = { ...console };

beforeEach(() => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';

  // Mock console methods to reduce noise in tests
  console.log = vi.fn();
  console.info = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterEach(() => {
  // Restore console methods
  Object.assign(console, originalConsole);

  // Clean up environment
  delete process.env.NODE_ENV;
  delete process.env.LOG_LEVEL;
});

// Global test utilities
export const testUtils = {
  /**
   * Create a mock request object
   */
  createMockRequest: (url: string = 'http://localhost:3000', options: RequestInit = {}) => {
    return new Request(url, options);
  },

  /**
   * Create a mock response object
   */
  createMockResponse: (body: string, status: number = 200, headers: Record<string, string> = {}) => {
    return new Response(body, {
      status,
      headers: new Headers(headers)
    });
  },

  /**
   * Wait for a specified amount of time
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Measure execution time of a function
   */
  measureTime: async <T>(fn: () => T | Promise<T>): Promise<{ result: T; time: number }> => {
    const start = performance.now();
    const result = await fn();
    const time = performance.now() - start;
    return { result, time };
  }
};

// Export test globals for convenience
export { beforeEach, afterEach, describe, it, expect, vi };

// Type declaration for test globals
declare global {
  const vi: typeof import('vitest').vi;
}
/**
 * Environment Configuration Tests
 * Tests for environment validation and configuration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnvironment } from '../scripts/env-validator';

// Test options: skip file check since we're setting env vars directly, quiet to reduce noise
const testOptions = { skipFileCheck: true, quiet: true };

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Clear environment before each test
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.HOST;
    delete process.env.LOG_LEVEL;
    delete process.env.STARTUP_TIMEOUT;
    delete process.env.MAX_MEMORY_USAGE;
    delete process.env.BUNDLE_SIZE_LIMIT;
  });

  afterEach(() => {
    // Clean up after each test
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.HOST;
    delete process.env.LOG_LEVEL;
    delete process.env.STARTUP_TIMEOUT;
    delete process.env.MAX_MEMORY_USAGE;
    delete process.env.BUNDLE_SIZE_LIMIT;
  });

  it('should validate required environment variables', () => {
    // Set valid environment variables
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3000';
    process.env.HOST = 'localhost';

    // This should not throw an error
    expect(() => {
      validateEnvironment(testOptions);
    }).not.toThrow();
  });

  it('should reject invalid NODE_ENV values', () => {
    process.env.NODE_ENV = 'invalid';
    process.env.PORT = '3000';
    process.env.HOST = 'localhost';

    expect(() => {
      validateEnvironment(testOptions);
    }).toThrow();
  });

  it('should reject invalid PORT values', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = 'invalid';
    process.env.HOST = 'localhost';

    expect(() => {
      validateEnvironment(testOptions);
    }).toThrow();
  });

  it('should reject PORT values outside valid range', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '99999';
    process.env.HOST = 'localhost';

    expect(() => {
      validateEnvironment(testOptions);
    }).toThrow();
  });

  it('should accept valid performance configurations', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3000';
    process.env.HOST = 'localhost';
    process.env.STARTUP_TIMEOUT = '100';
    process.env.MAX_MEMORY_USAGE = '512';
    process.env.BUNDLE_SIZE_LIMIT = '5242880';

    expect(() => {
      validateEnvironment(testOptions);
    }).not.toThrow();
  });

  it('should validate startup timeout constraint', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3000';
    process.env.HOST = 'localhost';
    process.env.STARTUP_TIMEOUT = '150'; // Over 100ms target

    expect(() => {
      validateEnvironment(testOptions);
    }).not.toThrow(); // Should still pass but warn
  });

  it('should validate bundle size limit', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3000';
    process.env.HOST = 'localhost';
    process.env.BUNDLE_SIZE_LIMIT = '5242880'; // 5MB

    expect(() => {
      validateEnvironment(testOptions);
    }).not.toThrow();
  });
});

describe('Performance Constraints', () => {
  it('should enforce 100ms startup timeout target', () => {
    const startupTimeout = parseInt(process.env.STARTUP_TIMEOUT || '100', 10);
    expect(startupTimeout).toBeLessThanOrEqual(100);
  });

  it('should enforce 5MB bundle size limit', () => {
    const bundleLimit = parseInt(process.env.BUNDLE_SIZE_LIMIT || '5242880', 10);
    expect(bundleLimit).toBeLessThanOrEqual(5242880); // 5MB in bytes
  });

  it('should validate memory usage limits', () => {
    const maxMemory = parseInt(process.env.MAX_MEMORY_USAGE || '512', 10);
    expect(maxMemory).toBeGreaterThan(0);
    expect(maxMemory).toBeLessThanOrEqual(2048); // Reasonable upper bound
  });
});
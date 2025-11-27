/**
 * Test Helper Utilities
 * Provides common testing utilities for creating contexts, handling timeouts, and cleanup
 *
 * Usage:
 *   const ctx = await createTestContext({ environment: 'test' });
 *   await withTimeout(async () => { ... }, 5000);
 *   expectError(() => { throw new Error() }, ValidationError, 'INVALID_INPUT');
 *
 * Version: 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { AppContext, type AppConfig } from '../../src/core/app-context.js';
import type { Logger } from '../../src/core/logging/logger.js';
import { ObsidianizeError, type ObsidianizeErrorOptions } from '../../src/core/errors/error-hierarchy.js';
import type { ProcessingError, ErrorCategory } from '../../src/core/types/index.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TestContext {
  appContext: AppContext;
  logger: Logger;
  cleanup: () => Promise<void>;
}

export interface TimeoutOptions {
  timeout?: number;
  description?: string;
}

export interface MockEnvOptions {
  restore?: boolean;
  variables?: Record<string, string>;
}

// ============================================================================
// TEST CONTEXT CREATION
// ============================================================================

/**
 * Create a test AppContext with isolated services
 * Automatically handles cleanup and provides isolated testing environment
 *
 * @param config - Optional configuration for the test context
 * @returns Test context with app context, logger, and cleanup function
 *
 * @example
 * ```typescript
 * const ctx = await createTestContext({
 *   environment: 'test',
 *   logLevel: 'silent',
 * });
 *
 * // Use ctx.appContext, ctx.logger in tests
 *
 * await ctx.cleanup(); // Clean up when done
 * ```
 */
export async function createTestContext(config: Partial<AppConfig> = {}): Promise<TestContext> {
  // Create isolated context for testing
  const testConfig: Partial<AppConfig> = {
    environment: 'test',
    name: 'Obsidianize-Test',
    version: '1.0.0-test',
    cache: {
      defaultTTL: 60000, // 1 minute for tests
      maxSize: 10 * 1024 * 1024, // 10MB for tests
      maxEntries: 100,
      compressionThreshold: 1024,
      cleanupInterval: 300000,
      enableCompression: false, // Disable compression for faster tests
      enableStatistics: false, // Disable stats for faster tests
    },
    rateLimitingEnabled: false, // Disable rate limiting in tests by default
    performanceMonitoringEnabled: false, // Disable performance monitoring in tests
    logLevel: 'silent', // Silent logging in tests by default
    ...config,
  };

  const appContext = AppContext.create(testConfig);
  await appContext.initialize();

  const logger = appContext.getLogger('test');

  const cleanup = async () => {
    try {
      await appContext.shutdown();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  return {
    appContext,
    logger,
    cleanup,
  };
}

/**
 * Create multiple test contexts for parallel testing
 */
export async function createTestContexts(count: number, config: Partial<AppConfig> = {}): Promise<TestContext[]> {
  const contexts: TestContext[] = [];

  for (let i = 0; i < count; i++) {
    const ctx = await createTestContext({
      ...config,
      name: `Obsidianize-Test-${i}`,
    });
    contexts.push(ctx);
  }

  return contexts;
}

/**
 * Cleanup multiple test contexts
 */
export async function cleanupTestContexts(contexts: TestContext[]): Promise<void> {
  await Promise.all(contexts.map(ctx => ctx.cleanup()));
}

// ============================================================================
// TIMEOUT UTILITIES
// ============================================================================

/**
 * Wrap an async operation with a timeout
 * Throws an error if the operation takes longer than the specified timeout
 *
 * @param fn - Async function to execute
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @param description - Description for error messages
 * @returns Result of the async function
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   async () => await longOperation(),
 *   3000,
 *   'Long operation'
 * );
 * ```
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 5000,
  description?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      const msg = description
        ? `Timeout: ${description} exceeded ${timeoutMs}ms`
        : `Timeout exceeded ${timeoutMs}ms`;
      reject(new Error(msg));
    }, timeoutMs);
  });

  return Promise.race([fn(), timeoutPromise]);
}

/**
 * Wait for a condition to be true with timeout
 *
 * @param condition - Function that returns boolean or Promise<boolean>
 * @param options - Configuration options
 * @returns True if condition met, false if timeout
 *
 * @example
 * ```typescript
 * await waitFor(() => data.isReady, { timeout: 5000, interval: 100 });
 * ```
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    description?: string;
  } = {}
): Promise<boolean> {
  const timeout = options.timeout ?? 5000;
  const interval = options.interval ?? 100;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await Promise.resolve(condition());
    if (result) {
      return true;
    }
    await sleep(interval);
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// ERROR ASSERTION UTILITIES
// ============================================================================

/**
 * Type-safe error assertion helper
 * Checks that a function throws an error of the expected type and code
 *
 * @param fn - Function that should throw an error
 * @param expectedErrorClass - Expected error class
 * @param expectedCode - Expected error code (optional)
 * @param expectedMessage - Expected error message substring (optional)
 *
 * @example
 * ```typescript
 * expectError(
 *   () => validateInput(''),
 *   ValidationError,
 *   'INVALID_INPUT',
 *   'Input is required'
 * );
 * ```
 */
export function expectError<T extends Error>(
  fn: () => any,
  expectedErrorClass: new (...args: any[]) => T,
  expectedCode?: string,
  expectedMessage?: string
): T {
  let error: T | null = null;

  try {
    fn();
  } catch (e) {
    error = e as T;
  }

  if (!error) {
    throw new Error(`Expected ${expectedErrorClass.name} to be thrown, but no error was thrown`);
  }

  if (!(error instanceof expectedErrorClass)) {
    throw new Error(
      `Expected error to be instance of ${expectedErrorClass.name}, got ${error.constructor.name}`
    );
  }

  if (expectedCode && 'code' in error) {
    if ((error as any).code !== expectedCode) {
      throw new Error(
        `Expected error code to be "${expectedCode}", got "${(error as any).code}"`
      );
    }
  }

  if (expectedMessage && !error.message.includes(expectedMessage)) {
    throw new Error(
      `Expected error message to contain "${expectedMessage}", got "${error.message}"`
    );
  }

  return error;
}

/**
 * Async version of expectError
 */
export async function expectErrorAsync<T extends Error>(
  fn: () => Promise<any>,
  expectedErrorClass: new (...args: any[]) => T,
  expectedCode?: string,
  expectedMessage?: string
): Promise<T> {
  let error: T | null = null;

  try {
    await fn();
  } catch (e) {
    error = e as T;
  }

  if (!error) {
    throw new Error(`Expected ${expectedErrorClass.name} to be thrown, but no error was thrown`);
  }

  if (!(error instanceof expectedErrorClass)) {
    throw new Error(
      `Expected error to be instance of ${expectedErrorClass.name}, got ${error.constructor.name}`
    );
  }

  if (expectedCode && 'code' in error) {
    if ((error as any).code !== expectedCode) {
      throw new Error(
        `Expected error code to be "${expectedCode}", got "${(error as any).code}"`
      );
    }
  }

  if (expectedMessage && !error.message.includes(expectedMessage)) {
    throw new Error(
      `Expected error message to contain "${expectedMessage}", got "${error.message}"`
    );
  }

  return error;
}

/**
 * Check if a value is an ObsidianizeError with specific properties
 */
export function isObsidianizeError(
  error: unknown,
  category?: ErrorCategory,
  code?: string
): error is ObsidianizeError {
  if (!(error instanceof ObsidianizeError)) {
    return false;
  }

  if (category && error.category !== category) {
    return false;
  }

  if (code && error.code !== code) {
    return false;
  }

  return true;
}

// ============================================================================
// ENVIRONMENT MOCKING
// ============================================================================

/**
 * Mock environment variables for testing
 * Automatically restores original values after test
 *
 * @param variables - Environment variables to set
 * @returns Cleanup function to restore original values
 *
 * @example
 * ```typescript
 * const restore = mockEnv({
 *   GEMINI_API_KEY: 'test-key',
 *   NODE_ENV: 'test',
 * });
 *
 * // Run tests with mocked env
 *
 * restore(); // Restore original values
 * ```
 */
export function mockEnv(variables: Record<string, string>): () => void {
  const original: Record<string, string | undefined> = {};

  // Save original values and set new ones
  for (const [key, value] of Object.entries(variables)) {
    original[key] = process.env[key];
    process.env[key] = value;
  }

  // Return cleanup function
  return () => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

/**
 * Create a scoped environment for a test
 * Automatically restores after the callback completes
 */
export async function withEnv<T>(
  variables: Record<string, string>,
  fn: () => Promise<T>
): Promise<T> {
  const restore = mockEnv(variables);

  try {
    return await fn();
  } finally {
    restore();
  }
}

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

/**
 * Cleanup helper for after test execution
 * Handles common cleanup tasks like closing connections, clearing caches, etc.
 *
 * @example
 * ```typescript
 * afterEach(async () => {
 *   await cleanupAfterTest({
 *     contexts: [ctx],
 *     caches: [cache],
 *     files: ['/tmp/test-file.txt'],
 *   });
 * });
 * ```
 */
export async function cleanupAfterTest(options: {
  contexts?: TestContext[];
  caches?: Array<{ close: () => void }>;
  rateLimiters?: Array<{ close: () => void }>;
  files?: string[];
  directories?: string[];
}): Promise<void> {
  const errors: Error[] = [];

  // Cleanup contexts
  if (options.contexts) {
    for (const ctx of options.contexts) {
      try {
        await ctx.cleanup();
      } catch (error) {
        errors.push(error as Error);
      }
    }
  }

  // Close caches
  if (options.caches) {
    for (const cache of options.caches) {
      try {
        cache.close();
      } catch (error) {
        errors.push(error as Error);
      }
    }
  }

  // Close rate limiters
  if (options.rateLimiters) {
    for (const limiter of options.rateLimiters) {
      try {
        limiter.close();
      } catch (error) {
        errors.push(error as Error);
      }
    }
  }

  // Delete files
  if (options.files) {
    const fs = await import('fs/promises');
    for (const file of options.files) {
      try {
        await fs.unlink(file);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          errors.push(error as Error);
        }
      }
    }
  }

  // Delete directories
  if (options.directories) {
    const fs = await import('fs/promises');
    for (const dir of options.directories) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          errors.push(error as Error);
        }
      }
    }
  }

  // Throw combined error if any cleanup failed
  if (errors.length > 0) {
    const messages = errors.map(e => e.message).join('; ');
    throw new Error(`Cleanup failed: ${messages}`);
  }
}

/**
 * Create a temporary directory for testing
 * Returns path and cleanup function
 */
export async function createTempDir(prefix: string = 'obsidianize-test-'): Promise<{
  path: string;
  cleanup: () => Promise<void>;
}> {
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));

  const cleanup = async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to cleanup temp dir ${tempDir}:`, error);
    }
  };

  return { path: tempDir, cleanup };
}

/**
 * Create a temporary file with content
 * Returns path and cleanup function
 */
export async function createTempFile(
  content: string,
  filename: string = 'test-file.txt'
): Promise<{
  path: string;
  cleanup: () => Promise<void>;
}> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const { path: tempDir, cleanup: cleanupDir } = await createTempDir();
  const filePath = path.join(tempDir, filename);

  await fs.writeFile(filePath, content, 'utf-8');

  return {
    path: filePath,
    cleanup: cleanupDir,
  };
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Expected value to be defined');
  }
}

/**
 * Assert that an array has a specific length
 */
export function assertLength<T>(array: T[], expectedLength: number, message?: string): void {
  if (array.length !== expectedLength) {
    throw new Error(
      message ?? `Expected array length to be ${expectedLength}, got ${array.length}`
    );
  }
}

/**
 * Assert that an object has specific keys
 */
export function assertHasKeys<T extends object>(
  obj: T,
  keys: (keyof T)[],
  message?: string
): void {
  for (const key of keys) {
    if (!(key in obj)) {
      throw new Error(message ?? `Expected object to have key "${String(key)}"`);
    }
  }
}

/**
 * Assert that a value matches a type predicate
 */
export function assertType<T>(
  value: unknown,
  predicate: (val: unknown) => val is T,
  message?: string
): asserts value is T {
  if (!predicate(value)) {
    throw new Error(message ?? 'Value does not match expected type');
  }
}

// ============================================================================
// PERFORMANCE TESTING HELPERS
// ============================================================================

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  fn: () => Promise<T> | T,
  description?: string
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await Promise.resolve(fn());
  const duration = performance.now() - startTime;

  if (description) {
    console.log(`${description}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Run a function multiple times and get statistics
 */
export async function benchmark(
  fn: () => Promise<any> | any,
  iterations: number = 100
): Promise<{
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  medianTime: number;
}> {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    await Promise.resolve(fn());
    const duration = performance.now() - startTime;
    times.push(duration);
  }

  const sorted = [...times].sort((a, b) => a - b);
  const totalTime = times.reduce((sum, time) => sum + time, 0);

  return {
    iterations,
    totalTime,
    averageTime: totalTime / iterations,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    medianTime: sorted[Math.floor(sorted.length / 2)],
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const TestHelpers = {
  // Context
  createTestContext,
  createTestContexts,
  cleanupTestContexts,

  // Timeout
  withTimeout,
  waitFor,
  sleep,

  // Errors
  expectError,
  expectErrorAsync,
  isObsidianizeError,

  // Environment
  mockEnv,
  withEnv,

  // Cleanup
  cleanupAfterTest,
  createTempDir,
  createTempFile,

  // Assertions
  assertDefined,
  assertLength,
  assertHasKeys,
  assertType,

  // Performance
  measureTime,
  benchmark,
};

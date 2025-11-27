/**
 * Test Utilities - Barrel Export
 * Central export point for all test helper utilities
 *
 * Usage:
 *   import { createTestContext, withTimeout, expectError } from '../utils';
 *   import { TestHelpers } from '../utils';
 *
 * Version: 1.0.0
 */

// Export all helper functions
export {
  createTestContext,
  createTestContexts,
  cleanupTestContexts,
  withTimeout,
  waitFor,
  sleep,
  expectError,
  expectErrorAsync,
  isObsidianizeError,
  mockEnv,
  withEnv,
  cleanupAfterTest,
  createTempDir,
  createTempFile,
  assertDefined,
  assertLength,
  assertHasKeys,
  assertType,
  measureTime,
  benchmark,
  TestHelpers,
} from './test-helpers.js';

// Export types
export type {
  TestContext,
  TimeoutOptions,
  MockEnvOptions,
} from './test-helpers.js';

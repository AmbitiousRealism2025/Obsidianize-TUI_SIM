/**
 * Example Test Suite - Demonstrates Mock Factories and Test Helpers Usage
 * This file serves as both documentation and testing for the test infrastructure
 *
 * Version: 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';

// Import mock factories
import {
  GeminiMockFactory,
  NetworkMockFactory,
  FileSystemMockFactory,
  DatabaseMockFactory,
  ProcessingMockFactory,
} from './mocks/index.js';

// Import test helpers
import {
  createTestContext,
  withTimeout,
  expectError,
  expectErrorAsync,
  mockEnv,
  cleanupAfterTest,
  createTempFile,
  measureTime,
  sleep,
  TestContext,
} from './utils/index.js';

import { ValidationError, NetworkError } from '../src/core/errors/error-hierarchy.js';

// ============================================================================
// GEMINI MOCK FACTORY EXAMPLES
// ============================================================================

describe('GeminiMockFactory Examples', () => {
  it('should create successful Gemini response', () => {
    const response = GeminiMockFactory.createSuccess({
      text: 'This is a test response',
      promptTokens: 50,
      completionTokens: 100,
    });

    expect(response.text).toBe('This is a test response');
    expect(response.usage.totalTokens).toBe(150);
    expect(response.model).toBe('gemini-1.5-flash');
  });

  it('should create Gemini error responses', () => {
    const timeoutError = GeminiMockFactory.createError('timeout');
    expect(timeoutError.code).toBe('TIMEOUT');
    expect(timeoutError.status).toBe(408);

    const rateLimitError = GeminiMockFactory.createError('rate_limit');
    expect(rateLimitError.code).toBe('RATE_LIMIT');
    expect(rateLimitError.status).toBe(429);
  });

  it('should create mock Gemini client', async () => {
    const mockClient = GeminiMockFactory.createMockClient({
      shouldSucceed: true,
      responseText: 'Mock AI response',
    });

    const response = await mockClient.generateContent({
      prompt: 'Test prompt',
    });

    expect(response.text).toBe('Mock AI response');
  });

  it('should create failing mock Gemini client', async () => {
    const mockClient = GeminiMockFactory.createMockClient({
      shouldSucceed: false,
      errorType: 'auth',
    });

    try {
      await mockClient.generateContent({ prompt: 'Test' });
      throw new Error('Should have thrown');
    } catch (error: any) {
      expect(error.code).toBe('AUTHENTICATION');
    }
  });

  it('should create mock Gemini Gem', () => {
    const gem = GeminiMockFactory.createMockGem();

    expect(gem.frontmatter.title).toBeDefined();
    expect(gem.frontmatter.tags.length).toBeGreaterThan(0);
    expect(gem.content.summary).toBeDefined();
    expect(gem.content.sections).toHaveLength(2);
  });
});

// ============================================================================
// NETWORK MOCK FACTORY EXAMPLES
// ============================================================================

describe('NetworkMockFactory Examples', () => {
  it('should create successful HTTP response', () => {
    const response = NetworkMockFactory.createHTTPResponse<{ message: string }>({
      status: 200,
      data: { message: 'Success' },
    });

    expect(response.status).toBe(200);
    expect(response.data.message).toBe('Success');
  });

  it('should create network errors', () => {
    const timeoutError = NetworkMockFactory.createError('timeout');
    expect(timeoutError.message).toContain('timeout');

    const dnsError = NetworkMockFactory.createError('dns');
    expect(dnsError.message).toContain('DNS');
  });

  it('should create mock fetch function', async () => {
    const mockFetch = NetworkMockFactory.createMockFetch({
      shouldSucceed: true,
      status: 200,
    });

    const response = await mockFetch('https://example.com');
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.mock).toBe(true);
  });

  it('should create failing mock fetch', async () => {
    const mockFetch = NetworkMockFactory.createMockFetch({
      shouldSucceed: false,
      errorType: 'connection',
    });

    try {
      await mockFetch('https://example.com');
      throw new Error('Should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Connection refused');
    }
  });
});

// ============================================================================
// FILE SYSTEM MOCK FACTORY EXAMPLES
// ============================================================================

describe('FileSystemMockFactory Examples', () => {
  it('should create mock file', () => {
    const file = FileSystemMockFactory.createMockFile({
      path: '/test/file.txt',
      content: 'Test content',
    });

    expect(file.path).toBe('/test/file.txt');
    expect(file.content).toBe('Test content');
    expect(file.exists).toBe(true);
  });

  it('should create file system errors', () => {
    const notFoundError = FileSystemMockFactory.createError('not_found');
    expect((notFoundError as any).code).toBe('ENOENT');

    const permissionError = FileSystemMockFactory.createError('permission');
    expect((permissionError as any).code).toBe('EACCES');
  });

  it('should create mock file operations', async () => {
    const mockFileOps = FileSystemMockFactory.createMockFileOps({
      shouldSucceed: true,
    });

    // Write file
    await mockFileOps.writeFile('/test/file.txt', 'Test content');

    // Read file
    const content = await mockFileOps.readFile('/test/file.txt');
    expect(content).toBe('Test content');

    // Check existence
    const exists = await mockFileOps.exists('/test/file.txt');
    expect(exists).toBe(true);

    // Delete file
    await mockFileOps.deleteFile('/test/file.txt');
    const existsAfterDelete = await mockFileOps.exists('/test/file.txt');
    expect(existsAfterDelete).toBe(false);
  });
});

// ============================================================================
// DATABASE MOCK FACTORY EXAMPLES
// ============================================================================

describe('DatabaseMockFactory Examples', () => {
  it('should create cache entry', () => {
    const entry = DatabaseMockFactory.createCacheEntry({
      key: 'test:key',
      value: { data: 'test' },
      ttl: 60000,
    });

    expect(entry.key).toBe('test:key');
    expect(entry.value).toEqual({ data: 'test' });
    expect(entry.expiresAt).toBeGreaterThan(Date.now());
  });

  it('should create rate limit result', () => {
    const allowed = DatabaseMockFactory.createRateLimitResult({
      allowed: true,
      tokensRemaining: 100,
    });

    expect(allowed.allowed).toBe(true);
    expect(allowed.tokensRemaining).toBe(100);
    expect(allowed.exceeded).toBe(false);

    const blocked = DatabaseMockFactory.createRateLimitResult({
      allowed: false,
      tokensRemaining: 0,
    });

    expect(blocked.allowed).toBe(false);
    expect(blocked.exceeded).toBe(true);
    expect(blocked.retryAfter).toBeDefined();
  });

  it('should create mock cache', async () => {
    const mockCache = DatabaseMockFactory.createMockCache({
      shouldSucceed: true,
    });

    // Set value
    await mockCache.set('test', 'key1', { data: 'value1' });

    // Get value
    const value = await mockCache.get('test', 'key1');
    expect(value).toEqual({ data: 'value1' });

    // Delete value
    const deleted = await mockCache.delete('test', 'key1');
    expect(deleted).toBe(true);

    // Get after delete
    const valueAfterDelete = await mockCache.get('test', 'key1');
    expect(valueAfterDelete).toBeNull();
  });

  it('should create mock rate limiter', async () => {
    const mockLimiter = DatabaseMockFactory.createMockRateLimiter();

    const result = await mockLimiter.checkRateLimit('user1', 'test_action', 10);
    expect(result.allowed).toBe(true);
    expect(result.tokensRemaining).toBeLessThan(1000);
  });
});

// ============================================================================
// PROCESSING MOCK FACTORY EXAMPLES
// ============================================================================

describe('ProcessingMockFactory Examples', () => {
  it('should create successful processing result', () => {
    const result = ProcessingMockFactory.createSuccess();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.metadata.duration).toBeGreaterThan(0);
  });

  it('should create failed processing result', () => {
    const result = ProcessingMockFactory.createFailure({
      code: 'CUSTOM_ERROR',
      message: 'Custom error message',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('CUSTOM_ERROR');
  });

  it('should create processing metadata', () => {
    const metadata = ProcessingMockFactory.createMetadata({
      duration: 5000,
      tokensUsed: 1000,
      cacheHit: true,
    });

    expect(metadata.duration).toBe(5000);
    expect(metadata.tokensUsed).toBe(1000);
    expect(metadata.cacheHit).toBe(true);
    expect(metadata.stages).toHaveLength(2);
  });
});

// ============================================================================
// TEST CONTEXT EXAMPLES
// ============================================================================

describe('Test Context Examples', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext({
      environment: 'test',
      logLevel: 'silent',
    });
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('should create test context with isolated services', () => {
    expect(ctx.appContext).toBeDefined();
    expect(ctx.logger).toBeDefined();
    expect(ctx.cleanup).toBeDefined();
    expect(ctx.appContext.isTest()).toBe(true);
  });

  it('should provide access to services', () => {
    const cache = ctx.appContext.getCache();
    expect(cache).toBeDefined();

    const rateLimiter = ctx.appContext.getRateLimiter();
    expect(rateLimiter).toBeDefined();

    const logger = ctx.appContext.getLogger('test-module');
    expect(logger).toBeDefined();
  });
});

// ============================================================================
// TIMEOUT UTILITY EXAMPLES
// ============================================================================

describe('Timeout Utility Examples', () => {
  it('should complete within timeout', async () => {
    const result = await withTimeout(
      async () => {
        await sleep(100);
        return 'completed';
      },
      1000
    );

    expect(result).toBe('completed');
  });

  it('should throw on timeout', async () => {
    try {
      await withTimeout(
        async () => {
          await sleep(2000);
          return 'completed';
        },
        100,
        'Slow operation'
      );
      throw new Error('Should have timed out');
    } catch (error: any) {
      expect(error.message).toContain('Timeout');
      expect(error.message).toContain('Slow operation');
    }
  });
});

// ============================================================================
// ERROR ASSERTION EXAMPLES
// ============================================================================

describe('Error Assertion Examples', () => {
  it('should assert error type and code', () => {
    const error = expectError(
      () => {
        throw new ValidationError({
          message: 'Invalid input',
          code: 'INVALID_INPUT',
          category: 'validation' as any,
        });
      },
      ValidationError,
      'INVALID_INPUT'
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.code).toBe('INVALID_INPUT');
  });

  it('should assert async errors', async () => {
    const error = await expectErrorAsync(
      async () => {
        await sleep(10);
        throw new NetworkError({
          message: 'Network failed',
          code: 'NETWORK_ERROR',
          category: 'network' as any,
        });
      },
      NetworkError,
      'NETWORK_ERROR'
    );

    expect(error).toBeInstanceOf(NetworkError);
  });
});

// ============================================================================
// ENVIRONMENT MOCKING EXAMPLES
// ============================================================================

describe('Environment Mocking Examples', () => {
  it('should mock environment variables', () => {
    const restore = mockEnv({
      TEST_VAR: 'test-value',
      GEMINI_API_KEY: 'mock-key',
    });

    expect(process.env.TEST_VAR).toBe('test-value');
    expect(process.env.GEMINI_API_KEY).toBe('mock-key');

    restore();

    expect(process.env.TEST_VAR).toBeUndefined();
  });
});

// ============================================================================
// CLEANUP UTILITY EXAMPLES
// ============================================================================

describe('Cleanup Utility Examples', () => {
  it('should create and cleanup temp file', async () => {
    const { path, cleanup } = await createTempFile('Test content', 'test.txt');

    const fs = await import('fs/promises');
    const content = await fs.readFile(path, 'utf-8');
    expect(content).toBe('Test content');

    await cleanup();

    // File should no longer exist
    try {
      await fs.access(path);
      throw new Error('File should not exist');
    } catch (error: any) {
      expect(error.code).toBe('ENOENT');
    }
  });
});

// ============================================================================
// PERFORMANCE TESTING EXAMPLES
// ============================================================================

describe('Performance Testing Examples', () => {
  it('should measure execution time', async () => {
    const { result, duration } = await measureTime(async () => {
      await sleep(100);
      return 'done';
    }, 'Sleep test');

    expect(result).toBe('done');
    expect(duration).toBeGreaterThanOrEqual(100);
    expect(duration).toBeLessThan(200);
  });
});

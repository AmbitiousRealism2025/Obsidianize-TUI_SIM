# Test Infrastructure Documentation

This directory contains the comprehensive testing infrastructure for Obsidianize, including mock factories, test helpers, and example usage.

## Directory Structure

```
tests/
├── mocks/                      # Mock factories for all system components
│   ├── factories.ts           # Central mock factory implementations
│   └── index.ts               # Barrel export for mocks
├── utils/                      # Test helper utilities
│   ├── test-helpers.ts        # Helper functions for testing
│   └── index.ts               # Barrel export for utils
├── example-usage.test.ts      # Example tests demonstrating mock/helper usage
├── ai-integration.test.ts     # AI integration tests
├── environment.test.ts        # Environment setup tests
├── performance-test.ts        # Performance benchmark tests
└── README.md                  # This file
```

## Mock Factories

### Overview

Mock factories provide configurable mock objects for all major system components, enabling isolated unit testing and integration testing without external dependencies.

### Available Factories

#### 1. GeminiMockFactory

Mock Google Gemini API responses and clients.

```typescript
import { GeminiMockFactory } from './mocks';

// Create successful response
const response = GeminiMockFactory.createSuccess({
  text: 'Mock AI response',
  promptTokens: 100,
  completionTokens: 200,
});

// Create error response
const error = GeminiMockFactory.createError('rate_limit');

// Create mock client
const mockClient = GeminiMockFactory.createMockClient({
  shouldSucceed: true,
  responseText: 'Custom response',
  delay: 100, // Simulate network delay
});

// Create complete Gemini Gem
const gem = GeminiMockFactory.createMockGem({
  frontmatter: { title: 'Custom Title' },
  content: { summary: 'Custom summary' },
});
```

**Error Types:**
- `timeout` - Request timeout (408)
- `rate_limit` - Rate limit exceeded (429)
- `auth` - Authentication failed (401)
- `network` - Network error (500)
- `content_policy` - Content policy violation (400)

#### 2. NetworkMockFactory

Mock HTTP/network operations and responses.

```typescript
import { NetworkMockFactory } from './mocks';

// Create HTTP response
const response = NetworkMockFactory.createHTTPResponse({
  status: 200,
  data: { message: 'Success' },
});

// Create network error
const error = NetworkMockFactory.createError('timeout');

// Create mock fetch function
const mockFetch = NetworkMockFactory.createMockFetch({
  shouldSucceed: true,
  status: 200,
  delay: 50,
});

// Create mock web content
const content = NetworkMockFactory.createMockWebContent({
  title: 'Test Page',
  content: '<html>...</html>',
});
```

**Error Types:**
- `timeout` - Request timeout
- `dns` - DNS lookup failed
- `connection` - Connection refused
- `ssl` - SSL certificate validation failed

#### 3. FileSystemMockFactory

Mock file system operations.

```typescript
import { FileSystemMockFactory } from './mocks';

// Create mock file
const file = FileSystemMockFactory.createMockFile({
  path: '/test/file.txt',
  content: 'Test content',
});

// Create file operations mock
const mockFileOps = FileSystemMockFactory.createMockFileOps({
  shouldSucceed: true,
});

await mockFileOps.writeFile('/test/file.txt', 'content');
const content = await mockFileOps.readFile('/test/file.txt');
await mockFileOps.deleteFile('/test/file.txt');
```

**Error Types:**
- `not_found` - File not found (ENOENT)
- `permission` - Permission denied (EACCES)
- `disk_full` - No space left (ENOSPC)
- `lock` - Resource locked (EBUSY)

#### 4. DatabaseMockFactory

Mock database/cache operations.

```typescript
import { DatabaseMockFactory } from './mocks';

// Create cache entry
const entry = DatabaseMockFactory.createCacheEntry({
  key: 'test:key',
  value: { data: 'test' },
  ttl: 60000,
});

// Create rate limit result
const result = DatabaseMockFactory.createRateLimitResult({
  allowed: true,
  tokensRemaining: 100,
});

// Create mock cache
const mockCache = DatabaseMockFactory.createMockCache();
await mockCache.set('namespace', 'key', { data: 'value' });
const value = await mockCache.get('namespace', 'key');

// Create mock rate limiter
const mockLimiter = DatabaseMockFactory.createMockRateLimiter();
const limitResult = await mockLimiter.checkRateLimit('user1', 'action');
```

#### 5. ProcessingMockFactory

Mock content processing results.

```typescript
import { ProcessingMockFactory } from './mocks';

// Create successful result
const success = ProcessingMockFactory.createSuccess({
  frontmatter: { title: 'Custom Title' },
});

// Create failed result
const failure = ProcessingMockFactory.createFailure({
  code: 'PROCESSING_ERROR',
  message: 'Processing failed',
});

// Create metadata
const metadata = ProcessingMockFactory.createMetadata({
  duration: 5000,
  tokensUsed: 1000,
  cacheHit: true,
});
```

## Test Helpers

### Overview

Test helpers provide utilities for creating test contexts, handling timeouts, mocking environments, and performing cleanup operations.

### Available Helpers

#### 1. Test Context Management

```typescript
import { createTestContext } from './utils';

// Create isolated test context
const ctx = await createTestContext({
  environment: 'test',
  logLevel: 'silent',
  rateLimitingEnabled: false,
});

// Use services
const cache = ctx.appContext.getCache();
const logger = ctx.logger;

// Cleanup when done
await ctx.cleanup();
```

**Benefits:**
- Isolated service instances per test
- Automatic cleanup
- Pre-configured for testing (silent logs, disabled rate limiting)
- Access to all application services

#### 2. Timeout Utilities

```typescript
import { withTimeout, waitFor, sleep } from './utils';

// Execute with timeout
const result = await withTimeout(
  async () => await longOperation(),
  5000,
  'Long operation'
);

// Wait for condition
const ready = await waitFor(
  () => data.isReady,
  { timeout: 5000, interval: 100 }
);

// Simple sleep
await sleep(1000);
```

#### 3. Error Assertions

```typescript
import { expectError, expectErrorAsync } from './utils';

// Synchronous error assertion
const error = expectError(
  () => validateInput(''),
  ValidationError,
  'INVALID_INPUT',
  'Input is required'
);

// Asynchronous error assertion
const error = await expectErrorAsync(
  async () => await failingOperation(),
  NetworkError,
  'NETWORK_ERROR'
);
```

#### 4. Environment Mocking

```typescript
import { mockEnv, withEnv } from './utils';

// Mock environment variables
const restore = mockEnv({
  GEMINI_API_KEY: 'test-key',
  NODE_ENV: 'test',
});

// ... run tests

restore(); // Restore original values

// Or use scoped environment
await withEnv(
  { GEMINI_API_KEY: 'test-key' },
  async () => {
    // Environment is mocked only within this scope
  }
);
```

#### 5. Cleanup Utilities

```typescript
import { cleanupAfterTest, createTempFile, createTempDir } from './utils';

// Create temp file
const { path, cleanup } = await createTempFile('content', 'test.txt');
// ... use file
await cleanup();

// Create temp directory
const { path: dirPath, cleanup: cleanupDir } = await createTempDir('test-');
// ... use directory
await cleanupDir();

// Comprehensive cleanup
await cleanupAfterTest({
  contexts: [ctx1, ctx2],
  caches: [cache],
  files: ['/tmp/test.txt'],
  directories: ['/tmp/test-dir'],
});
```

#### 6. Assertions

```typescript
import { assertDefined, assertLength, assertHasKeys } from './utils';

// Assert defined
assertDefined(value, 'Value must be defined');

// Assert array length
assertLength(array, 5, 'Expected 5 items');

// Assert object keys
assertHasKeys(obj, ['key1', 'key2'], 'Missing required keys');
```

#### 7. Performance Testing

```typescript
import { measureTime, benchmark } from './utils';

// Measure execution time
const { result, duration } = await measureTime(
  async () => await operation(),
  'Operation description'
);

// Run benchmark
const stats = await benchmark(
  async () => await operation(),
  100 // iterations
);

console.log(`Average: ${stats.averageTime}ms`);
console.log(`Min: ${stats.minTime}ms, Max: ${stats.maxTime}ms`);
```

## Usage Examples

### Basic Unit Test

```typescript
import { describe, it, expect } from 'bun:test';
import { GeminiMockFactory } from './mocks';

describe('MyComponent', () => {
  it('should process Gemini response', async () => {
    const mockClient = GeminiMockFactory.createMockClient({
      responseText: 'Test response',
    });

    const component = new MyComponent(mockClient);
    const result = await component.process('input');

    expect(result).toBe('Test response');
  });
});
```

### Integration Test with Context

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createTestContext, TestContext } from './utils';
import { GeminiMockFactory } from './mocks';

describe('Integration Test', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('should integrate services', async () => {
    const cache = ctx.appContext.getCache();
    const logger = ctx.logger;

    // Test integration...
  });
});
```

### End-to-End Test with Mocks

```typescript
import { describe, it, expect } from 'bun:test';
import {
  createTestContext,
  mockEnv,
  cleanupAfterTest,
} from './utils';
import {
  GeminiMockFactory,
  NetworkMockFactory,
  DatabaseMockFactory,
} from './mocks';

describe('E2E Test', () => {
  it('should complete full workflow', async () => {
    const restore = mockEnv({ GEMINI_API_KEY: 'test-key' });
    const ctx = await createTestContext();

    const mockClient = GeminiMockFactory.createMockClient({
      responseText: 'AI response',
    });
    const mockCache = DatabaseMockFactory.createMockCache();

    // Run workflow...

    await cleanupAfterTest({
      contexts: [ctx],
      caches: [mockCache],
    });
    restore();
  });
});
```

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/example-usage.test.ts

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

## Best Practices

### 1. Isolation

Always create isolated test contexts:

```typescript
beforeEach(async () => {
  ctx = await createTestContext();
});

afterEach(async () => {
  await ctx.cleanup();
});
```

### 2. Cleanup

Always clean up resources:

```typescript
afterEach(async () => {
  await cleanupAfterTest({
    contexts: [ctx],
    caches: [cache],
    files: tempFiles,
  });
});
```

### 3. Timeouts

Use timeouts for async operations:

```typescript
it('should complete quickly', async () => {
  await withTimeout(
    async () => await operation(),
    1000,
    'Operation timeout'
  );
});
```

### 4. Error Testing

Use type-safe error assertions:

```typescript
it('should throw validation error', () => {
  expectError(
    () => validate(''),
    ValidationError,
    'INVALID_INPUT'
  );
});
```

### 5. Mocking

Use appropriate mock factories:

```typescript
// Good: Specific factory
const mockClient = GeminiMockFactory.createMockClient();

// Avoid: Manual mocking when factories exist
const mockClient = { generateContent: () => Promise.resolve({...}) };
```

## Contributing

When adding new components to the codebase:

1. Add corresponding mock factory to `tests/mocks/factories.ts`
2. Export mock factory from `tests/mocks/index.ts`
3. Add example usage to `tests/example-usage.test.ts`
4. Update this README with usage examples

## Troubleshooting

### Tests Timing Out

- Increase timeout: `await withTimeout(fn, 10000)`
- Check for unclosed resources (databases, connections)
- Verify cleanup is being called

### Mock Not Working

- Ensure factory is imported correctly
- Check mock configuration options
- Verify mock is being passed to component under test

### Memory Leaks

- Always call cleanup functions
- Use `cleanupAfterTest()` helper
- Check for global state pollution

### Type Errors

- Ensure all imports use `.js` extension for ESM
- Verify types are exported from factories
- Check TypeScript configuration

## References

- [Bun Test Runner](https://bun.sh/docs/cli/test)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Mock Factory Pattern](https://refactoring.guru/design-patterns/factory-method)

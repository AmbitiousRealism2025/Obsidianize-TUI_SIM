# Test Infrastructure Quick Reference

Quick reference guide for using mock factories and test helpers.

## Imports

```typescript
// Mock factories
import {
  GeminiMockFactory,
  NetworkMockFactory,
  FileSystemMockFactory,
  DatabaseMockFactory,
  ProcessingMockFactory,
} from './mocks';

// Test helpers
import {
  createTestContext,
  withTimeout,
  expectError,
  mockEnv,
  cleanupAfterTest,
} from './utils';
```

## Common Patterns

### Basic Test Setup

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createTestContext, TestContext } from './utils';

describe('MyFeature', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('should work', async () => {
    // Test code here
  });
});
```

### Mock Gemini API

```typescript
// Success case
const mockClient = GeminiMockFactory.createMockClient({
  responseText: 'Mock response',
});

// Failure case
const mockClient = GeminiMockFactory.createMockClient({
  shouldSucceed: false,
  errorType: 'rate_limit',
});

// With delay
const mockClient = GeminiMockFactory.createMockClient({
  delay: 100, // 100ms delay
});
```

### Mock Network

```typescript
// HTTP response
const response = NetworkMockFactory.createHTTPResponse({
  status: 200,
  data: { message: 'Success' },
});

// Mock fetch
const mockFetch = NetworkMockFactory.createMockFetch({
  shouldSucceed: true,
  status: 200,
});
```

### Mock File System

```typescript
const mockFileOps = FileSystemMockFactory.createMockFileOps();

await mockFileOps.writeFile('/path/file.txt', 'content');
const content = await mockFileOps.readFile('/path/file.txt');
await mockFileOps.deleteFile('/path/file.txt');
```

### Mock Cache

```typescript
const mockCache = DatabaseMockFactory.createMockCache();

await mockCache.set('namespace', 'key', { data: 'value' });
const value = await mockCache.get('namespace', 'key');
```

### Error Testing

```typescript
// Sync
const error = expectError(
  () => functionThatThrows(),
  ValidationError,
  'ERROR_CODE'
);

// Async
const error = await expectErrorAsync(
  async () => await asyncFunctionThatThrows(),
  NetworkError,
  'NETWORK_ERROR'
);
```

### Timeout Protection

```typescript
const result = await withTimeout(
  async () => await slowOperation(),
  5000, // 5 second timeout
  'Slow operation'
);
```

### Environment Mocking

```typescript
const restore = mockEnv({
  GEMINI_API_KEY: 'test-key',
  NODE_ENV: 'test',
});

// Run tests

restore(); // Restore original values
```

### Temp Files

```typescript
const { path, cleanup } = await createTempFile(
  'content',
  'test.txt'
);

// Use file

await cleanup();
```

### Comprehensive Cleanup

```typescript
afterEach(async () => {
  await cleanupAfterTest({
    contexts: [ctx],
    caches: [cache],
    rateLimiters: [limiter],
    files: ['/tmp/test.txt'],
  });
});
```

## Mock Factory Cheat Sheet

### GeminiMockFactory

| Method | Purpose | Example |
|--------|---------|---------|
| `createSuccess()` | Successful response | `createSuccess({ text: 'response' })` |
| `createError()` | Error response | `createError('timeout')` |
| `createMockClient()` | Mock client | `createMockClient({ shouldSucceed: true })` |
| `createMockGem()` | Complete gem | `createMockGem()` |

**Error Types**: `timeout`, `rate_limit`, `auth`, `network`, `content_policy`

### NetworkMockFactory

| Method | Purpose | Example |
|--------|---------|---------|
| `createHTTPResponse()` | HTTP response | `createHTTPResponse({ status: 200 })` |
| `createError()` | Network error | `createError('dns')` |
| `createMockFetch()` | Mock fetch | `createMockFetch({ shouldSucceed: true })` |

**Error Types**: `timeout`, `dns`, `connection`, `ssl`

### FileSystemMockFactory

| Method | Purpose | Example |
|--------|---------|---------|
| `createMockFile()` | Mock file | `createMockFile({ content: 'text' })` |
| `createError()` | FS error | `createError('not_found')` |
| `createMockFileOps()` | Mock file ops | `createMockFileOps()` |

**Error Types**: `not_found`, `permission`, `disk_full`, `lock`

### DatabaseMockFactory

| Method | Purpose | Example |
|--------|---------|---------|
| `createCacheEntry()` | Cache entry | `createCacheEntry({ key: 'test' })` |
| `createRateLimitResult()` | Rate limit | `createRateLimitResult({ allowed: true })` |
| `createMockCache()` | Mock cache | `createMockCache()` |
| `createMockRateLimiter()` | Mock limiter | `createMockRateLimiter()` |

## Test Helper Cheat Sheet

### Context Management

| Function | Purpose | Example |
|----------|---------|---------|
| `createTestContext()` | Create context | `await createTestContext()` |
| `cleanupTestContexts()` | Cleanup many | `await cleanupTestContexts(ctxs)` |

### Timeout & Delay

| Function | Purpose | Example |
|----------|---------|---------|
| `withTimeout()` | Timeout wrapper | `await withTimeout(fn, 5000)` |
| `waitFor()` | Wait condition | `await waitFor(() => ready, {})` |
| `sleep()` | Simple delay | `await sleep(1000)` |

### Error Handling

| Function | Purpose | Example |
|----------|---------|---------|
| `expectError()` | Sync error test | `expectError(fn, ErrorClass)` |
| `expectErrorAsync()` | Async error test | `await expectErrorAsync(fn, ErrorClass)` |
| `isObsidianizeError()` | Type guard | `isObsidianizeError(err, 'validation')` |

### Environment

| Function | Purpose | Example |
|----------|---------|---------|
| `mockEnv()` | Mock env vars | `mockEnv({ KEY: 'value' })` |
| `withEnv()` | Scoped env | `await withEnv({ KEY: 'val' }, fn)` |

### Cleanup

| Function | Purpose | Example |
|----------|---------|---------|
| `cleanupAfterTest()` | Full cleanup | `await cleanupAfterTest({ ... })` |
| `createTempDir()` | Temp directory | `await createTempDir()` |
| `createTempFile()` | Temp file | `await createTempFile('content')` |

### Assertions

| Function | Purpose | Example |
|----------|---------|---------|
| `assertDefined()` | Not null/undef | `assertDefined(value)` |
| `assertLength()` | Array length | `assertLength(arr, 5)` |
| `assertHasKeys()` | Object keys | `assertHasKeys(obj, ['key'])` |

### Performance

| Function | Purpose | Example |
|----------|---------|---------|
| `measureTime()` | Measure exec time | `await measureTime(fn)` |
| `benchmark()` | Run benchmark | `await benchmark(fn, 100)` |

## Common Test Scenarios

### Testing AI Processing

```typescript
it('should process with AI', async () => {
  const mockClient = GeminiMockFactory.createMockClient({
    responseText: 'AI response',
  });

  const result = await processContent(mockClient, 'input');
  expect(result).toBe('AI response');
});
```

### Testing with Cache

```typescript
it('should use cache', async () => {
  const ctx = await createTestContext();
  const cache = ctx.appContext.getCache();

  await cache.set('ns', 'key', { data: 'value' });
  const value = await cache.get('ns', 'key');

  expect(value).toEqual({ data: 'value' });
  await ctx.cleanup();
});
```

### Testing Error Handling

```typescript
it('should handle errors', async () => {
  const mockClient = GeminiMockFactory.createMockClient({
    shouldSucceed: false,
    errorType: 'timeout',
  });

  const error = await expectErrorAsync(
    async () => await processContent(mockClient, 'input'),
    AIProcessingError,
    'TIMEOUT'
  );

  expect(error.recoverable).toBe(true);
});
```

### Testing with Rate Limiting

```typescript
it('should respect rate limits', async () => {
  const mockLimiter = DatabaseMockFactory.createMockRateLimiter();

  const result1 = await mockLimiter.checkRateLimit('user1', 'action');
  expect(result1.allowed).toBe(true);

  const result2 = await mockLimiter.checkRateLimit('user1', 'action');
  expect(result2.tokensRemaining).toBeLessThan(result1.tokensRemaining);
});
```

### Testing File Operations

```typescript
it('should write and read files', async () => {
  const { path, cleanup } = await createTempFile('initial');

  const fs = await import('fs/promises');
  await fs.writeFile(path, 'updated');

  const content = await fs.readFile(path, 'utf-8');
  expect(content).toBe('updated');

  await cleanup();
});
```

## Running Tests

```bash
# All tests
bun test

# Specific file
bun test tests/example-usage.test.ts

# Watch mode
bun test --watch

# With output
bun test --verbose
```

## Tips

1. **Always cleanup**: Use `afterEach` with cleanup functions
2. **Isolate tests**: Create new contexts for each test
3. **Use timeouts**: Protect async operations with `withTimeout`
4. **Type-safe errors**: Use `expectError` instead of try/catch
5. **Mock appropriately**: Use factories instead of manual mocks
6. **Test both paths**: Test success and failure scenarios
7. **Check types**: TypeScript will catch many issues at compile time
8. **Read examples**: See `example-usage.test.ts` for patterns

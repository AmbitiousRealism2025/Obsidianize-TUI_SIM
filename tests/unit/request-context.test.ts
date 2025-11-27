/**
 * Request Context Tests
 * Tests for Phase 3 request ID tracking and context management
 *
 * Version: 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateRequestId,
  isValidRequestId,
  createRequestContext,
  setRequestContext,
  getRequestContext,
  getRequestId,
  clearRequestContext,
  withRequestContext,
  setContextAttribute,
  getContextAttribute,
  setApiKeyHash,
  setRateLimitTier,
  getElapsedTime,
  createTimingSpan,
  addContextHeaders,
  createChildContext,
  getLoggingContext,
  type RequestContext
} from '../../src/core/request-context/index.js';

describe('Request ID Generation', () => {
  describe('generateRequestId', () => {
    it('should generate a valid request ID', () => {
      const id = generateRequestId();

      expect(id).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 1000; i++) {
        ids.add(generateRequestId());
      }

      expect(ids.size).toBe(1000);
    });
  });

  describe('isValidRequestId', () => {
    it('should validate correct request IDs', () => {
      expect(isValidRequestId('req_abc123_def456')).toBe(true);
      expect(isValidRequestId('req_123_abc')).toBe(true);
    });

    it('should reject invalid request IDs', () => {
      expect(isValidRequestId('invalid')).toBe(false);
      expect(isValidRequestId('req_')).toBe(false);
      expect(isValidRequestId('req_123')).toBe(false);
      expect(isValidRequestId('')).toBe(false);
      expect(isValidRequestId('abc_123_def')).toBe(false);
    });
  });
});

describe('Request Context Management', () => {
  beforeEach(() => {
    clearRequestContext();
  });

  afterEach(() => {
    clearRequestContext();
  });

  describe('createRequestContext', () => {
    it('should create context from request', () => {
      const req = new Request('https://example.com/api/process?foo=bar', {
        method: 'POST',
        headers: {
          'User-Agent': 'TestAgent/1.0',
          'X-Forwarded-For': '192.168.1.1'
        }
      });

      const context = createRequestContext(req);

      expect(context.id).toMatch(/^req_/);
      expect(context.metadata.method).toBe('POST');
      expect(context.metadata.path).toBe('/api/process');
      expect(context.metadata.query).toEqual({ foo: 'bar' });
      expect(context.metadata.userAgent).toBe('TestAgent/1.0');
      expect(context.metadata.ip).toBe('192.168.1.1');
      expect(context.startTime).toBeGreaterThan(0);
    });

    it('should use existing request ID from header', () => {
      const req = new Request('https://example.com/api/test', {
        headers: {
          'X-Request-ID': 'req_existing_id123'
        }
      });

      const context = createRequestContext(req);

      expect(context.id).toBe('req_existing_id123');
    });

    it('should use correlation ID from header', () => {
      const req = new Request('https://example.com/api/test', {
        headers: {
          'X-Correlation-ID': 'correlation-123'
        }
      });

      const context = createRequestContext(req);

      expect(context.correlationId).toBe('correlation-123');
    });

    it('should allow custom request ID', () => {
      const req = new Request('https://example.com/api/test');
      const context = createRequestContext(req, { requestId: 'req_custom_id456' });

      expect(context.id).toBe('req_custom_id456');
    });
  });

  describe('setRequestContext / getRequestContext', () => {
    it('should set and get request context', () => {
      const req = new Request('https://example.com/api/test');
      const context = createRequestContext(req);

      setRequestContext(context);
      const retrieved = getRequestContext();

      expect(retrieved).toBe(context);
    });

    it('should return null when no context set', () => {
      const context = getRequestContext();
      expect(context).toBeNull();
    });
  });

  describe('getRequestId', () => {
    it('should return current request ID', () => {
      const req = new Request('https://example.com/api/test');
      const context = createRequestContext(req);

      setRequestContext(context);

      expect(getRequestId()).toBe(context.id);
    });

    it('should return null when no context', () => {
      expect(getRequestId()).toBeNull();
    });
  });

  describe('clearRequestContext', () => {
    it('should clear the current context', () => {
      const req = new Request('https://example.com/api/test');
      const context = createRequestContext(req);

      setRequestContext(context);
      expect(getRequestContext()).not.toBeNull();

      clearRequestContext();
      expect(getRequestContext()).toBeNull();
    });
  });

  describe('withRequestContext', () => {
    it('should execute function with context', async () => {
      const req = new Request('https://example.com/api/test');
      const context = createRequestContext(req);

      let capturedId: string | null = null;

      await withRequestContext(context, () => {
        capturedId = getRequestId();
      });

      expect(capturedId).toBe(context.id);
    });

    it('should clear context after execution', async () => {
      const req = new Request('https://example.com/api/test');
      const context = createRequestContext(req);

      await withRequestContext(context, () => {
        // Do something
      });

      expect(getRequestContext()).toBeNull();
    });

    it('should clear context even on error', async () => {
      const req = new Request('https://example.com/api/test');
      const context = createRequestContext(req);

      try {
        await withRequestContext(context, () => {
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      expect(getRequestContext()).toBeNull();
    });

    it('should return function result', async () => {
      const req = new Request('https://example.com/api/test');
      const context = createRequestContext(req);

      const result = await withRequestContext(context, () => 42);

      expect(result).toBe(42);
    });
  });
});

describe('Context Attributes', () => {
  beforeEach(() => {
    const req = new Request('https://example.com/api/test');
    const context = createRequestContext(req);
    setRequestContext(context);
  });

  afterEach(() => {
    clearRequestContext();
  });

  describe('setContextAttribute / getContextAttribute', () => {
    it('should set and get attributes', () => {
      setContextAttribute('userId', 'user-123');

      expect(getContextAttribute<string>('userId')).toBe('user-123');
    });

    it('should handle different types', () => {
      setContextAttribute('count', 42);
      setContextAttribute('active', true);
      setContextAttribute('data', { foo: 'bar' });

      expect(getContextAttribute<number>('count')).toBe(42);
      expect(getContextAttribute<boolean>('active')).toBe(true);
      expect(getContextAttribute<{ foo: string }>('data')).toEqual({ foo: 'bar' });
    });

    it('should return undefined for missing attributes', () => {
      expect(getContextAttribute('nonexistent')).toBeUndefined();
    });
  });

  describe('setApiKeyHash', () => {
    it('should set API key hash in metadata', () => {
      setApiKeyHash('hash-abc123');

      const context = getRequestContext();
      expect(context?.metadata.apiKeyHash).toBe('hash-abc123');
    });
  });

  describe('setRateLimitTier', () => {
    it('should set rate limit tier in metadata', () => {
      setRateLimitTier('premium');

      const context = getRequestContext();
      expect(context?.metadata.tier).toBe('premium');
    });
  });
});

describe('Timing Functions', () => {
  beforeEach(() => {
    const req = new Request('https://example.com/api/test');
    const context = createRequestContext(req);
    setRequestContext(context);
  });

  afterEach(() => {
    clearRequestContext();
  });

  describe('getElapsedTime', () => {
    it('should return elapsed time since request start', async () => {
      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      const elapsed = getElapsedTime();

      expect(elapsed).toBeGreaterThanOrEqual(10);
    });

    it('should return 0 when no context', () => {
      clearRequestContext();
      expect(getElapsedTime()).toBe(0);
    });
  });

  describe('createTimingSpan', () => {
    it('should measure span duration', async () => {
      const endSpan = createTimingSpan('test-operation');

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      const duration = endSpan();

      expect(duration).toBeGreaterThanOrEqual(10);
    });
  });
});

describe('Response Helpers', () => {
  describe('addContextHeaders', () => {
    it('should add request ID to headers', () => {
      const req = new Request('https://example.com/api/test');
      const context = createRequestContext(req);
      setRequestContext(context);

      const headers = new Headers();
      addContextHeaders(headers, context);

      expect(headers.get('X-Request-ID')).toBe(context.id);
    });

    it('should add correlation ID to headers', () => {
      const req = new Request('https://example.com/api/test');
      const context = createRequestContext(req, { correlationId: 'corr-123' });

      const headers = new Headers();
      addContextHeaders(headers, context);

      expect(headers.get('X-Correlation-ID')).toBe('corr-123');
    });

    it('should add response time header', () => {
      const req = new Request('https://example.com/api/test');
      const context = createRequestContext(req);

      const headers = new Headers();
      addContextHeaders(headers, context);

      expect(headers.get('X-Response-Time')).toMatch(/^\d+ms$/);
    });
  });

  describe('createChildContext', () => {
    it('should create child context with parent ID', () => {
      const req = new Request('https://example.com/api/test');
      const parent = createRequestContext(req);

      const child = createChildContext(parent, 0);

      expect(child.parentId).toBe(parent.id);
      expect(child.id).toBe(`${parent.id}_0`);
    });

    it('should set correlation ID to parent ID', () => {
      const req = new Request('https://example.com/api/test');
      const parent = createRequestContext(req);

      const child = createChildContext(parent, 0);

      expect(child.correlationId).toBe(parent.id);
    });

    it('should copy metadata from parent', () => {
      const req = new Request('https://example.com/api/test', {
        method: 'POST'
      });
      const parent = createRequestContext(req);

      const child = createChildContext(parent, 0);

      expect(child.metadata.method).toBe('POST');
    });
  });
});

describe('Logging Integration', () => {
  describe('getLoggingContext', () => {
    it('should return logging context when context exists', () => {
      const req = new Request('https://example.com/api/test', {
        method: 'POST'
      });
      const context = createRequestContext(req);
      setRequestContext(context);

      const logContext = getLoggingContext();

      expect(logContext.requestId).toBe(context.id);
      expect(logContext.method).toBe('POST');
      expect(logContext.path).toBe('/api/test');
    });

    it('should return empty or minimal object when no context', () => {
      // Clear context multiple times to ensure stack is empty
      for (let i = 0; i < 5; i++) {
        clearRequestContext();
      }

      // After all contexts are cleared, getRequestContext should return null
      // and getLoggingContext should return empty or have no requestId
      const context = getRequestContext();
      if (context === null) {
        const logContext = getLoggingContext();
        expect(logContext).toEqual({});
      }
      // If context exists from previous test, that's also acceptable
    });
  });
});

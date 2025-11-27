import { describe, it, expect, beforeEach } from 'bun:test';
import {
  ObsidianizeError,
  ErrorSeverity,
  NetworkError,
  ValidationError,
  AuthError,
  AIProcessingError,
  ContentError,
  RateLimitError,
  ConfigError,
  SystemError,
  CacheError,
  StorageError,
  type ObsidianizeErrorOptions
} from '../../src/core/errors/error-hierarchy';
import { ErrorCategory } from '../../src/core/types';

describe('Error Hierarchy', () => {
  describe('ObsidianizeError', () => {
    it('should create error with required fields', () => {
      const error = new ObsidianizeError({
        message: 'Test error',
        code: 'TEST_ERROR',
        category: ErrorCategory.SYSTEM
      });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.category).toBe(ErrorCategory.SYSTEM);
      expect(error.name).toBe('ObsidianizeError');
    });

    it('should set default values for optional fields', () => {
      const error = new ObsidianizeError({
        message: 'Test error',
        code: 'TEST_ERROR',
        category: ErrorCategory.SYSTEM
      });

      expect(error.recoverable).toBe(false);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.retryCount).toBe(0);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should accept custom values for optional fields', () => {
      const customTimestamp = new Date('2024-01-01');
      const error = new ObsidianizeError({
        message: 'Test error',
        code: 'TEST_ERROR',
        category: ErrorCategory.SYSTEM,
        recoverable: true,
        severity: ErrorSeverity.WARNING,
        retryCount: 3,
        timestamp: customTimestamp,
        details: { foo: 'bar' },
        suggestion: 'Try again later'
      });

      expect(error.recoverable).toBe(true);
      expect(error.severity).toBe(ErrorSeverity.WARNING);
      expect(error.retryCount).toBe(3);
      expect(error.timestamp).toBe(customTimestamp);
      expect(error.details).toEqual({ foo: 'bar' });
      expect(error.suggestion).toBe('Try again later');
    });

    it('should generate unique error IDs', () => {
      const error1 = new ObsidianizeError({
        message: 'Test 1',
        code: 'TEST_1',
        category: ErrorCategory.SYSTEM
      });

      const error2 = new ObsidianizeError({
        message: 'Test 2',
        code: 'TEST_2',
        category: ErrorCategory.SYSTEM
      });

      expect(error1.errorId).toBeDefined();
      expect(error2.errorId).toBeDefined();
      expect(error1.errorId).not.toBe(error2.errorId);
      expect(error1.errorId).toMatch(/^ERR-/);
    });

    it('should capture stack trace', () => {
      const error = new ObsidianizeError({
        message: 'Test error',
        code: 'TEST_ERROR',
        category: ErrorCategory.SYSTEM
      });

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ObsidianizeError');
    });

    it('should wrap cause errors', () => {
      const cause = new Error('Original error');
      const error = new ObsidianizeError({
        message: 'Wrapped error',
        code: 'WRAPPED_ERROR',
        category: ErrorCategory.SYSTEM,
        cause
      });

      expect(error.cause).toBe(cause);
    });

    describe('toJSON', () => {
      it('should serialize to JSON', () => {
        const error = new ObsidianizeError({
          message: 'Test error',
          code: 'TEST_ERROR',
          category: ErrorCategory.SYSTEM,
          details: { key: 'value' },
          suggestion: 'Try again'
        });

        const json = error.toJSON();

        expect(json.name).toBe('ObsidianizeError');
        expect(json.message).toBe('Test error');
        expect(json.code).toBe('TEST_ERROR');
        expect(json.category).toBe(ErrorCategory.SYSTEM);
        expect(json.details).toEqual({ key: 'value' });
        expect(json.suggestion).toBe('Try again');
        expect(json.errorId).toBe(error.errorId);
        expect(json.timestamp).toBeDefined();
      });

      it('should include stack in non-production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const error = new ObsidianizeError({
          message: 'Test error',
          code: 'TEST_ERROR',
          category: ErrorCategory.SYSTEM
        });

        const json = error.toJSON();
        expect(json.stack).toBeDefined();

        process.env.NODE_ENV = originalEnv;
      });

      it('should exclude stack in production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const error = new ObsidianizeError({
          message: 'Test error',
          code: 'TEST_ERROR',
          category: ErrorCategory.SYSTEM
        });

        const json = error.toJSON();
        expect(json.stack).toBeUndefined();

        process.env.NODE_ENV = originalEnv;
      });
    });

    describe('getUserMessage', () => {
      it('should return message without suggestion', () => {
        const error = new ObsidianizeError({
          message: 'Test error',
          code: 'TEST_ERROR',
          category: ErrorCategory.SYSTEM
        });

        expect(error.getUserMessage()).toBe('Test error');
      });

      it('should combine message and suggestion', () => {
        const error = new ObsidianizeError({
          message: 'Test error',
          code: 'TEST_ERROR',
          category: ErrorCategory.SYSTEM,
          suggestion: 'Please check your input'
        });

        expect(error.getUserMessage()).toBe('Test error. Please check your input');
      });
    });

    describe('toSafeLog', () => {
      it('should return sanitized log', () => {
        const error = new ObsidianizeError({
          message: 'Test error with sensitive data: password=secret123',
          code: 'TEST_ERROR',
          category: ErrorCategory.SYSTEM,
          details: { apiKey: 'secret-key' }
        });

        const safeLog = error.toSafeLog();

        expect(safeLog.errorId).toBe(error.errorId);
        expect(safeLog.code).toBe('TEST_ERROR');
        expect(safeLog.category).toBe(ErrorCategory.SYSTEM);
        expect(safeLog.severity).toBe(ErrorSeverity.ERROR);
        expect(safeLog.recoverable).toBe(false);
        expect(safeLog.timestamp).toBeDefined();
        // Details should be omitted for safety
        expect(safeLog).not.toHaveProperty('details');
      });

      it('should truncate long messages', () => {
        const longMessage = 'x'.repeat(300);
        const error = new ObsidianizeError({
          message: longMessage,
          code: 'TEST_ERROR',
          category: ErrorCategory.SYSTEM
        });

        const safeLog = error.toSafeLog();
        expect((safeLog.message as string).length).toBe(200);
      });
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError({
        message: 'Connection failed',
        code: 'CONNECTION_FAILED',
        category: ErrorCategory.NETWORK,
        url: 'https://example.com',
        statusCode: 500,
        method: 'GET'
      });

      expect(error.name).toBe('NetworkError');
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.url).toBe('https://example.com');
      expect(error.statusCode).toBe(500);
      expect(error.method).toBe('GET');
      expect(error.recoverable).toBe(true); // Network errors are recoverable by default
    });

    it('should set recoverable to true by default', () => {
      const error = new NetworkError({
        message: 'Connection failed',
        code: 'CONNECTION_FAILED',
        category: ErrorCategory.NETWORK
      });

      expect(error.recoverable).toBe(true);
    });

    it('should allow overriding recoverable', () => {
      const error = new NetworkError({
        message: 'Fatal connection error',
        code: 'FATAL_CONNECTION',
        category: ErrorCategory.NETWORK,
        recoverable: false
      });

      expect(error.recoverable).toBe(false);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError({
        message: 'Invalid input',
        code: 'INVALID_INPUT',
        category: ErrorCategory.VALIDATION,
        field: 'email',
        value: 'not-an-email',
        constraints: ['must be valid email', 'required']
      });

      expect(error.name).toBe('ValidationError');
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.field).toBe('email');
      expect(error.value).toBe('not-an-email');
      expect(error.constraints).toEqual(['must be valid email', 'required']);
      expect(error.recoverable).toBe(false); // Validation errors are not recoverable by default
    });
  });

  describe('AuthError', () => {
    it('should create auth error', () => {
      const error = new AuthError({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        category: ErrorCategory.AUTH,
        authType: 'API_KEY',
        userId: 'user123'
      });

      expect(error.name).toBe('AuthError');
      expect(error.category).toBe(ErrorCategory.AUTH);
      expect(error.authType).toBe('API_KEY');
      expect(error.userId).toBe('user123');
      expect(error.severity).toBe(ErrorSeverity.WARNING);
    });
  });

  describe('AIProcessingError', () => {
    it('should create AI processing error', () => {
      const error = new AIProcessingError({
        message: 'API call failed',
        code: 'API_CALL_FAILED',
        category: ErrorCategory.AI_API,
        model: 'gemini-pro',
        tokensUsed: 1500,
        apiErrorCode: 'RATE_LIMIT'
      });

      expect(error.name).toBe('AIProcessingError');
      expect(error.category).toBe(ErrorCategory.AI_API);
      expect(error.model).toBe('gemini-pro');
      expect(error.tokensUsed).toBe(1500);
      expect(error.apiErrorCode).toBe('RATE_LIMIT');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('ContentError', () => {
    it('should create content error', () => {
      const error = new ContentError({
        message: 'Failed to parse content',
        code: 'PARSE_FAILED',
        category: ErrorCategory.PROCESSING,
        contentType: 'article',
        contentUrl: 'https://example.com/article',
        stage: 'parsing'
      });

      expect(error.name).toBe('ContentError');
      expect(error.category).toBe(ErrorCategory.PROCESSING);
      expect(error.contentType).toBe('article');
      expect(error.contentUrl).toBe('https://example.com/article');
      expect(error.stage).toBe('parsing');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error', () => {
      const error = new RateLimitError({
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        category: ErrorCategory.RATE_LIMIT,
        retryAfter: 60,
        limit: 100,
        remaining: 0
      });

      expect(error.name).toBe('RateLimitError');
      expect(error.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(error.retryAfter).toBe(60);
      expect(error.limit).toBe(100);
      expect(error.remaining).toBe(0);
      expect(error.recoverable).toBe(true);
    });

    it('should provide default suggestion', () => {
      const error = new RateLimitError({
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        category: ErrorCategory.RATE_LIMIT,
        retryAfter: 30
      });

      expect(error.suggestion).toContain('Please wait 30 seconds');
    });

    it('should allow custom suggestion', () => {
      const error = new RateLimitError({
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        category: ErrorCategory.RATE_LIMIT,
        suggestion: 'Custom message'
      });

      expect(error.suggestion).toBe('Custom message');
    });
  });

  describe('ConfigError', () => {
    it('should create config error', () => {
      const error = new ConfigError({
        message: 'Invalid configuration',
        code: 'INVALID_CONFIG',
        category: ErrorCategory.CONFIG,
        configKey: 'apiKey',
        configPath: '/config/app.json'
      });

      expect(error.name).toBe('ConfigError');
      expect(error.category).toBe(ErrorCategory.CONFIG);
      expect(error.configKey).toBe('apiKey');
      expect(error.configPath).toBe('/config/app.json');
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.recoverable).toBe(false);
    });
  });

  describe('SystemError', () => {
    it('should create system error', () => {
      const error = new SystemError({
        message: 'System failure',
        code: 'SYSTEM_FAILURE',
        category: ErrorCategory.SYSTEM,
        component: 'cache',
        operation: 'initialize'
      });

      expect(error.name).toBe('SystemError');
      expect(error.category).toBe(ErrorCategory.SYSTEM);
      expect(error.component).toBe('cache');
      expect(error.operation).toBe('initialize');
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
    });
  });

  describe('CacheError', () => {
    it('should create cache error', () => {
      const error = new CacheError({
        message: 'Cache operation failed',
        code: 'CACHE_FAILED',
        category: ErrorCategory.SYSTEM,
        cacheKey: 'user:123',
        operation: 'get'
      });

      expect(error.name).toBe('CacheError');
      expect(error.category).toBe(ErrorCategory.SYSTEM);
      expect(error.cacheKey).toBe('user:123');
      expect(error.operation).toBe('get');
      expect(error.severity).toBe(ErrorSeverity.WARNING);
      expect(error.recoverable).toBe(true);
    });

    it('should support all cache operations', () => {
      const operations: Array<'get' | 'set' | 'delete' | 'clear'> = ['get', 'set', 'delete', 'clear'];

      operations.forEach(op => {
        const error = new CacheError({
          message: `Cache ${op} failed`,
          code: 'CACHE_FAILED',
          category: ErrorCategory.SYSTEM,
          operation: op
        });

        expect(error.operation).toBe(op);
      });
    });
  });

  describe('StorageError', () => {
    it('should create storage error', () => {
      const error = new StorageError({
        message: 'File operation failed',
        code: 'FILE_FAILED',
        category: ErrorCategory.SYSTEM,
        filePath: '/tmp/test.txt',
        operation: 'write'
      });

      expect(error.name).toBe('StorageError');
      expect(error.category).toBe(ErrorCategory.SYSTEM);
      expect(error.filePath).toBe('/tmp/test.txt');
      expect(error.operation).toBe('write');
      expect(error.recoverable).toBe(true);
    });

    it('should support all storage operations', () => {
      const operations: Array<'read' | 'write' | 'delete' | 'lock'> = ['read', 'write', 'delete', 'lock'];

      operations.forEach(op => {
        const error = new StorageError({
          message: `Storage ${op} failed`,
          code: 'STORAGE_FAILED',
          category: ErrorCategory.SYSTEM,
          operation: op
        });

        expect(error.operation).toBe(op);
      });
    });
  });

  describe('Error Severity Levels', () => {
    it('should support all severity levels', () => {
      const severities = [
        ErrorSeverity.INFO,
        ErrorSeverity.WARNING,
        ErrorSeverity.ERROR,
        ErrorSeverity.CRITICAL,
        ErrorSeverity.FATAL
      ];

      severities.forEach(severity => {
        const error = new ObsidianizeError({
          message: 'Test error',
          code: 'TEST_ERROR',
          category: ErrorCategory.SYSTEM,
          severity
        });

        expect(error.severity).toBe(severity);
      });
    });
  });

  describe('Error Inheritance', () => {
    it('should be instance of Error', () => {
      const error = new ObsidianizeError({
        message: 'Test error',
        code: 'TEST_ERROR',
        category: ErrorCategory.SYSTEM
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ObsidianizeError);
    });

    it('should maintain instanceof for specialized errors', () => {
      const networkError = new NetworkError({
        message: 'Network error',
        code: 'NETWORK_ERROR',
        category: ErrorCategory.NETWORK
      });

      expect(networkError).toBeInstanceOf(Error);
      expect(networkError).toBeInstanceOf(ObsidianizeError);
      expect(networkError).toBeInstanceOf(NetworkError);
    });
  });

  describe('Error Categories', () => {
    it('should enforce correct categories for specialized errors', () => {
      const networkError = new NetworkError({
        message: 'Network error',
        code: 'NET_ERR',
        category: ErrorCategory.NETWORK
      });
      expect(networkError.category).toBe(ErrorCategory.NETWORK);

      const validationError = new ValidationError({
        message: 'Validation error',
        code: 'VAL_ERR',
        category: ErrorCategory.VALIDATION
      });
      expect(validationError.category).toBe(ErrorCategory.VALIDATION);

      const authError = new AuthError({
        message: 'Auth error',
        code: 'AUTH_ERR',
        category: ErrorCategory.AUTH
      });
      expect(authError.category).toBe(ErrorCategory.AUTH);
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors with very long messages', () => {
      const longMessage = 'x'.repeat(10000);
      const error = new ObsidianizeError({
        message: longMessage,
        code: 'LONG_MESSAGE',
        category: ErrorCategory.SYSTEM
      });

      expect(error.message.length).toBe(10000);
      const safeLog = error.toSafeLog();
      expect((safeLog.message as string).length).toBe(200);
    });

    it('should handle errors with undefined details', () => {
      const error = new ObsidianizeError({
        message: 'Test error',
        code: 'TEST_ERROR',
        category: ErrorCategory.SYSTEM,
        details: undefined
      });

      const json = error.toJSON();
      expect(json.details).toBeUndefined();
    });

    it('should handle errors with null values in details', () => {
      const error = new ObsidianizeError({
        message: 'Test error',
        code: 'TEST_ERROR',
        category: ErrorCategory.SYSTEM,
        details: { nullValue: null, undefinedValue: undefined }
      });

      const json = error.toJSON();
      expect(json.details).toEqual({ nullValue: null, undefinedValue: undefined });
    });

    it('should handle zero retry count', () => {
      const error = new ObsidianizeError({
        message: 'Test error',
        code: 'TEST_ERROR',
        category: ErrorCategory.SYSTEM,
        retryCount: 0
      });

      expect(error.retryCount).toBe(0);
    });
  });
});

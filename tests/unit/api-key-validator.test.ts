/**
 * API Key Validator Tests
 * Comprehensive test suite for API key format validation
 *
 * Tests cover:
 * - Valid key formats
 * - Invalid formats
 * - Edge cases
 * - Rate limiting
 * - Security features
 */

import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import {
  ApiKeyValidator,
  validateApiKeyFormat,
  validateGeminiKey,
  type ApiKeyValidationResult
} from '../../src/core/validators/api-key-validator.js';

// Counter to generate unique sources for each test
let sourceCounter = 0;
function getUniqueSource(): string {
  return `test-source-${sourceCounter++}`;
}

describe('ApiKeyValidator', () => {
  // Cleanup after each test to reset rate limiter
  afterEach(() => {
    ApiKeyValidator.shutdown();
    ApiKeyValidator.initialize();
  });

  describe('validateApiKeyFormat', () => {
    describe('valid Google/Gemini API keys', () => {
      test('should accept valid 39-character Google API key', () => {
        const validKey = 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz123450000000'; // 39 chars
        const result = validateApiKeyFormat(validKey, getUniqueSource());

        expect(result.valid).toBe(true);
        expect(result.keyType).toBe('gemini');
        expect(result.error).toBeUndefined();
      });

      test('should accept Google API key with underscores', () => {
        const validKey = 'AIzaSy_4aoWZ9QMZj0F7vY0X_Yz123450000000'; // 39 chars
        const result = validateApiKeyFormat(validKey, getUniqueSource());

        expect(result.valid).toBe(true);
        expect(result.keyType).toBe('gemini');
      });

      test('should accept Google API key with hyphens', () => {
        const validKey = 'AIzaSy-4aoWZ9QMZj0F7vY0X-Yz123450000000'; // 39 chars
        const result = validateApiKeyFormat(validKey, getUniqueSource());

        expect(result.valid).toBe(true);
        expect(result.keyType).toBe('gemini');
      });

      test('should accept Google API key with mixed case', () => {
        const validKey = 'AIzaAbCdEfGhIjKlMnOpQrStUvWxYz123400000'; // 39 chars
        const result = validateApiKeyFormat(validKey, getUniqueSource());

        expect(result.valid).toBe(true);
        expect(result.keyType).toBe('gemini');
      });

      test('should accept valid key with surrounding whitespace (trimmed)', () => {
        const validKey = '  AIzaSyD4aoWZ9QMZj0F7vY0X-Yz123450000000  '; // 39 chars (trimmed)
        const result = validateApiKeyFormat(validKey, getUniqueSource());

        expect(result.valid).toBe(true);
        expect(result.keyType).toBe('gemini');
      });
    });

    describe('invalid formats', () => {
      test('should reject null or undefined', () => {
        const result1 = validateApiKeyFormat(null as any, getUniqueSource());
        const result2 = validateApiKeyFormat(undefined as any, getUniqueSource());

        expect(result1.valid).toBe(false);
        expect(result1.error).toContain('non-empty string');
        expect(result2.valid).toBe(false);
        expect(result2.error).toContain('non-empty string');
      });

      test('should reject empty string', () => {
        const result = validateApiKeyFormat('', getUniqueSource());

        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/empty|non-empty string/i);
        expect(result.keyType).toBe('unknown');
      });

      test('should reject whitespace-only string', () => {
        const result = validateApiKeyFormat('   ', getUniqueSource());

        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/empty|whitespace/i);
      });

      test('should reject key that is too short', () => {
        const shortKey = 'AIzaShortKey';
        const result = validateApiKeyFormat(shortKey, getUniqueSource());

        expect(result.valid).toBe(false);
        expect(result.error).toContain('too short');
        expect(result.keyType).toBe('unknown');
      });

      test('should reject key that is too long', () => {
        const longKey = 'AIza' + 'a'.repeat(500);
        const result = validateApiKeyFormat(longKey, getUniqueSource());

        expect(result.valid).toBe(false);
        expect(result.error).toContain('too long');
      });

      test('should reject key with spaces', () => {
        const keyWithSpaces = 'AIzaSyD4aoWZ9QMZj0F7 vY0X-Yz1234567890Abc';
        const result = validateApiKeyFormat(keyWithSpaces, getUniqueSource());

        expect(result.valid).toBe(false);
        expect(result.error).toContain('cannot contain spaces');
      });

      test('should reject key with invalid characters', () => {
        const invalidKey = 'AIzaSyD4aoWZ9QMZj0F7vY0X@Yz1234567890A';
        const result = validateApiKeyFormat(invalidKey, getUniqueSource());

        expect(result.valid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });

      test('should reject key starting with AIza but wrong length', () => {
        const wrongLengthKey = 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz12345';
        const result = validateApiKeyFormat(wrongLengthKey, getUniqueSource());

        expect(result.valid).toBe(false);
        expect(result.error).toContain('invalid format');
        expect(result.error).toContain('39 characters');
      });

      test('should reject key not starting with AIza', () => {
        const noAIzaKey = 'ByZ1234567890123456789012345678901234567';
        const result = validateApiKeyFormat(noAIzaKey, getUniqueSource());

        expect(result.valid).toBe(false);
        expect(result.error).toContain('not recognized');
        expect(result.error).toContain('AIza');
      });
    });

    describe('placeholder detection', () => {
      const placeholders = [
        'your_api_key',
        'YOUR-API-KEY',
        'api_key',
        'API-KEY',
        'key',
        'test',
        'demo',
        'placeholder',
        'xxxxxxxxxxxxxxxxxxxxxxxxx',
        '00000000000000000000000000',
      ];

      placeholders.forEach(placeholder => {
        test(`should reject placeholder: "${placeholder}"`, () => {
          const result = validateApiKeyFormat(placeholder, getUniqueSource());

          expect(result.valid).toBe(false);
          expect(result.error).toContain('placeholder');
          expect(result.keyType).toBe('unknown');
        });
      });
    });

    describe('edge cases', () => {
      test('should handle non-string input gracefully', () => {
        const result1 = validateApiKeyFormat(12345 as any, getUniqueSource());
        const result2 = validateApiKeyFormat({} as any, getUniqueSource());
        const result3 = validateApiKeyFormat([] as any, getUniqueSource());

        expect(result1.valid).toBe(false);
        expect(result2.valid).toBe(false);
        expect(result3.valid).toBe(false);
      });

      test('should handle key with newlines', () => {
        const keyWithNewline = 'AIzaSyD4aoWZ9QMZj0F7vY0X\nYz1234567890Abc';
        const result = validateApiKeyFormat(keyWithNewline, getUniqueSource());

        expect(result.valid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });

      test('should handle key with tabs', () => {
        const keyWithTab = 'AIzaSyD4aoWZ9QMZj0F7vY0X\tYz1234567890Abc';
        const result = validateApiKeyFormat(keyWithTab, getUniqueSource());

        expect(result.valid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });
    });
  });

  describe('validateGeminiKey', () => {
    test('should accept valid Gemini API key', () => {
      const validKey = 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz123450000000'; // 39 chars
      const result = validateGeminiKey(validKey, getUniqueSource());

      expect(result.valid).toBe(true);
      expect(result.keyType).toBe('gemini');
      expect(result.error).toBeUndefined();
    });

    test('should reject non-Google API key format', () => {
      const nonGoogleKey = 'sk-1234567890123456789012345678901234567890';
      const result = validateGeminiKey(nonGoogleKey, getUniqueSource());

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Google/Gemini');
      expect(result.error).toContain('AIza');
    });

    test('should reject invalid key', () => {
      const invalidKey = 'invalid_key';
      const result = validateGeminiKey(invalidKey, getUniqueSource());

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('rate limiting', () => {
    test('should allow multiple validations under rate limit', () => {
      const validKey = 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz123450000000'; // 39 chars
      const source = getUniqueSource();

      for (let i = 0; i < 5; i++) {
        const result = validateApiKeyFormat(validKey, source);
        expect(result.valid).toBe(true);
      }
    });

    test('should enforce rate limit after max attempts', () => {
      const validKey = 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz123450000000'; // 39 chars
      const source = getUniqueSource();

      // Make 10 attempts (should all succeed)
      for (let i = 0; i < 10; i++) {
        const result = validateApiKeyFormat(validKey, source);
        expect(result.valid).toBe(true);
      }

      // 11th attempt should be rate limited
      const rateLimitedResult = validateApiKeyFormat(validKey, source);
      expect(rateLimitedResult.valid).toBe(false);
      expect(rateLimitedResult.error).toContain('Too many validation attempts');
    });

    test('should track rate limits per source', () => {
      const validKey = 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz123450000000'; // 39 chars
      const source1 = getUniqueSource();
      const source2 = getUniqueSource();

      // Source 1: Make 10 attempts
      for (let i = 0; i < 10; i++) {
        validateApiKeyFormat(validKey, source1);
      }

      // Source 2: Should still be allowed
      const result = validateApiKeyFormat(validKey, source2);
      expect(result.valid).toBe(true);
    });

    test('should provide rate limit status', () => {
      const validKey = 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz123450000000'; // 39 chars
      const source = getUniqueSource();

      // Make 3 attempts
      for (let i = 0; i < 3; i++) {
        validateApiKeyFormat(validKey, source);
      }

      const status = ApiKeyValidator.getRateLimitStatus(source);
      expect(status.attemptCount).toBe(3);
      expect(status.maxAttempts).toBe(10);
      expect(status.isLimited).toBe(false);
    });

    test('should show rate limited status when limit exceeded', () => {
      const validKey = 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz123450000000'; // 39 chars
      const source = getUniqueSource();

      // Make 11 attempts
      for (let i = 0; i < 11; i++) {
        validateApiKeyFormat(validKey, source);
      }

      const status = ApiKeyValidator.getRateLimitStatus(source);
      expect(status.isLimited).toBe(true);
      expect(status.attemptCount).toBe(10); // Capped at window max
    });
  });

  describe('sanitizeForLogging', () => {
    test('should sanitize valid API key', () => {
      const key = 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz123450000000'; // 39 chars
      const sanitized = ApiKeyValidator.sanitizeForLogging(key);

      expect(sanitized).toBe('AIzaSyD4...0000');
      expect(sanitized).not.toContain('aoWZ9QMZ');
    });

    test('should handle short keys', () => {
      const shortKey = 'short';
      const sanitized = ApiKeyValidator.sanitizeForLogging(shortKey);

      expect(sanitized).toBe('[TOO_SHORT]');
    });

    test('should handle invalid input', () => {
      const sanitized1 = ApiKeyValidator.sanitizeForLogging(null as any);
      const sanitized2 = ApiKeyValidator.sanitizeForLogging(undefined as any);
      const sanitized3 = ApiKeyValidator.sanitizeForLogging('' as any);

      expect(sanitized1).toBe('[INVALID]');
      expect(sanitized2).toBe('[INVALID]');
      expect(sanitized3).toBe('[INVALID]');
    });

    test('should trim whitespace before sanitizing', () => {
      const key = '  AIzaSyD4aoWZ9QMZj0F7vY0X-Yz1234567890Abc  ';
      const sanitized = ApiKeyValidator.sanitizeForLogging(key);

      expect(sanitized).toBe('AIzaSyD4...0Abc');
    });
  });

  describe('convenience functions', () => {
    test('validateApiKeyFormat function should work', () => {
      const validKey = 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz123450000000'; // 39 chars
      const result = validateApiKeyFormat(validKey, getUniqueSource());

      expect(result.valid).toBe(true);
      expect(result.keyType).toBe('gemini');
    });

    test('validateGeminiKey function should work', () => {
      const validKey = 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz123450000000'; // 39 chars
      const result = validateGeminiKey(validKey, getUniqueSource());

      expect(result.valid).toBe(true);
      expect(result.keyType).toBe('gemini');
    });
  });

  describe('initialization and shutdown', () => {
    test('should initialize without errors', () => {
      expect(() => ApiKeyValidator.initialize()).not.toThrow();
    });

    test('should shutdown without errors', () => {
      expect(() => ApiKeyValidator.shutdown()).not.toThrow();
    });

    test('should handle multiple initializations', () => {
      ApiKeyValidator.initialize();
      ApiKeyValidator.initialize();
      // Should not create multiple intervals
      expect(() => ApiKeyValidator.shutdown()).not.toThrow();
    });
  });

  describe('type checking', () => {
    test('should return correct type', () => {
      const validKey = 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz123450000000'; // 39 chars
      const result: ApiKeyValidationResult = validateApiKeyFormat(validKey, getUniqueSource());

      // Type assertions
      expect(typeof result.valid).toBe('boolean');
      if (result.error) {
        expect(typeof result.error).toBe('string');
      }
      if (result.keyType) {
        expect(['gemini', 'unknown']).toContain(result.keyType);
      }
    });
  });

  describe('legacy Google API key format', () => {
    test('should accept 37-character Google API key (legacy)', () => {
      const legacyKey = 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz1234567890'; // 37 chars
      const result = validateApiKeyFormat(legacyKey, getUniqueSource());

      expect(result.valid).toBe(true);
      expect(result.keyType).toBe('gemini');
    });

    test('should accept 38-character Google API key (legacy)', () => {
      const legacyKey = 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz12345678901'; // 38 chars
      const result = validateApiKeyFormat(legacyKey, getUniqueSource());

      expect(result.valid).toBe(true);
      expect(result.keyType).toBe('gemini');
    });
  });

  describe('real-world scenarios', () => {
    test('should handle API key from environment variable', () => {
      // Simulate reading from env with potential whitespace
      const envKey = '\nAIzaSyD4aoWZ9QMZj0F7vY0X-Yz123450000000\n'; // 39 chars when trimmed
      const result = validateApiKeyFormat(envKey, getUniqueSource());

      expect(result.valid).toBe(true);
      expect(result.keyType).toBe('gemini');
    });

    test('should handle API key from user input', () => {
      // Simulate copy-paste with extra spaces
      const userKey = '   AIzaSyD4aoWZ9QMZj0F7vY0X-Yz123450000000   '; // 39 chars when trimmed
      const result = validateApiKeyFormat(userKey, getUniqueSource());

      expect(result.valid).toBe(true);
      expect(result.keyType).toBe('gemini');
    });

    test('should reject common typos', () => {
      const typos = [
        { key: 'AizaSyD4aoWZ9QMZj0F7vY0X-Yz123456789', shouldFail: true }, // Missing 'I' - wrong prefix
        { key: 'AIzaSyD4aoWZ9QMZj0F7vY0X-Yz12345678901234', shouldFail: true }, // 41 chars - too long
        { key: 'AIzaSyD4aoWZ9QMZj0F7vY0X', shouldFail: true }, // Too short (25 chars)
      ];

      typos.forEach(({ key, shouldFail }) => {
        const result = validateApiKeyFormat(key, getUniqueSource());
        if (shouldFail) {
          expect(result.valid).toBe(false);
        }
      });
    });
  });
});

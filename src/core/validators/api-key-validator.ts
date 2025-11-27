/**
 * API Key Format Validator
 * Validates API key formats WITHOUT making API calls to prevent quota consumption
 *
 * Based on Opus Code Review recommendations (SEC-2.1, SEC-2.2)
 * Version: 1.0.0
 */

import { VALIDATION } from '../constants/index.js';

/**
 * API key validation result
 */
export interface ApiKeyValidationResult {
  /** Whether the key format is valid */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Detected key type */
  keyType?: 'gemini' | 'unknown';
}

/**
 * Rate limit tracking for validation attempts
 * Prevents brute force attacks on API key validation
 */
class ValidationRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttemptsPerMinute = 10;
  private readonly windowMs = 60 * 1000; // 1 minute

  /**
   * Check if a source has exceeded rate limits
   */
  isRateLimited(source: string): boolean {
    const now = Date.now();
    const sourceAttempts = this.attempts.get(source) || [];

    // Remove attempts outside the time window
    const recentAttempts = sourceAttempts.filter(timestamp => now - timestamp < this.windowMs);

    // Update the attempts list
    this.attempts.set(source, recentAttempts);

    return recentAttempts.length >= this.maxAttemptsPerMinute;
  }

  /**
   * Record a validation attempt
   */
  recordAttempt(source: string): void {
    const now = Date.now();
    const sourceAttempts = this.attempts.get(source) || [];
    sourceAttempts.push(now);
    this.attempts.set(source, sourceAttempts);
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    for (const [source, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter(timestamp => now - timestamp < this.windowMs);
      if (recentAttempts.length === 0) {
        this.attempts.delete(source);
      } else {
        this.attempts.set(source, recentAttempts);
      }
    }
  }

  /**
   * Get current attempt count for a source
   */
  getAttemptCount(source: string): number {
    const now = Date.now();
    const sourceAttempts = this.attempts.get(source) || [];
    return sourceAttempts.filter(timestamp => now - timestamp < this.windowMs).length;
  }
}

/**
 * API Key Format Patterns
 */
const API_KEY_PATTERNS = {
  /**
   * Google API keys (including Gemini)
   * Format: AIza followed by 35 alphanumeric characters, underscores, or hyphens
   * Total length: 39 characters
   */
  GOOGLE: /^AIza[0-9A-Za-z_\-]{35}$/,

  /**
   * Alternative Google API key pattern (less common)
   * Some older Google API keys may have 37-38 total characters
   * That's AIza (4) + 33-34 more characters
   */
  GOOGLE_LEGACY: /^AIza[0-9A-Za-z_\-]{33,34}$/,
} as const;

/**
 * API Key Validator Class
 * Provides format-only validation without consuming API quota
 */
export class ApiKeyValidator {
  private static rateLimiter = new ValidationRateLimiter();
  private static cleanupInterval: Timer | null = null;

  /**
   * Initialize automatic cleanup of rate limiter
   */
  static initialize(): void {
    if (!this.cleanupInterval) {
      // Clean up every 5 minutes
      this.cleanupInterval = setInterval(() => {
        this.rateLimiter.cleanup();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Shutdown cleanup interval (useful for testing)
   */
  static shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Validate API key format without making API calls
   *
   * @param key - API key to validate
   * @param source - Source identifier for rate limiting (default: 'default')
   * @returns Validation result with format details
   */
  static validateApiKeyFormat(key: string, source: string = 'default'): ApiKeyValidationResult {
    // Check rate limiting
    if (this.rateLimiter.isRateLimited(source)) {
      return {
        valid: false,
        error: 'Too many validation attempts. Please try again later.',
        keyType: 'unknown'
      };
    }

    // Record this attempt
    this.rateLimiter.recordAttempt(source);

    // Basic validation
    if (!key || typeof key !== 'string') {
      return {
        valid: false,
        error: 'API key must be a non-empty string',
        keyType: 'unknown'
      };
    }

    // Trim whitespace (common copy-paste issue)
    const trimmedKey = key.trim();

    // Check for empty or whitespace-only strings
    if (trimmedKey.length === 0) {
      return {
        valid: false,
        error: 'API key cannot be empty or whitespace only',
        keyType: 'unknown'
      };
    }

    // Check for placeholder values FIRST (before length checks)
    const placeholderPatterns = [
      /^your[_-]?api[_-]?key$/i,
      /^api[_-]?key$/i,
      /^key$/i,
      /^test$/i,
      /^demo$/i,
      /^placeholder$/i,
      /^xxx+$/i,
      /^000+$/i,
    ];

    for (const pattern of placeholderPatterns) {
      if (pattern.test(trimmedKey)) {
        return {
          valid: false,
          error: 'API key appears to be a placeholder value',
          keyType: 'unknown'
        };
      }
    }

    // Check for common invalid patterns BEFORE length checks
    if (trimmedKey.includes(' ')) {
      return {
        valid: false,
        error: 'API key cannot contain spaces',
        keyType: 'unknown'
      };
    }

    // Check for invalid characters (must be alphanumeric, underscore, or hyphen)
    const genericPattern = /^[a-zA-Z0-9_\-]+$/;
    if (!genericPattern.test(trimmedKey)) {
      return {
        valid: false,
        error: 'API key contains invalid characters (only alphanumeric, underscores, and hyphens allowed)',
        keyType: 'unknown'
      };
    }

    // Check minimum length
    if (trimmedKey.length < VALIDATION.MIN_API_KEY_LENGTH) {
      return {
        valid: false,
        error: `API key is too short (minimum ${VALIDATION.MIN_API_KEY_LENGTH} characters)`,
        keyType: 'unknown'
      };
    }

    // Check maximum length
    if (trimmedKey.length > VALIDATION.MAX_API_KEY_LENGTH) {
      return {
        valid: false,
        error: `API key is too long (maximum ${VALIDATION.MAX_API_KEY_LENGTH} characters)`,
        keyType: 'unknown'
      };
    }

    // Validate Google/Gemini API key format
    if (API_KEY_PATTERNS.GOOGLE.test(trimmedKey)) {
      return {
        valid: true,
        keyType: 'gemini'
      };
    }

    // Check legacy Google format (but not standard 39-char format)
    if (API_KEY_PATTERNS.GOOGLE_LEGACY.test(trimmedKey) && !API_KEY_PATTERNS.GOOGLE.test(trimmedKey)) {
      return {
        valid: true,
        keyType: 'gemini'
      };
    }

    // Key doesn't match Google/Gemini format
    if (trimmedKey.startsWith('AIza')) {
      return {
        valid: false,
        error: 'API key starts with "AIza" but has invalid format (expected 39 characters total)',
        keyType: 'unknown'
      };
    }

    // Key passes generic validation but isn't recognized as Gemini
    return {
      valid: false,
      error: 'API key format not recognized. Expected Google/Gemini API key starting with "AIza"',
      keyType: 'unknown'
    };
  }

  /**
   * Validate specifically for Gemini API keys
   * Stricter validation that only accepts Google API key format
   *
   * @param key - API key to validate
   * @param source - Source identifier for rate limiting (default: 'default')
   * @returns Validation result
   */
  static validateGeminiKey(key: string, source: string = 'default'): ApiKeyValidationResult {
    const result = this.validateApiKeyFormat(key, source);

    // If format validation failed, return early
    if (!result.valid) {
      return result;
    }

    // Ensure it's a Gemini key
    if (result.keyType !== 'gemini') {
      return {
        valid: false,
        error: 'API key must be a valid Google/Gemini API key (starting with "AIza")',
        keyType: result.keyType
      };
    }

    return result;
  }

  /**
   * Get current rate limit status for a source
   *
   * @param source - Source identifier
   * @returns Object with rate limit information
   */
  static getRateLimitStatus(source: string = 'default'): {
    isLimited: boolean;
    attemptCount: number;
    maxAttempts: number;
  } {
    return {
      isLimited: this.rateLimiter.isRateLimited(source),
      attemptCount: this.rateLimiter.getAttemptCount(source),
      maxAttempts: 10
    };
  }

  /**
   * Sanitize API key for logging (show only first 8 and last 4 characters)
   *
   * @param key - API key to sanitize
   * @returns Sanitized key safe for logging
   */
  static sanitizeForLogging(key: string): string {
    if (!key || typeof key !== 'string') {
      return '[INVALID]';
    }

    const trimmedKey = key.trim();

    if (trimmedKey.length < 12) {
      return '[TOO_SHORT]';
    }

    return `${trimmedKey.substring(0, 8)}...${trimmedKey.substring(trimmedKey.length - 4)}`;
  }
}

// Initialize the validator on module load
ApiKeyValidator.initialize();

/**
 * Convenience function for validating API key format
 *
 * @param key - API key to validate
 * @param source - Source identifier for rate limiting
 * @returns Validation result
 */
export function validateApiKeyFormat(key: string, source?: string): ApiKeyValidationResult {
  return ApiKeyValidator.validateApiKeyFormat(key, source);
}

/**
 * Convenience function for validating Gemini API keys
 *
 * @param key - API key to validate
 * @param source - Source identifier for rate limiting
 * @returns Validation result
 */
export function validateGeminiKey(key: string, source?: string): ApiKeyValidationResult {
  return ApiKeyValidator.validateGeminiKey(key, source);
}

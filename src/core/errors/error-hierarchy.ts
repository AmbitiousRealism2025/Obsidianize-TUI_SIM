/**
 * Comprehensive Error Hierarchy for Obsidianize
 * Implements standardized error handling across all modules
 *
 * Based on Opus Code Review recommendations (ARCH-1.1, ARCH-1.2)
 * Version: 1.0.0
 */

import { ErrorCategory } from '../types/index.js';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  /** Informational - operation completed but with notable conditions */
  INFO = 'info',
  /** Warning - operation completed but may have issues */
  WARNING = 'warning',
  /** Error - operation failed but system can recover */
  ERROR = 'error',
  /** Critical - operation failed, may affect system stability */
  CRITICAL = 'critical',
  /** Fatal - unrecoverable error, system should shut down gracefully */
  FATAL = 'fatal'
}

/**
 * Base error options interface
 */
export interface ObsidianizeErrorOptions {
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
  /** Error category for classification */
  category: ErrorCategory;
  /** Whether this error is recoverable */
  recoverable?: boolean;
  /** Error severity */
  severity?: ErrorSeverity;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Suggested action for recovery */
  suggestion?: string;
  /** Original error if this wraps another error */
  cause?: Error;
  /** Retry count if applicable */
  retryCount?: number;
  /** Timestamp of when error occurred */
  timestamp?: Date;
}

/**
 * Generate a unique error ID for tracking
 */
function generateErrorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ERR-${timestamp}-${random}`.toUpperCase();
}

/**
 * Base error class for all Obsidianize errors
 * Provides consistent error structure and handling
 */
export class ObsidianizeError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly recoverable: boolean;
  public readonly severity: ErrorSeverity;
  public readonly details?: Record<string, unknown>;
  public readonly suggestion?: string;
  public readonly cause?: Error;
  public readonly retryCount: number;
  public readonly timestamp: Date;
  public readonly errorId: string;

  constructor(options: ObsidianizeErrorOptions) {
    super(options.message);
    this.name = 'ObsidianizeError';
    this.code = options.code;
    this.category = options.category;
    this.recoverable = options.recoverable ?? false;
    this.severity = options.severity ?? ErrorSeverity.ERROR;
    this.details = options.details;
    this.suggestion = options.suggestion;
    this.cause = options.cause;
    this.retryCount = options.retryCount ?? 0;
    this.timestamp = options.timestamp ?? new Date();
    this.errorId = generateErrorId();

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert to a plain object for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      recoverable: this.recoverable,
      severity: this.severity,
      details: this.details,
      suggestion: this.suggestion,
      retryCount: this.retryCount,
      timestamp: this.timestamp.toISOString(),
      errorId: this.errorId,
      // Only include stack in development
      stack: process.env.NODE_ENV !== 'production' ? this.stack : undefined
    };
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    if (this.suggestion) {
      return `${this.message}. ${this.suggestion}`;
    }
    return this.message;
  }

  /**
   * Get a sanitized version safe for production logging
   */
  toSafeLog(): Record<string, unknown> {
    return {
      errorId: this.errorId,
      code: this.code,
      category: this.category,
      severity: this.severity,
      recoverable: this.recoverable,
      timestamp: this.timestamp.toISOString(),
      // Omit potentially sensitive details
      message: this.message.substring(0, 200)
    };
  }
}

/**
 * Network-related errors (timeouts, connection failures, etc.)
 */
export class NetworkError extends ObsidianizeError {
  public readonly url?: string;
  public readonly statusCode?: number;
  public readonly method?: string;

  constructor(options: ObsidianizeErrorOptions & {
    url?: string;
    statusCode?: number;
    method?: string;
  }) {
    super({
      ...options,
      category: ErrorCategory.NETWORK,
      recoverable: options.recoverable ?? true
    });
    this.name = 'NetworkError';
    this.url = options.url;
    this.statusCode = options.statusCode;
    this.method = options.method;
  }
}

/**
 * Validation errors (input validation, schema validation, etc.)
 */
export class ValidationError extends ObsidianizeError {
  public readonly field?: string;
  public readonly value?: unknown;
  public readonly constraints?: string[];

  constructor(options: ObsidianizeErrorOptions & {
    field?: string;
    value?: unknown;
    constraints?: string[];
  }) {
    super({
      ...options,
      category: ErrorCategory.VALIDATION,
      recoverable: options.recoverable ?? false
    });
    this.name = 'ValidationError';
    this.field = options.field;
    this.value = options.value;
    this.constraints = options.constraints;
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthError extends ObsidianizeError {
  public readonly authType?: string;
  public readonly userId?: string;

  constructor(options: ObsidianizeErrorOptions & {
    authType?: string;
    userId?: string;
  }) {
    super({
      ...options,
      category: ErrorCategory.AUTH,
      recoverable: options.recoverable ?? false,
      severity: options.severity ?? ErrorSeverity.WARNING
    });
    this.name = 'AuthError';
    this.authType = options.authType;
    this.userId = options.userId;
  }
}

/**
 * AI/API processing errors (Gemini API failures, rate limits, etc.)
 */
export class AIProcessingError extends ObsidianizeError {
  public readonly model?: string;
  public readonly tokensUsed?: number;
  public readonly apiErrorCode?: string;

  constructor(options: ObsidianizeErrorOptions & {
    model?: string;
    tokensUsed?: number;
    apiErrorCode?: string;
  }) {
    super({
      ...options,
      category: ErrorCategory.AI_API,
      recoverable: options.recoverable ?? true
    });
    this.name = 'AIProcessingError';
    this.model = options.model;
    this.tokensUsed = options.tokensUsed;
    this.apiErrorCode = options.apiErrorCode;
  }
}

/**
 * Content processing errors (parsing, transformation, etc.)
 */
export class ContentError extends ObsidianizeError {
  public readonly contentType?: string;
  public readonly contentUrl?: string;
  public readonly stage?: string;

  constructor(options: ObsidianizeErrorOptions & {
    contentType?: string;
    contentUrl?: string;
    stage?: string;
  }) {
    super({
      ...options,
      category: ErrorCategory.PROCESSING,
      recoverable: options.recoverable ?? true
    });
    this.name = 'ContentError';
    this.contentType = options.contentType;
    this.contentUrl = options.contentUrl;
    this.stage = options.stage;
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends ObsidianizeError {
  public readonly retryAfter?: number;
  public readonly limit?: number;
  public readonly remaining?: number;

  constructor(options: ObsidianizeErrorOptions & {
    retryAfter?: number;
    limit?: number;
    remaining?: number;
  }) {
    super({
      ...options,
      category: ErrorCategory.RATE_LIMIT,
      recoverable: true,
      suggestion: options.suggestion ?? `Please wait ${options.retryAfter || 60} seconds before retrying`
    });
    this.name = 'RateLimitError';
    this.retryAfter = options.retryAfter;
    this.limit = options.limit;
    this.remaining = options.remaining;
  }
}

/**
 * Configuration errors
 */
export class ConfigError extends ObsidianizeError {
  public readonly configKey?: string;
  public readonly configPath?: string;

  constructor(options: ObsidianizeErrorOptions & {
    configKey?: string;
    configPath?: string;
  }) {
    super({
      ...options,
      category: ErrorCategory.CONFIG,
      recoverable: options.recoverable ?? false,
      severity: options.severity ?? ErrorSeverity.CRITICAL
    });
    this.name = 'ConfigError';
    this.configKey = options.configKey;
    this.configPath = options.configPath;
  }
}

/**
 * System/internal errors
 */
export class SystemError extends ObsidianizeError {
  public readonly component?: string;
  public readonly operation?: string;

  constructor(options: ObsidianizeErrorOptions & {
    component?: string;
    operation?: string;
  }) {
    super({
      ...options,
      category: ErrorCategory.SYSTEM,
      severity: options.severity ?? ErrorSeverity.CRITICAL
    });
    this.name = 'SystemError';
    this.component = options.component;
    this.operation = options.operation;
  }
}

/**
 * Cache-related errors
 */
export class CacheError extends ObsidianizeError {
  public readonly cacheKey?: string;
  public readonly operation?: 'get' | 'set' | 'delete' | 'clear';

  constructor(options: ObsidianizeErrorOptions & {
    cacheKey?: string;
    operation?: 'get' | 'set' | 'delete' | 'clear';
  }) {
    super({
      ...options,
      category: ErrorCategory.SYSTEM,
      recoverable: options.recoverable ?? true,
      severity: options.severity ?? ErrorSeverity.WARNING
    });
    this.name = 'CacheError';
    this.cacheKey = options.cacheKey;
    this.operation = options.operation;
  }
}

/**
 * Storage/file operation errors
 */
export class StorageError extends ObsidianizeError {
  public readonly filePath?: string;
  public readonly operation?: 'read' | 'write' | 'delete' | 'lock';

  constructor(options: ObsidianizeErrorOptions & {
    filePath?: string;
    operation?: 'read' | 'write' | 'delete' | 'lock';
  }) {
    super({
      ...options,
      category: ErrorCategory.SYSTEM,
      recoverable: options.recoverable ?? true
    });
    this.name = 'StorageError';
    this.filePath = options.filePath;
    this.operation = options.operation;
  }
}

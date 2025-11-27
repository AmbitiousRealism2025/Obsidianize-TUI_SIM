/**
 * Error Handling Module Exports
 * Central export point for all error-related types and utilities
 *
 * Version: 1.0.0
 */

export {
  ObsidianizeError,
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
  ErrorSeverity,
  type ObsidianizeErrorOptions
} from './error-hierarchy.js';

import {
  ObsidianizeError,
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
  ErrorSeverity
} from './error-hierarchy.js';
import { ErrorCategory } from '../types/index.js';

/**
 * Type guard to check if an error is an ObsidianizeError
 */
export function isObsidianizeError(error: unknown): error is ObsidianizeError {
  return error instanceof ObsidianizeError;
}

/**
 * Type guard for NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Type guard for ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard for AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Type guard for AIProcessingError
 */
export function isAIProcessingError(error: unknown): error is AIProcessingError {
  return error instanceof AIProcessingError;
}

/**
 * Type guard for RateLimitError
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

/**
 * Type guard for recoverable errors
 */
export function isRecoverableError(error: unknown): boolean {
  if (isObsidianizeError(error)) {
    return error.recoverable;
  }
  return false;
}

/**
 * Wrap unknown errors in ObsidianizeError
 */
export function wrapError(
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred'
): ObsidianizeError {
  if (isObsidianizeError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new SystemError({
      message: error.message || defaultMessage,
      code: 'WRAPPED_ERROR',
      category: ErrorCategory.SYSTEM,
      cause: error,
      details: {
        originalName: error.name,
        originalStack: error.stack
      }
    });
  }

  return new SystemError({
    message: typeof error === 'string' ? error : defaultMessage,
    code: 'UNKNOWN_ERROR',
    category: ErrorCategory.SYSTEM,
    details: { originalValue: error }
  });
}

/**
 * Extract user-friendly message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (isObsidianizeError(error)) {
    return error.getUserMessage();
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Get error code from any error
 */
export function getErrorCode(error: unknown): string {
  if (isObsidianizeError(error)) {
    return error.code;
  }
  if (error instanceof Error) {
    return error.name;
  }
  return 'UNKNOWN';
}

/**
 * Create an error based on category
 */
export function createError(
  category: ErrorCategory,
  message: string,
  code: string,
  options: Partial<Omit<import('./error-hierarchy.js').ObsidianizeErrorOptions, 'message' | 'code' | 'category'>> = {}
): ObsidianizeError {
  const baseOptions = { message, code, category, ...options };

  switch (category) {
    case ErrorCategory.NETWORK:
      return new NetworkError(baseOptions);
    case ErrorCategory.VALIDATION:
      return new ValidationError(baseOptions);
    case ErrorCategory.AUTH:
      return new AuthError(baseOptions);
    case ErrorCategory.AI_API:
      return new AIProcessingError(baseOptions);
    case ErrorCategory.PROCESSING:
      return new ContentError(baseOptions);
    case ErrorCategory.RATE_LIMIT:
      return new RateLimitError(baseOptions);
    case ErrorCategory.CONFIG:
      return new ConfigError(baseOptions);
    case ErrorCategory.SYSTEM:
    default:
      return new SystemError(baseOptions);
  }
}

/**
 * Error codes registry for consistent error handling
 */
export const ErrorCodes = {
  // Network errors
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION_FAILED: 'NETWORK_CONNECTION_FAILED',
  NETWORK_DNS_FAILED: 'NETWORK_DNS_FAILED',
  SSRF_BLOCKED: 'SSRF_BLOCKED',

  // Validation errors
  INVALID_URL: 'INVALID_URL',
  INVALID_API_KEY: 'INVALID_API_KEY',
  INVALID_INPUT: 'INVALID_INPUT',
  SCHEMA_VALIDATION_FAILED: 'SCHEMA_VALIDATION_FAILED',

  // Auth errors
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',

  // AI errors
  AI_REQUEST_FAILED: 'AI_REQUEST_FAILED',
  AI_RESPONSE_INVALID: 'AI_RESPONSE_INVALID',
  AI_MODEL_UNAVAILABLE: 'AI_MODEL_UNAVAILABLE',
  AI_CONTENT_BLOCKED: 'AI_CONTENT_BLOCKED',

  // Processing errors
  CONTENT_FETCH_FAILED: 'CONTENT_FETCH_FAILED',
  CONTENT_PARSE_FAILED: 'CONTENT_PARSE_FAILED',
  CONTENT_TOO_LARGE: 'CONTENT_TOO_LARGE',
  CONTENT_UNSUPPORTED: 'CONTENT_UNSUPPORTED',

  // Rate limit errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // Config errors
  CONFIG_MISSING: 'CONFIG_MISSING',
  CONFIG_INVALID: 'CONFIG_INVALID',

  // System errors
  SYSTEM_INTERNAL: 'SYSTEM_INTERNAL',
  SYSTEM_RESOURCE_EXHAUSTED: 'SYSTEM_RESOURCE_EXHAUSTED',
  CACHE_OPERATION_FAILED: 'CACHE_OPERATION_FAILED',
  STORAGE_OPERATION_FAILED: 'STORAGE_OPERATION_FAILED'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

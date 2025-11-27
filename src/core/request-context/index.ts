/**
 * Request Context and ID Tracking
 * Provides consistent request tracking across the application
 *
 * Phase 3: Production Readiness Feature
 * Version: 1.0.0
 */

import { createLogger } from '../logging/index.js';

const logger = createLogger('request-context');

// ============================================================================
// REQUEST ID GENERATION
// ============================================================================

/**
 * Generate a unique request ID
 * Format: req_<timestamp>_<random>
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * Validate a request ID format
 */
export function isValidRequestId(id: string): boolean {
  return /^req_[a-z0-9]+_[a-z0-9]+$/.test(id);
}

// ============================================================================
// REQUEST CONTEXT
// ============================================================================

export interface RequestMetadata {
  /** Client IP address */
  ip?: string;
  /** User agent string */
  userAgent?: string;
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** Query parameters */
  query?: Record<string, string>;
  /** API key hash (for identifying user without exposing key) */
  apiKeyHash?: string;
  /** Rate limit tier */
  tier?: string;
  /** Request timestamp */
  timestamp: number;
}

export interface RequestContext {
  /** Unique request identifier */
  id: string;
  /** Request metadata */
  metadata: RequestMetadata;
  /** Processing start time (high-res) */
  startTime: number;
  /** Correlation ID for distributed tracing */
  correlationId?: string;
  /** Parent request ID (for batch processing) */
  parentId?: string;
  /** Custom attributes */
  attributes: Record<string, unknown>;
}

// ============================================================================
// ASYNC LOCAL STORAGE FOR REQUEST CONTEXT
// ============================================================================

// Simple storage for current request context (Bun doesn't have AsyncLocalStorage issues)
let currentContext: RequestContext | null = null;
const contextStack: RequestContext[] = [];

/**
 * Create a new request context
 */
export function createRequestContext(req: Request, options?: {
  correlationId?: string;
  parentId?: string;
  requestId?: string;
}): RequestContext {
  const url = new URL(req.url);
  const existingId = req.headers.get('X-Request-ID');

  const context: RequestContext = {
    id: options?.requestId || existingId || generateRequestId(),
    metadata: {
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      ip: req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
          req.headers.get('X-Real-IP') ||
          'unknown',
      userAgent: req.headers.get('User-Agent') || undefined,
      timestamp: Date.now()
    },
    startTime: performance.now(),
    correlationId: options?.correlationId || req.headers.get('X-Correlation-ID') || undefined,
    parentId: options?.parentId || req.headers.get('X-Parent-Request-ID') || undefined,
    attributes: {}
  };

  return context;
}

/**
 * Set the current request context
 */
export function setRequestContext(context: RequestContext): void {
  if (currentContext) {
    contextStack.push(currentContext);
  }
  currentContext = context;
}

/**
 * Get the current request context
 */
export function getRequestContext(): RequestContext | null {
  return currentContext;
}

/**
 * Get the current request ID
 */
export function getRequestId(): string | null {
  return currentContext?.id || null;
}

/**
 * Clear the current request context
 */
export function clearRequestContext(): void {
  currentContext = contextStack.pop() || null;
}

/**
 * Run a function with a request context
 */
export async function withRequestContext<T>(
  context: RequestContext,
  fn: () => T | Promise<T>
): Promise<T> {
  setRequestContext(context);
  try {
    return await fn();
  } finally {
    clearRequestContext();
  }
}

// ============================================================================
// CONTEXT ATTRIBUTES
// ============================================================================

/**
 * Set an attribute on the current context
 */
export function setContextAttribute(key: string, value: unknown): void {
  if (currentContext) {
    currentContext.attributes[key] = value;
  }
}

/**
 * Get an attribute from the current context
 */
export function getContextAttribute<T>(key: string): T | undefined {
  return currentContext?.attributes[key] as T | undefined;
}

/**
 * Set the API key hash for the current request
 */
export function setApiKeyHash(hash: string): void {
  if (currentContext) {
    currentContext.metadata.apiKeyHash = hash;
  }
}

/**
 * Set the rate limit tier for the current request
 */
export function setRateLimitTier(tier: string): void {
  if (currentContext) {
    currentContext.metadata.tier = tier;
  }
}

// ============================================================================
// TIMING AND METRICS
// ============================================================================

/**
 * Get elapsed time since request start (ms)
 */
export function getElapsedTime(): number {
  if (!currentContext) return 0;
  return performance.now() - currentContext.startTime;
}

/**
 * Create a timing span within the current request
 */
export function createTimingSpan(name: string): () => number {
  const start = performance.now();
  const requestId = getRequestId();

  return () => {
    const duration = performance.now() - start;
    logger.debug(`Timing span: ${name}`, {
      requestId,
      span: name,
      duration: Math.round(duration)
    });
    return duration;
  };
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Add request context headers to a response
 */
export function addContextHeaders(headers: Headers, context?: RequestContext): Headers {
  const ctx = context || currentContext;
  if (!ctx) return headers;

  headers.set('X-Request-ID', ctx.id);

  if (ctx.correlationId) {
    headers.set('X-Correlation-ID', ctx.correlationId);
  }

  const elapsed = ctx ? Math.round(performance.now() - ctx.startTime) : 0;
  headers.set('X-Response-Time', `${elapsed}ms`);

  return headers;
}

/**
 * Create a child context for batch processing
 */
export function createChildContext(parentContext: RequestContext, index: number): RequestContext {
  return {
    id: `${parentContext.id}_${index}`,
    metadata: { ...parentContext.metadata },
    startTime: performance.now(),
    correlationId: parentContext.correlationId || parentContext.id,
    parentId: parentContext.id,
    attributes: {}
  };
}

// ============================================================================
// LOGGING INTEGRATION
// ============================================================================

/**
 * Get logging context from current request
 */
export function getLoggingContext(): Record<string, unknown> {
  if (!currentContext) return {};

  return {
    requestId: currentContext.id,
    method: currentContext.metadata.method,
    path: currentContext.metadata.path,
    ip: currentContext.metadata.ip,
    correlationId: currentContext.correlationId,
    parentId: currentContext.parentId,
    elapsed: Math.round(getElapsedTime())
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
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
  getLoggingContext
};

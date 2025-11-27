/**
 * Server Middleware for Obsidianize Web TUI Interface
 * Provides CORS, rate limiting, logging, and error handling
 *
 * Version: 1.0.0
 */

import { rateLimiter, type RateLimitResult } from '../../core/rate-limit/rate-limiter.js';
import { createLogger } from '../../core/logging/index.js';
import { getErrorMessage, getErrorCode, isObsidianizeError } from '../../core/errors/index.js';
import { HTTP_STATUS } from '../../core/constants/index.js';

const logger = createLogger('middleware');

// ============================================================================
// CORS MIDDLEWARE
// ============================================================================

export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

const DEFAULT_CORS_CONFIG: CORSConfig = {
  allowedOrigins: ['*'], // In production, use specific origins
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Job-Id', 'X-Processing-Duration', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
  credentials: false
};

/**
 * CORS middleware
 * Adds appropriate CORS headers to responses
 */
export function createCORSMiddleware(config: Partial<CORSConfig> = {}) {
  const corsConfig = { ...DEFAULT_CORS_CONFIG, ...config };

  return (req: Request, res: Response): Response => {
    const origin = req.headers.get('Origin') || '*';
    const requestMethod = req.headers.get('Access-Control-Request-Method');

    // Check if origin is allowed
    const allowedOrigin = corsConfig.allowedOrigins.includes('*')
      ? '*'
      : corsConfig.allowedOrigins.includes(origin)
        ? origin
        : corsConfig.allowedOrigins[0];

    // Build CORS headers
    const headers = new Headers(res.headers);
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
    headers.set('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '));
    headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
    headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
    headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString());

    if (corsConfig.credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: HTTP_STATUS.NO_CONTENT,
        headers
      });
    }

    // Return response with CORS headers
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers
    });
  };
}

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

/**
 * Extract user identifier from request
 * Uses IP address as fallback
 */
function getUserId(req: Request): string {
  // Try to get from API key header
  const apiKey = req.headers.get('X-API-Key') || req.headers.get('Authorization');
  if (apiKey) {
    // Use hash of API key as user ID
    return `api_${hashString(apiKey)}`;
  }

  // Use IP address as fallback
  const ip = req.headers.get('X-Forwarded-For')?.split(',')[0] ||
             req.headers.get('X-Real-IP') ||
             'unknown';
  return `ip_${ip}`;
}

/**
 * Simple hash function for API keys
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Rate limiting middleware
 * Checks both user and global rate limits
 */
export async function rateLimitMiddleware(req: Request): Promise<Response | null> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Skip rate limiting for health check
    if (path === '/api/health') {
      return null;
    }

    // Determine action based on path
    let action = 'api_request';
    let tokens = 1;

    if (path === '/api/process') {
      action = 'ai_request';
      tokens = 10; // Processing requests cost more
    } else if (path.startsWith('/api/download')) {
      action = 'file_read';
      tokens = 2;
    }

    // Get user ID
    const userId = getUserId(req);

    // Check rate limits
    const result = await rateLimiter.checkBothLimits(userId, action, tokens);

    // If rate limited, return 429 response
    if (!result.allowed) {
      const limitedBy = result.user.exceeded ? 'user' : 'global';
      const limitResult = limitedBy === 'user' ? result.user : result.global;

      logger.warn(`Rate limit exceeded for ${userId}`, {
        limitedBy,
        tier: limitResult.tier,
        retryAfter: limitResult.retryAfter
      });

      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          limitedBy,
          tier: limitResult.tier,
          retryAfter: limitResult.retryAfter,
          resetTime: new Date(limitResult.resetTime).toISOString()
        }),
        {
          status: HTTP_STATUS.TOO_MANY_REQUESTS,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': (limitResult.retryAfter || 60).toString(),
            'X-RateLimit-Limit': limitResult.tier,
            'X-RateLimit-Remaining': limitResult.tokensRemaining.toString(),
            'X-RateLimit-Reset': new Date(limitResult.resetTime).toISOString()
          }
        }
      );
    }

    // Rate limit passed - add headers to track limits
    // We'll add these in the response wrapper
    (req as any).__rateLimitInfo = {
      tokensRemaining: result.user.tokensRemaining,
      resetTime: result.user.resetTime,
      tier: result.user.tier
    };

    return null; // Continue to next middleware
  } catch (error) {
    logger.error('Rate limit middleware error', error);
    // Fail open - don't block requests on rate limiter errors
    return null;
  }
}

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================

/**
 * Request logging middleware
 * Logs all incoming requests and responses
 */
export function createLoggingMiddleware() {
  return async (req: Request, handler: (req: Request) => Promise<Response>): Promise<Response> => {
    const startTime = performance.now();
    const requestId = crypto.randomUUID();
    const url = new URL(req.url);

    // Log incoming request
    logger.info('Incoming request', {
      requestId,
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      userAgent: req.headers.get('User-Agent'),
      ip: req.headers.get('X-Forwarded-For') || req.headers.get('X-Real-IP')
    });

    try {
      // Execute handler
      const response = await handler(req);
      const duration = performance.now() - startTime;

      // Log response
      logger.info('Request completed', {
        requestId,
        method: req.method,
        path: url.pathname,
        status: response.status,
        duration: Math.round(duration)
      });

      // Add request ID and timing headers
      const headers = new Headers(response.headers);
      headers.set('X-Request-ID', requestId);
      headers.set('X-Response-Time', `${Math.round(duration)}ms`);

      // Add rate limit info if available
      const rateLimitInfo = (req as any).__rateLimitInfo;
      if (rateLimitInfo) {
        headers.set('X-RateLimit-Remaining', rateLimitInfo.tokensRemaining.toString());
        headers.set('X-RateLimit-Reset', new Date(rateLimitInfo.resetTime).toISOString());
        headers.set('X-RateLimit-Tier', rateLimitInfo.tier);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      const duration = performance.now() - startTime;

      // Log error
      logger.error('Request failed', error, {
        requestId,
        method: req.method,
        path: url.pathname,
        duration: Math.round(duration)
      });

      throw error;
    }
  };
}

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Global error handler
 * Catches all unhandled errors and returns appropriate responses
 */
export function createErrorHandler() {
  return (error: unknown): Response => {
    // Log error
    logger.error('Unhandled error', error);

    // Determine status code
    let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: any = undefined;

    if (isObsidianizeError(error)) {
      // Map error categories to HTTP status codes
      const errorCategoryMap: Record<string, number> = {
        validation: HTTP_STATUS.BAD_REQUEST,
        network: HTTP_STATUS.BAD_REQUEST,
        auth: HTTP_STATUS.UNAUTHORIZED,
        rate_limit: HTTP_STATUS.TOO_MANY_REQUESTS,
        processing: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ai_api: HTTP_STATUS.SERVICE_UNAVAILABLE,
        config: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        system: HTTP_STATUS.INTERNAL_SERVER_ERROR
      };

      status = errorCategoryMap[error.category] || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      code = error.code;
      message = error.getUserMessage();
      details = error.details;
    } else if (error instanceof Error) {
      message = error.message;
      code = error.name;
    }

    // Build error response
    const errorResponse: any = {
      error: message,
      code,
      timestamp: new Date().toISOString()
    };

    if (details && process.env.NODE_ENV !== 'production') {
      errorResponse.details = details;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      errorResponse.stack = error.stack;
    }

    return new Response(JSON.stringify(errorResponse), {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  };
}

// ============================================================================
// API KEY VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validate API key from request body (for POST requests)
 */
export async function validateApiKeyMiddleware(req: Request): Promise<Response | null> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Only validate for /api/process
    if (path !== '/api/process' || req.method !== 'POST') {
      return null;
    }

    // We'll validate in the route handler since we need the body
    // This middleware is a placeholder for future enhancements
    return null;
  } catch (error) {
    logger.error('API key validation error', error);
    return null;
  }
}

// ============================================================================
// MIDDLEWARE CHAIN
// ============================================================================

/**
 * Apply all middleware to a request
 */
export async function applyMiddleware(
  req: Request,
  handler: (req: Request) => Promise<Response>
): Promise<Response> {
  try {
    // 1. Rate limiting
    const rateLimitResponse = await rateLimitMiddleware(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. API key validation (placeholder)
    const apiKeyResponse = await validateApiKeyMiddleware(req);
    if (apiKeyResponse) {
      return apiKeyResponse;
    }

    // 3. Logging wrapper
    const loggingMiddleware = createLoggingMiddleware();
    let response = await loggingMiddleware(req, handler);

    // 4. CORS headers
    const corsMiddleware = createCORSMiddleware();
    response = corsMiddleware(req, response);

    return response;
  } catch (error) {
    // 5. Error handling
    const errorHandler = createErrorHandler();
    return errorHandler(error);
  }
}

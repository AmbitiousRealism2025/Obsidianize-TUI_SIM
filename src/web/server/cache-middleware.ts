/**
 * Response Caching Middleware
 * Caches API responses for repeated URL requests
 *
 * Phase 3: Performance Optimization Feature
 * Version: 1.0.0
 */

import { createLogger } from '../../core/logging/index.js';
import { TIME, SIZE, HTTP_STATUS } from '../../core/constants/index.js';
import { getConfig } from '../../core/config/index.js';

const logger = createLogger('cache-middleware');

// ============================================================================
// TYPES
// ============================================================================

interface CachedResponse {
  body: string;
  status: number;
  headers: Record<string, string>;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  size: number;
  hitRate: number;
}

// ============================================================================
// URL RESPONSE CACHE
// ============================================================================

/**
 * In-memory response cache for URL processing results
 */
class ResponseCache {
  private cache = new Map<string, CachedResponse>();
  private stats = { hits: 0, misses: 0 };
  private maxSize: number;
  private maxEntries: number;
  private defaultTTL: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options?: {
    maxSize?: number;
    maxEntries?: number;
    defaultTTL?: number;
    cleanupInterval?: number;
  }) {
    this.maxSize = options?.maxSize || SIZE.DEFAULT_CACHE_MAX_SIZE;
    this.maxEntries = options?.maxEntries || SIZE.MAX_CACHE_ENTRIES;
    this.defaultTTL = options?.defaultTTL || TIME.DEFAULT_CACHE_TTL;

    // Start cleanup interval
    const interval = options?.cleanupInterval || TIME.CACHE_CLEANUP_INTERVAL;
    this.cleanupInterval = setInterval(() => this.cleanup(), interval);
  }

  /**
   * Generate cache key from URL and options
   */
  generateKey(url: string, options?: Record<string, unknown>): string {
    const normalizedUrl = url.toLowerCase().trim();
    const optionsHash = options ? JSON.stringify(options) : '';
    return `url:${normalizedUrl}:${optionsHash}`;
  }

  /**
   * Get cached response
   */
  get(key: string): CachedResponse | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hit count
    entry.hits++;
    this.stats.hits++;

    logger.debug('Cache hit', { key, hits: entry.hits });
    return entry;
  }

  /**
   * Set cached response
   */
  set(
    key: string,
    body: string,
    status: number,
    headers: Record<string, string>,
    ttl?: number
  ): void {
    const size = Buffer.byteLength(body, 'utf8');

    // Evict if necessary
    this.evictIfNeeded(size);

    const entry: CachedResponse = {
      body,
      status,
      headers,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
      size
    };

    this.cache.set(key, entry);
    logger.debug('Cache set', { key, size, ttl: entry.ttl });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete cached entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      size: totalSize,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug('Cache cleanup', { removed, remaining: this.cache.size });
    }
  }

  /**
   * Evict entries if cache is full
   */
  private evictIfNeeded(newSize: number): void {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    // Evict until we have room
    while (
      (this.cache.size >= this.maxEntries || totalSize + newSize > this.maxSize) &&
      this.cache.size > 0
    ) {
      // Find LRU entry (oldest with fewest hits)
      let lruKey: string | null = null;
      let lruScore = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        // Score = timestamp + (hits * 1000) - lower is more likely to evict
        const score = entry.timestamp + entry.hits * 1000;
        if (score < lruScore) {
          lruScore = score;
          lruKey = key;
        }
      }

      if (lruKey) {
        const entry = this.cache.get(lruKey);
        if (entry) {
          totalSize -= entry.size;
        }
        this.cache.delete(lruKey);
        logger.debug('Cache eviction', { key: lruKey });
      } else {
        break;
      }
    }
  }

  /**
   * Close the cache and cleanup
   */
  close(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let responseCacheInstance: ResponseCache | null = null;

/**
 * Get the response cache instance
 */
export function getResponseCache(): ResponseCache {
  if (!responseCacheInstance) {
    const config = getConfig();
    responseCacheInstance = new ResponseCache({
      maxSize: config.cache.maxSize,
      maxEntries: config.cache.maxEntries,
      defaultTTL: config.cache.ttl,
      cleanupInterval: config.cache.cleanupInterval
    });
  }
  return responseCacheInstance;
}

/**
 * Reset the response cache (for testing)
 */
export function resetResponseCache(): void {
  if (responseCacheInstance) {
    responseCacheInstance.close();
    responseCacheInstance = null;
  }
}

// ============================================================================
// CACHE MIDDLEWARE
// ============================================================================

/**
 * List of cacheable paths
 */
const CACHEABLE_PATHS = ['/api/download/', '/api/export/', '/api/batch/'];

/**
 * Check if request should be cached
 */
function shouldCache(req: Request): boolean {
  const config = getConfig();
  if (!config.cache.enabled) return false;

  // Only cache GET requests
  if (req.method !== 'GET') return false;

  const url = new URL(req.url);
  const path = url.pathname;

  // Check if path is cacheable
  return CACHEABLE_PATHS.some((prefix) => path.startsWith(prefix));
}

/**
 * Generate cache key from request
 */
function getCacheKey(req: Request): string {
  const url = new URL(req.url);
  return `${req.method}:${url.pathname}:${url.search}`;
}

/**
 * Response caching middleware
 */
export async function responseCacheMiddleware(
  req: Request,
  handler: (req: Request) => Promise<Response>
): Promise<Response> {
  // Check if caching is applicable
  if (!shouldCache(req)) {
    return handler(req);
  }

  const cache = getResponseCache();
  const key = getCacheKey(req);

  // Check cache
  const cached = cache.get(key);
  if (cached) {
    logger.debug('Serving from cache', { path: new URL(req.url).pathname });

    const headers = new Headers(cached.headers);
    headers.set('X-Cache', 'HIT');
    headers.set('X-Cache-Age', String(Math.round((Date.now() - cached.timestamp) / 1000)));

    return new Response(cached.body, {
      status: cached.status,
      headers
    });
  }

  // Execute handler
  const response = await handler(req);

  // Cache successful responses
  if (response.ok) {
    try {
      const body = await response.text();
      const headers: Record<string, string> = {};

      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Determine TTL based on response type
      let ttl = TIME.DEFAULT_CACHE_TTL;
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        ttl = TIME.SHORT_CACHE_TTL; // 5 minutes for JSON
      }

      cache.set(key, body, response.status, headers, ttl);

      // Return new response with cache headers
      const newHeaders = new Headers(headers);
      newHeaders.set('X-Cache', 'MISS');

      return new Response(body, {
        status: response.status,
        headers: newHeaders
      });
    } catch (error) {
      logger.warn('Failed to cache response', { error });
    }
  }

  return response;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ResponseCache };
export type { CachedResponse, CacheStats };

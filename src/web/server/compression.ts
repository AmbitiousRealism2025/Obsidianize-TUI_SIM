/**
 * Response Compression Middleware
 * Provides gzip/deflate compression for API responses
 *
 * Phase 3: Performance Optimization Feature
 * Version: 1.0.0
 */

import { createLogger } from '../../core/logging/index.js';
import { SIZE } from '../../core/constants/index.js';
import { getConfig } from '../../core/config/index.js';

const logger = createLogger('compression');

// ============================================================================
// TYPES
// ============================================================================

type CompressionEncoding = 'gzip' | 'deflate' | 'br' | 'identity';

interface CompressionStats {
  totalRequests: number;
  compressedRequests: number;
  originalSize: number;
  compressedSize: number;
  averageRatio: number;
}

// ============================================================================
// COMPRESSION UTILITIES
// ============================================================================

/**
 * Check if the request accepts compression
 */
function getAcceptedEncoding(req: Request): CompressionEncoding {
  const acceptEncoding = req.headers.get('Accept-Encoding') || '';

  // Check for gzip first (most common)
  if (acceptEncoding.includes('gzip')) {
    return 'gzip';
  }

  // Check for deflate
  if (acceptEncoding.includes('deflate')) {
    return 'deflate';
  }

  // No compression supported
  return 'identity';
}

/**
 * Check if content type should be compressed
 */
function shouldCompress(contentType: string | null): boolean {
  if (!contentType) return false;

  const compressibleTypes = [
    'application/json',
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'text/markdown',
    'text/yaml',
    'application/xml',
    'text/xml'
  ];

  return compressibleTypes.some((type) => contentType.includes(type));
}

/**
 * Compress data using gzip
 */
async function compressGzip(data: Uint8Array): Promise<Uint8Array> {
  // Use Bun's built-in compression
  const compressed = Bun.gzipSync(data);
  return new Uint8Array(compressed);
}

/**
 * Compress data using deflate
 */
async function compressDeflate(data: Uint8Array): Promise<Uint8Array> {
  // Use Bun's built-in compression
  const compressed = Bun.deflateSync(data);
  return new Uint8Array(compressed);
}

// ============================================================================
// COMPRESSION MIDDLEWARE
// ============================================================================

/** Compression statistics */
const stats: CompressionStats = {
  totalRequests: 0,
  compressedRequests: 0,
  originalSize: 0,
  compressedSize: 0,
  averageRatio: 0
};

/**
 * Get compression statistics
 */
export function getCompressionStats(): CompressionStats {
  return {
    ...stats,
    averageRatio:
      stats.originalSize > 0 ? stats.compressedSize / stats.originalSize : 1
  };
}

/**
 * Reset compression statistics (for testing)
 */
export function resetCompressionStats(): void {
  stats.totalRequests = 0;
  stats.compressedRequests = 0;
  stats.originalSize = 0;
  stats.compressedSize = 0;
  stats.averageRatio = 0;
}

/**
 * Compression middleware
 * Compresses responses based on Accept-Encoding header
 */
export async function compressionMiddleware(
  req: Request,
  handler: (req: Request) => Promise<Response>
): Promise<Response> {
  const config = getConfig();
  stats.totalRequests++;

  // Execute handler first
  const response = await handler(req);

  // Skip compression if disabled
  if (!config.cache.compressionEnabled) {
    return response;
  }

  // Check if client accepts compression
  const encoding = getAcceptedEncoding(req);
  if (encoding === 'identity') {
    return response;
  }

  // Check content type
  const contentType = response.headers.get('Content-Type');
  if (!shouldCompress(contentType)) {
    return response;
  }

  // Don't compress small responses
  const contentLength = response.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength, 10) < config.cache.compressionThreshold) {
    return response;
  }

  try {
    // Get response body
    const body = await response.arrayBuffer();
    const originalSize = body.byteLength;

    // Skip if too small
    if (originalSize < config.cache.compressionThreshold) {
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }

    // Compress
    const data = new Uint8Array(body);
    let compressed: Uint8Array;

    if (encoding === 'gzip') {
      compressed = await compressGzip(data);
    } else if (encoding === 'deflate') {
      compressed = await compressDeflate(data);
    } else {
      // Shouldn't happen, but fallback
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }

    const compressedSize = compressed.byteLength;

    // Only use compression if it actually saves space
    if (compressedSize >= originalSize) {
      logger.debug('Compression skipped (no size reduction)', {
        original: originalSize,
        compressed: compressedSize
      });
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }

    // Update stats
    stats.compressedRequests++;
    stats.originalSize += originalSize;
    stats.compressedSize += compressedSize;
    stats.averageRatio = stats.compressedSize / stats.originalSize;

    // Build new headers
    const headers = new Headers(response.headers);
    headers.set('Content-Encoding', encoding);
    headers.set('Content-Length', compressedSize.toString());
    headers.set('Vary', 'Accept-Encoding');
    headers.set('X-Original-Size', originalSize.toString());
    headers.set('X-Compression-Ratio', (compressedSize / originalSize).toFixed(2));

    logger.debug('Response compressed', {
      encoding,
      original: originalSize,
      compressed: compressedSize,
      ratio: (compressedSize / originalSize).toFixed(2)
    });

    return new Response(compressed, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (error) {
    // If compression fails, return original response
    logger.warn('Compression failed', { error });
    return response;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { CompressionEncoding, CompressionStats };

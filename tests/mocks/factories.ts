/**
 * Central Mock Factories for Testing Infrastructure
 * Provides configurable mocks for all major system components
 *
 * Usage:
 *   const mockGemini = GeminiMockFactory.createSuccess({ text: "Mock response" });
 *   const mockNetwork = NetworkMockFactory.createHTTPResponse({ status: 200, data: {...} });
 *
 * Version: 1.0.0
 */

import type {
  GenerationRequest,
  GenerationResponse,
  GeminiError,
  GeminiConfig,
} from '../../src/core/ai/gemini-client.js';
import type {
  ContentType,
  ProcessingStatus,
  GeminiGem,
  GeminiGemFrontmatter,
  GeminiGemContent,
  ProcessingResult,
  ProcessingMetadata,
  ProcessingError,
  ErrorCategory,
} from '../../src/core/types/index.js';
import type { CacheEntry } from '../../src/core/cache/cache.js';
import type { RateLimitResult } from '../../src/core/rate-limit/rate-limiter.js';

// ============================================================================
// GEMINI API MOCK FACTORY
// ============================================================================

export interface GeminiMockConfig {
  shouldSucceed?: boolean;
  delay?: number;
  errorType?: 'timeout' | 'rate_limit' | 'auth' | 'network' | 'content_policy';
  customError?: GeminiError;
  responseText?: string;
  tokensUsed?: number;
}

/**
 * Factory for creating mock Gemini API responses
 */
export class GeminiMockFactory {
  /**
   * Create a successful Gemini response
   */
  static createSuccess(config: {
    text?: string;
    promptTokens?: number;
    completionTokens?: number;
    model?: string;
  } = {}): GenerationResponse {
    const promptTokens = config.promptTokens ?? 100;
    const completionTokens = config.completionTokens ?? 200;

    return {
      text: config.text ?? 'Mock Gemini response',
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      model: config.model ?? 'gemini-1.5-flash',
      timestamp: new Date(),
    };
  }

  /**
   * Create a failed Gemini response
   */
  static createError(errorType: GeminiMockConfig['errorType'] = 'network'): GeminiError {
    const errorMap: Record<string, GeminiError> = {
      timeout: {
        code: 'TIMEOUT',
        message: 'Request timeout',
        status: 408,
        details: 'The request took too long to complete',
      },
      rate_limit: {
        code: 'RATE_LIMIT',
        message: 'Rate limit exceeded. Please try again later.',
        status: 429,
        details: 'Too many requests in a short period',
      },
      auth: {
        code: 'AUTHENTICATION',
        message: 'Authentication failed',
        status: 401,
        details: 'Invalid or missing API key',
      },
      network: {
        code: 'HTTP_500',
        message: 'Internal server error',
        status: 500,
        details: 'Network error occurred',
      },
      content_policy: {
        code: 'CONTENT_POLICY',
        message: 'Content generation blocked by policy',
        status: 400,
        details: 'Content violates policy guidelines',
      },
    };

    return errorMap[errorType] ?? errorMap.network;
  }

  /**
   * Create a mock Gemini client with configurable behavior
   */
  static createMockClient(config: GeminiMockConfig = {}) {
    const shouldSucceed = config.shouldSucceed ?? true;
    const delay = config.delay ?? 0;

    return {
      async generateContent(request: GenerationRequest): Promise<GenerationResponse> {
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        if (!shouldSucceed) {
          throw config.customError ?? GeminiMockFactory.createError(config.errorType);
        }

        return GeminiMockFactory.createSuccess({
          text: config.responseText,
          promptTokens: config.tokensUsed,
        });
      },

      async generateContentStream(request: GenerationRequest): Promise<AsyncIterable<string>> {
        if (!shouldSucceed) {
          throw config.customError ?? GeminiMockFactory.createError(config.errorType);
        }

        const text = config.responseText ?? 'Mock streaming response';
        const chunks = text.split(' ');

        return (async function* () {
          for (const chunk of chunks) {
            if (delay > 0) {
              await new Promise(resolve => setTimeout(resolve, delay / chunks.length));
            }
            yield chunk + ' ';
          }
        })();
      },

      async healthCheck(): Promise<boolean> {
        return shouldSucceed;
      },

      getModelInfo() {
        return {
          model: 'gemini-1.5-flash',
          temperature: 0.7,
          maxOutputTokens: 2048,
        };
      },
    };
  }

  /**
   * Create a mock Gemini Gem (complete processed content)
   */
  static createMockGem(overrides: Partial<GeminiGem> = {}): GeminiGem {
    const defaultFrontmatter: GeminiGemFrontmatter = {
      title: 'Mock Content Title',
      source: 'https://example.com/mock-content',
      type: 'article' as ContentType,
      processed: new Date(),
      tags: ['test', 'mock', 'example'],
      entities: [
        {
          text: 'Mock Entity',
          type: 'concept' as any,
          confidence: 0.95,
          context: 'This is a mock entity for testing',
        },
      ],
      insights: ['Mock insight 1', 'Mock insight 2'],
      metadata: {
        mockData: true,
        testEnvironment: 'vitest',
      },
      confidence: 0.9,
      processingTime: 1500,
    };

    const defaultContent: GeminiGemContent = {
      summary: 'This is a mock summary for testing purposes',
      keyPoints: [
        'Key point 1: Mock data structure',
        'Key point 2: Testing utilities',
        'Key point 3: Comprehensive coverage',
      ],
      sections: [
        {
          id: 'intro',
          heading: 'Introduction',
          content: 'This is the introduction section',
          type: 'introduction' as any,
          order: 1,
        },
        {
          id: 'main',
          heading: 'Main Content',
          content: 'This is the main content section',
          type: 'analysis' as any,
          order: 2,
        },
      ],
      analysis: 'Mock analysis content for testing',
      transcript: 'Mock transcript text',
      relatedResources: [
        {
          title: 'Related Resource 1',
          url: 'https://example.com/resource1',
          type: 'article' as ContentType,
          relevance: 0.85,
          description: 'A related resource for testing',
        },
      ],
    };

    return {
      frontmatter: { ...defaultFrontmatter, ...overrides.frontmatter },
      content: { ...defaultContent, ...overrides.content },
    };
  }
}

// ============================================================================
// NETWORK MOCK FACTORY
// ============================================================================

export interface NetworkMockConfig {
  shouldSucceed?: boolean;
  status?: number;
  delay?: number;
  errorType?: 'timeout' | 'dns' | 'connection' | 'ssl';
  customError?: Error;
}

/**
 * Factory for creating mock HTTP/network responses
 */
export class NetworkMockFactory {
  /**
   * Create a successful HTTP response
   */
  static createHTTPResponse<T = any>(config: {
    status?: number;
    statusText?: string;
    data?: T;
    headers?: Record<string, string>;
  } = {}): {
    status: number;
    statusText: string;
    data: T;
    headers: Record<string, string>;
    config: {};
  } {
    return {
      status: config.status ?? 200,
      statusText: config.statusText ?? 'OK',
      data: (config.data ?? { success: true }) as T,
      headers: config.headers ?? {
        'content-type': 'application/json',
      },
      config: {},
    };
  }

  /**
   * Create a network error
   */
  static createError(errorType: NetworkMockConfig['errorType'] = 'connection'): Error {
    const errorMap: Record<string, Error> = {
      timeout: new Error('Request timeout after 30000ms'),
      dns: new Error('DNS lookup failed: ENOTFOUND'),
      connection: new Error('Connection refused: ECONNREFUSED'),
      ssl: new Error('SSL certificate validation failed'),
    };

    return errorMap[errorType] ?? errorMap.connection;
  }

  /**
   * Create a mock fetch function
   */
  static createMockFetch(config: NetworkMockConfig = {}) {
    const shouldSucceed = config.shouldSucceed ?? true;
    const delay = config.delay ?? 0;

    return async (url: string, options?: any): Promise<any> => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (!shouldSucceed) {
        throw config.customError ?? NetworkMockFactory.createError(config.errorType);
      }

      const status = config.status ?? 200;
      const body = JSON.stringify({ url, options, mock: true });

      return {
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        headers: new Map([['content-type', 'application/json']]),
        json: async () => JSON.parse(body),
        text: async () => body,
        blob: async () => new Blob([body]),
        arrayBuffer: async () => new TextEncoder().encode(body).buffer,
      };
    };
  }

  /**
   * Create mock web content (for scraping tests)
   */
  static createMockWebContent(config: {
    title?: string;
    content?: string;
    metadata?: Record<string, any>;
  } = {}) {
    return {
      title: config.title ?? 'Mock Web Page',
      content: config.content ?? '<html><body><h1>Mock Content</h1><p>This is mock web content for testing.</p></body></html>',
      metadata: config.metadata ?? {
        description: 'Mock page description',
        keywords: ['mock', 'test'],
        author: 'Test Author',
      },
    };
  }
}

// ============================================================================
// FILE SYSTEM MOCK FACTORY
// ============================================================================

export interface FileSystemMockConfig {
  shouldSucceed?: boolean;
  delay?: number;
  errorType?: 'not_found' | 'permission' | 'disk_full' | 'lock';
}

/**
 * Factory for creating mock file system operations
 */
export class FileSystemMockFactory {
  /**
   * Create mock file content
   */
  static createMockFile(config: {
    path?: string;
    content?: string;
    size?: number;
    created?: Date;
    modified?: Date;
  } = {}) {
    const content = config.content ?? 'Mock file content';

    return {
      path: config.path ?? '/mock/path/file.txt',
      content,
      size: config.size ?? content.length,
      created: config.created ?? new Date(),
      modified: config.modified ?? new Date(),
      exists: true,
      isDirectory: false,
      isFile: true,
    };
  }

  /**
   * Create file system error
   */
  static createError(errorType: FileSystemMockConfig['errorType'] = 'not_found'): Error {
    const errorMap: Record<string, Error> = {
      not_found: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      permission: Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }),
      disk_full: Object.assign(new Error('ENOSPC: no space left on device'), { code: 'ENOSPC' }),
      lock: Object.assign(new Error('EBUSY: resource busy or locked'), { code: 'EBUSY' }),
    };

    return errorMap[errorType] ?? errorMap.not_found;
  }

  /**
   * Create mock file operations
   */
  static createMockFileOps(config: FileSystemMockConfig = {}) {
    const shouldSucceed = config.shouldSucceed ?? true;
    const delay = config.delay ?? 0;
    const files = new Map<string, any>();

    return {
      async writeFile(path: string, content: string): Promise<void> {
        if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));

        if (!shouldSucceed) {
          throw FileSystemMockFactory.createError(config.errorType);
        }

        files.set(path, { content, modified: new Date() });
      },

      async readFile(path: string): Promise<string> {
        if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));

        if (!shouldSucceed) {
          throw FileSystemMockFactory.createError(config.errorType ?? 'not_found');
        }

        const file = files.get(path);
        if (!file) {
          throw FileSystemMockFactory.createError('not_found');
        }

        return file.content;
      },

      async deleteFile(path: string): Promise<void> {
        if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));

        if (!shouldSucceed) {
          throw FileSystemMockFactory.createError(config.errorType);
        }

        files.delete(path);
      },

      async exists(path: string): Promise<boolean> {
        return files.has(path);
      },

      async mkdir(path: string): Promise<void> {
        if (!shouldSucceed) {
          throw FileSystemMockFactory.createError(config.errorType);
        }
        files.set(path, { isDirectory: true });
      },

      // Add file to mock storage for testing
      _addFile(path: string, content: string): void {
        files.set(path, { content, modified: new Date() });
      },

      // Clear all files
      _clear(): void {
        files.clear();
      },
    };
  }
}

// ============================================================================
// DATABASE/CACHE MOCK FACTORY
// ============================================================================

export interface DatabaseMockConfig {
  shouldSucceed?: boolean;
  delay?: number;
  errorType?: 'connection' | 'query' | 'constraint';
}

/**
 * Factory for creating mock database/SQLite operations
 */
export class DatabaseMockFactory {
  /**
   * Create mock cache entry
   */
  static createCacheEntry<T = any>(config: {
    key?: string;
    value?: T;
    ttl?: number;
    accessCount?: number;
  } = {}): CacheEntry<T> {
    const now = Date.now();
    const ttl = config.ttl ?? 3600000; // 1 hour default

    return {
      key: config.key ?? 'mock:cache:key',
      value: config.value ?? { mock: true } as T,
      expiresAt: now + ttl,
      createdAt: now,
      accessCount: config.accessCount ?? 1,
      lastAccessed: now,
      size: JSON.stringify(config.value ?? {}).length,
      compressed: false,
    };
  }

  /**
   * Create mock rate limit result
   */
  static createRateLimitResult(config: {
    allowed?: boolean;
    tokensRemaining?: number;
    tier?: string;
  } = {}): RateLimitResult {
    const allowed = config.allowed ?? true;

    return {
      allowed,
      tokensRemaining: config.tokensRemaining ?? (allowed ? 100 : 0),
      resetTime: Date.now() + 60000,
      retryAfter: allowed ? undefined : 60,
      tier: config.tier ?? 'user',
      exceeded: !allowed,
    };
  }

  /**
   * Create database error
   */
  static createError(errorType: DatabaseMockConfig['errorType'] = 'query'): Error {
    const errorMap: Record<string, Error> = {
      connection: new Error('Database connection failed'),
      query: new Error('SQL query execution failed'),
      constraint: new Error('UNIQUE constraint failed'),
    };

    return errorMap[errorType] ?? errorMap.query;
  }

  /**
   * Create mock cache
   */
  static createMockCache(config: DatabaseMockConfig = {}) {
    const shouldSucceed = config.shouldSucceed ?? true;
    const delay = config.delay ?? 0;
    const storage = new Map<string, any>();

    return {
      async get<T>(namespace: string, identifier: string, params?: Record<string, any>): Promise<T | null> {
        if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));

        if (!shouldSucceed) {
          throw DatabaseMockFactory.createError(config.errorType);
        }

        const key = `${namespace}:${identifier}:${JSON.stringify(params ?? {})}`;
        const entry = storage.get(key);

        if (!entry) return null;
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
          storage.delete(key);
          return null;
        }

        return entry.value as T;
      },

      async set<T>(namespace: string, identifier: string, value: T, ttl?: number, params?: Record<string, any>): Promise<void> {
        if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));

        if (!shouldSucceed) {
          throw DatabaseMockFactory.createError(config.errorType);
        }

        const key = `${namespace}:${identifier}:${JSON.stringify(params ?? {})}`;
        const now = Date.now();

        storage.set(key, {
          value,
          expiresAt: ttl ? now + ttl : now + 3600000,
          createdAt: now,
        });
      },

      async delete(namespace: string, identifier: string, params?: Record<string, any>): Promise<boolean> {
        if (!shouldSucceed) {
          throw DatabaseMockFactory.createError(config.errorType);
        }

        const key = `${namespace}:${identifier}:${JSON.stringify(params ?? {})}`;
        return storage.delete(key);
      },

      async clear(namespace?: string): Promise<void> {
        if (!shouldSucceed) {
          throw DatabaseMockFactory.createError(config.errorType);
        }

        if (namespace) {
          for (const key of storage.keys()) {
            if (key.startsWith(`${namespace}:`)) {
              storage.delete(key);
            }
          }
        } else {
          storage.clear();
        }
      },

      getStats() {
        return {
          totalEntries: storage.size,
          totalSize: 0,
          hitRate: 0.75,
          totalHits: 100,
          totalMisses: 25,
          evictions: 0,
          compressions: 0,
          averageAccessTime: 2.5,
        };
      },

      close() {
        storage.clear();
      },

      // Test helper
      _getStorage() {
        return storage;
      },
    };
  }

  /**
   * Create mock rate limiter
   */
  static createMockRateLimiter(config: DatabaseMockConfig = {}) {
    const shouldSucceed = config.shouldSucceed ?? true;
    const limits = new Map<string, { tokens: number; resetTime: number }>();

    return {
      async checkRateLimit(userId: string, action: string, tokensRequested: number = 1): Promise<RateLimitResult> {
        if (!shouldSucceed) {
          throw DatabaseMockFactory.createError(config.errorType);
        }

        const key = `${userId}:${action}`;
        const now = Date.now();
        let limit = limits.get(key);

        if (!limit || limit.resetTime < now) {
          limit = { tokens: 1000, resetTime: now + 60000 };
          limits.set(key, limit);
        }

        const allowed = limit.tokens >= tokensRequested;

        if (allowed) {
          limit.tokens -= tokensRequested;
        }

        return DatabaseMockFactory.createRateLimitResult({
          allowed,
          tokensRemaining: limit.tokens,
        });
      },

      async checkGlobalRateLimit(action: string, tokensRequested: number = 1): Promise<RateLimitResult> {
        return DatabaseMockFactory.createRateLimitResult({ allowed: true });
      },

      close() {
        limits.clear();
      },
    };
  }
}

// ============================================================================
// PROCESSING RESULT MOCK FACTORY
// ============================================================================

/**
 * Factory for creating mock processing results
 */
export class ProcessingMockFactory {
  /**
   * Create a successful processing result
   */
  static createSuccess(gem?: Partial<GeminiGem>): ProcessingResult {
    return {
      success: true,
      data: GeminiMockFactory.createMockGem(gem),
      metadata: ProcessingMockFactory.createMetadata(),
    };
  }

  /**
   * Create a failed processing result
   */
  static createFailure(error?: Partial<ProcessingError>): ProcessingResult {
    return {
      success: false,
      error: ProcessingMockFactory.createError(error),
      metadata: ProcessingMockFactory.createMetadata({ duration: 500 }),
    };
  }

  /**
   * Create mock processing metadata
   */
  static createMetadata(overrides: Partial<ProcessingMetadata> = {}): ProcessingMetadata {
    const startTime = new Date();
    const duration = overrides.duration ?? 2500;
    const endTime = new Date(startTime.getTime() + duration);

    return {
      startTime,
      endTime,
      duration,
      sourceUrl: overrides.sourceUrl ?? 'https://example.com/content',
      contentType: overrides.contentType ?? ('article' as ContentType),
      analysisMode: overrides.analysisMode ?? ('standard' as any),
      tokensUsed: overrides.tokensUsed ?? 500,
      stages: overrides.stages ?? [
        {
          name: 'extraction',
          status: 'completed' as ProcessingStatus,
          startTime: startTime,
          endTime: new Date(startTime.getTime() + 1000),
          duration: 1000,
        },
        {
          name: 'analysis',
          status: 'completed' as ProcessingStatus,
          startTime: new Date(startTime.getTime() + 1000),
          endTime: endTime,
          duration: 1500,
        },
      ],
      cacheHit: overrides.cacheHit ?? false,
      retryAttempts: overrides.retryAttempts ?? 0,
    };
  }

  /**
   * Create mock processing error
   */
  static createError(overrides: Partial<ProcessingError> = {}): ProcessingError {
    return {
      category: overrides.category ?? ('processing' as ErrorCategory),
      code: overrides.code ?? 'PROCESSING_FAILED',
      message: overrides.message ?? 'Processing failed due to mock error',
      details: overrides.details ?? { mockError: true },
      suggestion: overrides.suggestion ?? 'Try again with different input',
      recoverable: overrides.recoverable ?? true,
      timestamp: overrides.timestamp ?? new Date(),
      retryCount: overrides.retryCount ?? 0,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const MockFactories = {
  Gemini: GeminiMockFactory,
  Network: NetworkMockFactory,
  FileSystem: FileSystemMockFactory,
  Database: DatabaseMockFactory,
  Processing: ProcessingMockFactory,
};

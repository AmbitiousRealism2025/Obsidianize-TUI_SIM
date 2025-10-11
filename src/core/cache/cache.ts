/**
 * High-performance caching system using Bun's native SQLite
 * Features intelligent cache key generation, TTL management, and compression
 */

import { Database } from "bun:sqlite";
import { performanceMonitor } from "../performance.ts";

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  expiresAt?: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  compressed?: boolean;
}

export interface CacheConfig {
  defaultTTL: number; // Default time-to-live in milliseconds
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  compressionThreshold: number; // Compress entries larger than this size (bytes)
  cleanupInterval: number; // Cleanup interval in milliseconds
  enableCompression: boolean;
  enableStatistics: boolean;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  evictions: number;
  compressions: number;
  averageAccessTime: number;
  oldestEntry?: number;
  newestEntry?: number;
}

class HighPerformanceCache {
  private db: Database;
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private stats: CacheStats;
  private compressionEnabled: boolean;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 3600000, // 1 hour
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 10000,
      compressionThreshold: 1024, // 1KB
      cleanupInterval: 300000, // 5 minutes
      enableCompression: true,
      enableStatistics: true,
      ...config,
    };

    // Initialize SQLite database
    this.db = new Database(":memory:");
    this.setupDatabase();
    this.stats = this.initializeStats();
    this.compressionEnabled = this.config.enableCompression && typeof Bun.gunzipSync === 'function';

    // Start cleanup timer
    this.startCleanupTimer();
  }

  private setupDatabase(): void {
    // Create cache table with optimized indexes
    this.db.run(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value BLOB NOT NULL,
        expires_at INTEGER,
        created_at INTEGER NOT NULL,
        access_count INTEGER DEFAULT 1,
        last_accessed INTEGER NOT NULL,
        size INTEGER NOT NULL,
        compressed INTEGER DEFAULT 0
      )
    `);

    // Create indexes for performance
    this.db.run("CREATE INDEX IF NOT EXISTS idx_expires_at ON cache(expires_at)");
    this.db.run("CREATE INDEX IF NOT EXISTS idx_last_accessed ON cache(last_accessed)");
    this.db.run("CREATE INDEX IF NOT EXISTS idx_access_count ON cache(access_count)");
  }

  private initializeStats(): CacheStats {
    return {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      totalHits: 0,
      totalMisses: 0,
      evictions: 0,
      compressions: 0,
      averageAccessTime: 0,
    };
  }

  /**
   * Generate intelligent cache key
   */
  private generateKey(namespace: string, identifier: string, params?: Record<string, any>): string {
    const baseKey = `${namespace}:${identifier}`;
    if (!params || Object.keys(params).length === 0) {
      return baseKey;
    }

    // Sort params to ensure consistent key generation
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // Create hash of parameters for consistent key length
    const paramHash = Bun.hash(sortedParams);
    return `${baseKey}:${paramHash.toString(36)}`;
  }

  /**
   * Compress data if beneficial
   */
  private async compressData(data: Uint8Array): Promise<{ data: Uint8Array; compressed: boolean }> {
    if (!this.compressionEnabled || data.length < this.config.compressionThreshold) {
      return { data, compressed: false };
    }

    try {
      const compressed = Bun.gzipSync(data as any) as Uint8Array;
      // Only use compression if it actually reduces size
      if (compressed.length < data.length) {
        return { data: new Uint8Array(compressed), compressed: true };
      }
    } catch (error) {
      console.warn('Compression failed:', error);
    }

    return { data, compressed: false };
  }

  /**
   * Decompress data
   */
  private async decompressData(data: Uint8Array, compressed: boolean): Promise<Uint8Array> {
    if (!compressed || !this.compressionEnabled) {
      return data;
    }

    try {
      const decompressed = Bun.gunzipSync(data as any);
      return new Uint8Array(decompressed as any);
    } catch (error) {
      console.warn('Decompression failed:', error);
      return data;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(namespace: string, identifier: string, params?: Record<string, any>): Promise<T | null> {
    const startTime = performance.now();
    const key = this.generateKey(namespace, identifier, params);

    try {
      const query = this.db.query("SELECT * FROM cache WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)");
      const now = Date.now();
      const result = query.get(key, now) as any;

      if (!result) {
        this.stats.totalMisses++;
        this.updateHitRate();
        performanceMonitor.recordCacheAccess(false, performance.now() - startTime);
        return null;
      }

      // Update access statistics
      this.db.run(
        "UPDATE cache SET access_count = access_count + 1, last_accessed = ? WHERE key = ?",
        [now, key]
      );

      // Decompress data if needed
      const decompressedData = await this.decompressData(new Uint8Array(result.value), Boolean(result.compressed));
      const value = JSON.parse(new TextDecoder().decode(decompressedData));

      this.stats.totalHits++;
      this.updateHitRate();
      performanceMonitor.recordCacheAccess(true, performance.now() - startTime);

      return value;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.totalMisses++;
      this.updateHitRate();
      performanceMonitor.recordCacheAccess(false, performance.now() - startTime);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(
    namespace: string,
    identifier: string,
    value: T,
    ttl?: number,
    params?: Record<string, any>
  ): Promise<void> {
    const key = this.generateKey(namespace, identifier, params);
    const now = Date.now();
    const expiresAt = ttl ? now + ttl : now + this.config.defaultTTL;

    try {
      // Serialize value
      const serialized = new TextEncoder().encode(JSON.stringify(value));

      // Compress if beneficial
      const { data: compressedData, compressed } = await this.compressData(serialized);

      // Check if we need to make space
      await this.ensureSpace(compressedData.length);

      // Insert or replace entry
      const insert = this.db.prepare(`
        INSERT OR REPLACE INTO cache
        (key, value, expires_at, created_at, access_count, last_accessed, size, compressed)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?)
      `);

      insert.run(
        key,
        compressedData,
        expiresAt,
        now,
        now,
        compressedData.length,
        compressed ? 1 : 0
      );

      if (compressed) {
        this.stats.compressions++;
      }

      this.updateStats();
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  /**
   * Delete entry from cache
   */
  async delete(namespace: string, identifier: string, params?: Record<string, any>): Promise<boolean> {
    const key = this.generateKey(namespace, identifier, params);

    try {
      const query = this.db.query("DELETE FROM cache WHERE key = ?");
      const result = query.run(key);

      this.updateStats();
      return result.changes > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Clear all entries or entries in a namespace
   */
  async clear(namespace?: string): Promise<void> {
    try {
      if (namespace) {
        const query = this.db.query("DELETE FROM cache WHERE key LIKE ?");
        query.run(`${namespace}:%`);
      } else {
        this.db.run("DELETE FROM cache");
      }

      this.updateStats();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Ensure enough space for new entry
   */
  private async ensureSpace(requiredSize: number): Promise<void> {
    const stats = this.getStats();

    // Check total size limit
    if (stats.totalSize + requiredSize > this.config.maxSize) {
      await this.evictBySize(requiredSize);
    }

    // Check entry count limit
    if (stats.totalEntries >= this.config.maxEntries) {
      await this.evictByLRU(this.config.maxEntries * 0.1); // Evict 10% of entries
    }
  }

  /**
   * Evict entries by size (LRU within size constraint)
   */
  private async evictBySize(requiredSize: number): Promise<void> {
    const query = this.db.query(`
      SELECT key, size FROM cache
      ORDER BY last_accessed ASC
      LIMIT ?
    `);

    const entries = query.all(100) as any[];
    let freedSpace = 0;

    for (const entry of entries) {
      this.db.run("DELETE FROM cache WHERE key = ?", [entry.key]);
      freedSpace += entry.size;
      this.stats.evictions++;

      if (freedSpace >= requiredSize) {
        break;
      }
    }
  }

  /**
   * Evict entries by LRU policy
   */
  private async evictByLRU(percentage: number): Promise<void> {
    const countToEvict = Math.floor(this.config.maxEntries * percentage);
    const query = this.db.query(`
      DELETE FROM cache
      WHERE key IN (
        SELECT key FROM cache
        ORDER BY last_accessed ASC
        LIMIT ?
      )
    `);

    query.run(countToEvict);
    this.stats.evictions += countToEvict;
  }

  /**
   * Cleanup expired entries
   */
  private async cleanup(): Promise<void> {
    try {
      const now = Date.now();
      const query = this.db.query("DELETE FROM cache WHERE expires_at IS NOT NULL AND expires_at <= ?");
      const result = query.run(now);

      if (result.changes > 0) {
        this.updateStats();
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    try {
      const countQuery = this.db.query("SELECT COUNT(*) as count FROM cache");
      const sizeQuery = this.db.query("SELECT SUM(size) as total_size FROM cache");
      const oldestQuery = this.db.query("SELECT MIN(created_at) as oldest FROM cache");
      const newestQuery = this.db.query("SELECT MAX(created_at) as newest FROM cache");

      const count = countQuery.get() as any;
      const size = sizeQuery.get() as any;
      const oldest = oldestQuery.get() as any;
      const newest = newestQuery.get() as any;

      this.stats.totalEntries = count.count;
      this.stats.totalSize = size.total_size || 0;
      this.stats.oldestEntry = oldest.oldest;
      this.stats.newestEntry = newest.newest;
    } catch (error) {
      console.error('Stats update error:', error);
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.totalHits + this.stats.totalMisses;
    this.stats.hitRate = total > 0 ? this.stats.totalHits / total : 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Check if key exists in cache
   */
  async has(namespace: string, identifier: string, params?: Record<string, any>): Promise<boolean> {
    const key = this.generateKey(namespace, identifier, params);
    const now = Date.now();

    try {
      const query = this.db.query("SELECT 1 FROM cache WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)");
      const result = query.get(key, now);
      return result !== null;
    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  }

  /**
   * Get multiple keys at once (batch operation)
   */
  async mget<T>(requests: Array<{ namespace: string; identifier: string; params?: Record<string, any> }>): Promise<Array<T | null>> {
    const promises = requests.map(req => this.get<T>(req.namespace, req.identifier, req.params));
    return Promise.all(promises);
  }

  /**
   * Set multiple keys at once (batch operation)
   */
  async mset<T>(entries: Array<{
    namespace: string;
    identifier: string;
    value: T;
    ttl?: number;
    params?: Record<string, any>;
  }>): Promise<void> {
    const promises = entries.map(entry =>
      this.set(entry.namespace, entry.identifier, entry.value, entry.ttl, entry.params)
    );
    await Promise.all(promises);
  }

  /**
   * Close cache and cleanup resources
   */
  close(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.db.close();
  }
}

// Global cache instance
export const cache = new HighPerformanceCache();

// Export cache utilities
export const cacheUtils = {
  // Common cache namespaces
  NAMESPACES: {
    AI_RESPONSE: 'ai_response',
    WEB_CONTENT: 'web_content',
    PROCESSED_DATA: 'processed_data',
    USER_SESSION: 'user_session',
    API_RESPONSE: 'api_response',
    TEMPLATE: 'template',
  },

  // Common TTL values
  TTL: {
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000,
  },

  // Cache decorator for functions
  cached: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: {
      namespace: string;
      ttl?: number;
      keyGenerator?: (...args: Parameters<T>) => string;
    }
  ): T => {
    return (async (...args: Parameters<T>) => {
      const key = options.keyGenerator ? options.keyGenerator(...args) : JSON.stringify(args);

      // Try to get from cache
      const cached = await cache.get(options.namespace, key);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      const result = await fn(...args);
      await cache.set(options.namespace, key, result, options.ttl);

      return result;
    }) as T;
  },
};
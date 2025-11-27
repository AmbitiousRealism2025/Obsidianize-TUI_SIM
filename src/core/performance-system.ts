/**
 * Core performance and infrastructure components for Obsidianize TUI Simulator
 * Unified interface for caching, file operations, rate limiting, and performance monitoring
 */

// Import all components first
import { performanceMonitor, measurePerformance, type PerformanceMetrics, type PerformanceAlert } from './performance.ts';
import { cache, cacheUtils, type CacheEntry, type CacheConfig, type CacheStats } from './cache/cache.ts';
import { fileOps, fileUtils, type FileOptions, type FileStats, type BackupInfo } from './storage/file-operations.ts';
import { rateLimiter, rateLimitUtils, type RateLimitConfig, type RateLimitTier, type RateLimitResult, type UsageStats, type RateLimitAnalytics } from './rate-limit/rate-limiter.ts';
import { createLogger } from './logging/index.js';

const logger = createLogger('performance-system');

// Re-export everything for convenience
export {
  performanceMonitor,
  measurePerformance,
  type PerformanceMetrics,
  type PerformanceAlert,
  cache,
  cacheUtils,
  type CacheEntry,
  type CacheConfig,
  type CacheStats,
  fileOps,
  fileUtils,
  type FileOptions,
  type FileStats,
  type BackupInfo,
  rateLimiter,
  rateLimitUtils,
  type RateLimitConfig,
  type RateLimitTier,
  type RateLimitResult,
  type UsageStats,
  type RateLimitAnalytics,
};

// Utility functions for common operations
export class ObsidianizeCore {
  /**
   * Initialize all core components
   */
  static async initialize(): Promise<void> {
    logger.info('Initializing Obsidianize Core Components');

    // Mark startup start time
    const startTime = performance.now();

    try {
      // Test cache functionality
      await cache.set('system', 'init_test', { timestamp: Date.now() }, 60000);
      const testResult = await cache.get('system', 'init_test');

      if (!testResult) {
        throw new Error('Cache initialization failed');
      }

      // Clean up test data
      await cache.delete('system', 'init_test');

      // Mark startup complete
      performanceMonitor.markStartupComplete();

      const initTime = performance.now() - startTime;
      logger.info('Core components initialized successfully', { initTime });

      // Log performance metrics
      logger.debug('Performance report', { report: performanceMonitor.generateReport() });

    } catch (error) {
      logger.error('Failed to initialize core components', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown of all components
   */
  static async shutdown(): Promise<void> {
    logger.info('Shutting down Obsidianize Core Components');

    try {
      // Release file locks
      await fileOps.releaseAllLocks();

      // Close database connections
      cache.close();
      rateLimiter.close();

      // Cleanup performance monitoring
      performanceMonitor.cleanup();

      logger.info('Core components shut down successfully');
    } catch (error) {
      logger.error('Error during shutdown', error);
    }
  }

  /**
   * Get comprehensive system status
   */
  static async getSystemStatus(): Promise<{
    performance: any;
    cache: any;
    rateLimit: any;
    timestamp: number;
  }> {
    try {
      const [performanceMetrics, cacheStats, rateLimitAnalytics] = await Promise.all([
        Promise.resolve(performanceMonitor.getMetrics()),
        Promise.resolve(cache.getStats()),
        rateLimiter.getAnalytics(1), // Last 24 hours
      ]);

      return {
        performance: performanceMetrics,
        cache: cacheStats,
        rateLimit: rateLimitAnalytics,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Failed to get system status', error);
      return {
        performance: null,
        cache: null,
        rateLimit: null,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Generate system health report
   */
  static generateHealthReport(): string {
    const metrics = performanceMonitor.getMetrics();
    const cacheStats = cache.getStats();
    const alerts = performanceMonitor.getAlerts(5);

    let report = `
🏥 Obsidianize System Health Report
═══════════════════════════════════════════════════════════════

📊 Performance Metrics:
   Startup Time: ${metrics.startupTime.toFixed(2)}ms ${metrics.startupTime > 100 ? '⚠️' : '✅'}
   Memory Usage: ${(metrics.memoryUsage.current / 1024 / 1024).toFixed(1)}MB ${metrics.memoryUsage.current > 100 * 1024 * 1024 ? '⚠️' : '✅'}
   Avg Response Time: ${metrics.requestMetrics.averageResponseTime.toFixed(2)}ms
   Event Loop Lag: ${metrics.systemHealth.eventLoopLag.toFixed(2)}ms

🗄️  Cache Status:
   Hit Rate: ${(cacheStats.hitRate * 100).toFixed(1)}% ${cacheStats.hitRate < 0.8 ? '⚠️' : '✅'}
   Total Entries: ${cacheStats.totalEntries}
   Total Size: ${(cacheStats.totalSize / 1024 / 1024).toFixed(1)}MB
   Evictions: ${cacheStats.evictions}

🚨 Active Alerts: ${alerts.length}
${alerts.length > 0 ? alerts.map(alert =>
   `   [${alert.severity.toUpperCase()}] ${alert.message}`
).join('\n') : '   No active alerts'}

═══════════════════════════════════════════════════════════════
    `.trim();

    return report;
  }

  /**
   * Validate all performance targets
   */
  static validatePerformanceTargets(): {
    passed: boolean;
    results: Array<{
      target: string;
      actual: number;
      expected: number;
      passed: boolean;
    }>;
  } {
    const metrics = performanceMonitor.getMetrics();
    const cacheStats = cache.getStats();

    const targets = [
      {
        target: 'Startup Time',
        actual: metrics.startupTime,
        expected: 100, // 100ms
        passed: metrics.startupTime <= 100,
      },
      {
        target: 'Memory Usage',
        actual: metrics.memoryUsage.current / 1024 / 1024,
        expected: 100, // 100MB
        passed: metrics.memoryUsage.current <= 100 * 1024 * 1024,
      },
      {
        target: 'Cache Hit Rate',
        actual: cacheStats.hitRate * 100,
        expected: 80, // 80%
        passed: cacheStats.hitRate >= 0.8,
      },
      {
        target: 'Response Time',
        actual: metrics.requestMetrics.averageResponseTime,
        expected: 1000, // 1 second
        passed: metrics.requestMetrics.averageResponseTime <= 1000,
      },
    ];

    const passed = targets.every(t => t.passed);

    return {
      passed,
      results: targets,
    };
  }
}

// Default configuration presets
export const CONFIG_PRESETS = {
  // High performance for production
  PRODUCTION: {
    cache: {
      defaultTTL: 3600000, // 1 hour
      maxSize: 100 * 1024 * 1024, // 100MB
      maxEntries: 50000,
      compressionThreshold: 512, // 512 bytes
      cleanupInterval: 600000, // 10 minutes
      enableCompression: true,
      enableStatistics: true,
    },
    rateLimit: {
      enableAnalytics: true,
    },
  },

  // Development mode with relaxed limits
  DEVELOPMENT: {
    cache: {
      defaultTTL: 600000, // 10 minutes
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 10000,
      compressionThreshold: 1024, // 1KB
      cleanupInterval: 300000, // 5 minutes
      enableCompression: false,
      enableStatistics: false,
    },
    rateLimit: {
      enableAnalytics: false,
    },
  },

  // Testing mode with minimal overhead
  TESTING: {
    cache: {
      defaultTTL: 60000, // 1 minute
      maxSize: 10 * 1024 * 1024, // 10MB
      maxEntries: 1000,
      compressionThreshold: 2048, // 2KB
      cleanupInterval: 60000, // 1 minute
      enableCompression: false,
      enableStatistics: false,
    },
    rateLimit: {
      enableAnalytics: false,
    },
  },
};

// Process signal handlers for graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await ObsidianizeCore.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await ObsidianizeCore.shutdown();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  logger.fatal('Uncaught Exception', error);
  await ObsidianizeCore.shutdown();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  logger.fatal('Unhandled Promise Rejection', reason as Error, { promise: String(promise) });
  await ObsidianizeCore.shutdown();
  process.exit(1);
});
/**
 * Performance monitoring system for Obsidianize TUI Simulator
 * Tracks startup times, memory usage, request processing, and system health
 *
 * Updated: November 27, 2025
 * - Replaced O(n) array shift with O(1) CircularBuffer
 * - Added constants from centralized constants file
 */

import { NumericCircularBuffer } from './utils/circular-buffer.js';
import { PERFORMANCE, TIME, SIZE } from './constants/index.js';

export interface PerformanceMetrics {
  startupTime: number;
  memoryUsage: {
    current: number;
    peak: number;
    baseline: number;
  };
  requestMetrics: {
    totalRequests: number;
    averageResponseTime: number;
    slowRequests: number;
  };
  cacheMetrics: {
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    averageAccessTime: number;
  };
  systemHealth: {
    cpuUsage: number;
    eventLoopLag: number;
    gcStats: {
      collections: number;
      duration: number;
    };
  };
}

export interface PerformanceAlert {
  type: 'memory' | 'response_time' | 'cache_hit_rate' | 'startup_time';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private startTime: number = 0;
  private metrics: PerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  // Use CircularBuffer for O(1) push operations instead of O(n) shift
  private requestTimes: NumericCircularBuffer;
  private cacheAccessTimes: NumericCircularBuffer;
  private memoryCheckInterval?: NodeJS.Timeout;
  // Use constants from centralized constants file
  private readonly MEMORY_THRESHOLD = SIZE.MEMORY_THRESHOLD;
  private readonly RESPONSE_TIME_THRESHOLD = PERFORMANCE.RESPONSE_TIME_THRESHOLD;
  private readonly CACHE_HIT_RATE_THRESHOLD = PERFORMANCE.CACHE_HIT_RATE_TARGET;
  private readonly STARTUP_TIME_THRESHOLD = PERFORMANCE.STARTUP_TIME_TARGET;

  constructor() {
    // Initialize circular buffers with configured sizes
    this.requestTimes = new NumericCircularBuffer(PERFORMANCE.REQUEST_BUFFER_SIZE);
    this.cacheAccessTimes = new NumericCircularBuffer(PERFORMANCE.CACHE_ACCESS_BUFFER_SIZE);
    this.metrics = this.initializeMetrics();
    this.startTime = performance.now();
  }

  private initializeMetrics(): PerformanceMetrics {
    const memUsage = process.memoryUsage();
    return {
      startupTime: 0,
      memoryUsage: {
        current: memUsage.heapUsed,
        peak: memUsage.heapUsed,
        baseline: memUsage.heapUsed,
      },
      requestMetrics: {
        totalRequests: 0,
        averageResponseTime: 0,
        slowRequests: 0,
      },
      cacheMetrics: {
        hitRate: 0,
        totalHits: 0,
        totalMisses: 0,
        averageAccessTime: 0,
      },
      systemHealth: {
        cpuUsage: 0,
        eventLoopLag: 0,
        gcStats: {
          collections: 0,
          duration: 0,
        },
      },
    };
  }

  /**
   * Mark application startup completion
   */
  markStartupComplete(): void {
    this.metrics.startupTime = performance.now() - this.startTime;

    if (this.metrics.startupTime > this.STARTUP_TIME_THRESHOLD) {
      this.addAlert({
        type: 'startup_time',
        severity: 'warning',
        message: `Startup time ${this.metrics.startupTime.toFixed(2)}ms exceeds threshold`,
        value: this.metrics.startupTime,
        threshold: this.STARTUP_TIME_THRESHOLD,
        timestamp: Date.now(),
      });
    }

    // Start monitoring after startup
    this.startMemoryMonitoring();
    this.startEventLoopMonitoring();
  }

  /**
   * Record a request completion
   * Uses O(1) CircularBuffer push instead of O(n) array shift
   */
  recordRequest(duration: number): void {
    this.metrics.requestMetrics.totalRequests++;
    // CircularBuffer handles size limit automatically with O(1) operations
    this.requestTimes.push(duration);

    // Get average directly from NumericCircularBuffer (O(1) operation)
    this.metrics.requestMetrics.averageResponseTime = this.requestTimes.getAverage();

    if (duration > this.RESPONSE_TIME_THRESHOLD) {
      this.metrics.requestMetrics.slowRequests++;

      this.addAlert({
        type: 'response_time',
        severity: 'warning',
        message: `Slow request detected: ${duration.toFixed(2)}ms`,
        value: duration,
        threshold: this.RESPONSE_TIME_THRESHOLD,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Record cache access
   * Uses O(1) CircularBuffer push instead of O(n) array shift
   */
  recordCacheAccess(isHit: boolean, accessTime: number): void {
    if (isHit) {
      this.metrics.cacheMetrics.totalHits++;
    } else {
      this.metrics.cacheMetrics.totalMisses++;
    }

    // CircularBuffer handles size limit automatically with O(1) operations
    this.cacheAccessTimes.push(accessTime);

    // Get average directly from NumericCircularBuffer (O(1) operation)
    this.metrics.cacheMetrics.averageAccessTime = this.cacheAccessTimes.getAverage();

    const total = this.metrics.cacheMetrics.totalHits + this.metrics.cacheMetrics.totalMisses;
    this.metrics.cacheMetrics.hitRate = total > 0 ? this.metrics.cacheMetrics.totalHits / total : 0;

    // Check cache hit rate threshold
    if (total > 100 && this.metrics.cacheMetrics.hitRate < this.CACHE_HIT_RATE_THRESHOLD) {
      this.addAlert({
        type: 'cache_hit_rate',
        severity: 'warning',
        message: `Cache hit rate ${(this.metrics.cacheMetrics.hitRate * 100).toFixed(1)}% below threshold`,
        value: this.metrics.cacheMetrics.hitRate,
        threshold: this.CACHE_HIT_RATE_THRESHOLD,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage.current = memUsage.heapUsed;
    this.metrics.memoryUsage.peak = Math.max(this.metrics.memoryUsage.peak, memUsage.heapUsed);

    if (memUsage.heapUsed > this.MEMORY_THRESHOLD) {
      this.addAlert({
        type: 'memory',
        severity: 'critical',
        message: `Memory usage ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB exceeds threshold`,
        value: memUsage.heapUsed,
        threshold: this.MEMORY_THRESHOLD,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.memoryCheckInterval = setInterval(() => {
      this.updateMemoryUsage();
    }, TIME.MEMORY_CHECK_INTERVAL);
  }

  /**
   * Start event loop lag monitoring
   */
  private startEventLoopMonitoring(): void {
    const checkEventLoop = () => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
        this.metrics.systemHealth.eventLoopLag = lag;

        // Schedule next check
        setTimeout(checkEventLoop, TIME.EVENT_LOOP_CHECK_INTERVAL);
      });
    };

    checkEventLoop();
  }

  /**
   * Add performance alert
   */
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    // Keep only last MAX_ALERTS alerts
    if (this.alerts.length > PERFORMANCE.MAX_ALERTS) {
      this.alerts.shift();
    }

    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error(`🚨 Performance Alert: ${alert.message}`);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    this.updateMemoryUsage();
    return { ...this.metrics };
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit: number = 10): PerformanceAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const alerts = this.getAlerts(5);

    return `
📊 Performance Report
═══════════════════════════════════════════════════════════════

⏱️  Startup Time: ${metrics.startupTime.toFixed(2)}ms
💾 Memory Usage: ${(metrics.memoryUsage.current / 1024 / 1024).toFixed(1)}MB
   Peak: ${(metrics.memoryUsage.peak / 1024 / 1024).toFixed(1)}MB
   Baseline: ${(metrics.memoryUsage.baseline / 1024 / 1024).toFixed(1)}MB

📈 Request Metrics:
   Total: ${metrics.requestMetrics.totalRequests}
   Average Response: ${metrics.requestMetrics.averageResponseTime.toFixed(2)}ms
   Slow Requests: ${metrics.requestMetrics.slowRequests}

🗄️  Cache Metrics:
   Hit Rate: ${(metrics.cacheMetrics.hitRate * 100).toFixed(1)}%
   Total Hits: ${metrics.cacheMetrics.totalHits}
   Total Misses: ${metrics.cacheMetrics.totalMisses}
   Average Access: ${metrics.cacheMetrics.averageAccessTime.toFixed(2)}ms

🔧 System Health:
   Event Loop Lag: ${metrics.systemHealth.eventLoopLag.toFixed(2)}ms
   GC Collections: ${metrics.systemHealth.gcStats.collections}

🚨 Recent Alerts:
${alerts.length > 0 ? alerts.map(alert =>
   `   [${alert.severity.toUpperCase()}] ${alert.message}`
).join('\n') : '   No recent alerts'}

═══════════════════════════════════════════════════════════════
    `.trim();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Export performance decorator for measuring function execution time
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    const start = performance.now();
    const result = fn(...args);

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        performanceMonitor.recordRequest(duration);
      });
    } else {
      const duration = performance.now() - start;
      performanceMonitor.recordRequest(duration);
      return result;
    }
  }) as T;
}
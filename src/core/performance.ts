/**
 * Performance monitoring system for Obsidianize TUI Simulator
 * Tracks startup times, memory usage, request processing, and system health
 */

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

class PerformanceMonitor {
  private startTime: number = 0;
  private metrics: PerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  private requestTimes: number[] = [];
  private cacheAccessTimes: number[] = [];
  private memoryCheckInterval?: NodeJS.Timeout;
  private readonly MEMORY_THRESHOLD = 100 * 1024 * 1024; // 100MB
  private readonly RESPONSE_TIME_THRESHOLD = 1000; // 1 second
  private readonly CACHE_HIT_RATE_THRESHOLD = 0.8; // 80%
  private readonly STARTUP_TIME_THRESHOLD = 100; // 100ms

  constructor() {
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
   */
  recordRequest(duration: number): void {
    this.metrics.requestMetrics.totalRequests++;
    this.requestTimes.push(duration);

    // Keep only last 1000 request times for average calculation
    if (this.requestTimes.length > 1000) {
      this.requestTimes.shift();
    }

    this.metrics.requestMetrics.averageResponseTime =
      this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length;

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
   */
  recordCacheAccess(isHit: boolean, accessTime: number): void {
    if (isHit) {
      this.metrics.cacheMetrics.totalHits++;
    } else {
      this.metrics.cacheMetrics.totalMisses++;
    }

    this.cacheAccessTimes.push(accessTime);

    if (this.cacheAccessTimes.length > 1000) {
      this.cacheAccessTimes.shift();
    }

    this.metrics.cacheMetrics.averageAccessTime =
      this.cacheAccessTimes.reduce((sum, time) => sum + time, 0) / this.cacheAccessTimes.length;

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
    }, 5000); // Check every 5 seconds
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
        setTimeout(checkEventLoop, 1000);
      });
    };

    checkEventLoop();
  }

  /**
   * Add performance alert
   */
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
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
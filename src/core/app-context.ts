/**
 * Application Context and Dependency Injection Container
 * Provides centralized dependency management and configuration
 *
 * Based on Opus Code Review recommendations (ARCH-2.1 - ARCH-2.4)
 * Version: 1.0.0
 */

import { Logger, createLogger } from './logging/index.js';
import { HighPerformanceCache, type CacheConfig } from './cache/cache.js';
import { RateLimiter } from './rate-limit/rate-limiter.js';
import { AtomicFileOperations } from './storage/file-operations.js';
import { PerformanceMonitor } from './performance.js';

/**
 * Application configuration interface
 */
export interface AppConfig {
  /** Application name */
  name: string;
  /** Application version */
  version: string;
  /** Environment (development, production, test) */
  environment: 'development' | 'production' | 'test';
  /** Cache configuration */
  cache?: Partial<CacheConfig>;
  /** Rate limiting enabled */
  rateLimitingEnabled?: boolean;
  /** Performance monitoring enabled */
  performanceMonitoringEnabled?: boolean;
  /** Logging level */
  logLevel?: string;
}

/**
 * Default application configuration
 */
const DEFAULT_CONFIG: AppConfig = {
  name: 'Obsidianize',
  version: '1.0.0',
  environment: (process.env.NODE_ENV as AppConfig['environment']) || 'development',
  rateLimitingEnabled: true,
  performanceMonitoringEnabled: true
};

/**
 * Service container for dependency injection
 */
export interface ServiceContainer {
  /** Logger instance */
  logger: Logger;
  /** Cache instance (lazy-initialized) */
  cache?: HighPerformanceCache;
  /** Rate limiter instance (lazy-initialized) */
  rateLimiter?: RateLimiter;
  /** File operations instance (lazy-initialized) */
  fileOps?: AtomicFileOperations;
  /** Performance monitor instance (lazy-initialized) */
  performanceMonitor?: PerformanceMonitor;
}

/**
 * Application Context class
 * Manages application-wide services and configuration
 */
export class AppContext {
  private static instance: AppContext | null = null;
  private config: AppConfig;
  private services: ServiceContainer;
  private initialized: boolean = false;

  private constructor(config: Partial<AppConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.services = {
      logger: createLogger('app')
    };
  }

  /**
   * Get or create the singleton instance
   */
  static getInstance(config?: Partial<AppConfig>): AppContext {
    if (!AppContext.instance) {
      AppContext.instance = new AppContext(config);
    }
    return AppContext.instance;
  }

  /**
   * Create a new context (useful for testing)
   */
  static create(config?: Partial<AppConfig>): AppContext {
    return new AppContext(config);
  }

  /**
   * Reset the singleton instance (for testing)
   */
  static reset(): void {
    if (AppContext.instance) {
      AppContext.instance.shutdown();
      AppContext.instance = null;
    }
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.services.logger.warn('AppContext already initialized');
      return;
    }

    this.services.logger.info('Initializing AppContext', {
      name: this.config.name,
      version: this.config.version,
      environment: this.config.environment
    });

    // Services are lazily initialized when accessed
    this.initialized = true;
    this.services.logger.info('AppContext initialized successfully');
  }

  /**
   * Shutdown all services
   */
  async shutdown(): Promise<void> {
    this.services.logger.info('Shutting down AppContext');

    // Close cache if initialized
    if (this.services.cache) {
      this.services.cache.close();
    }

    // Close rate limiter if initialized
    if (this.services.rateLimiter) {
      this.services.rateLimiter.close();
    }

    // Cleanup performance monitor if initialized
    if (this.services.performanceMonitor) {
      this.services.performanceMonitor.cleanup();
    }

    this.initialized = false;
    this.services.logger.info('AppContext shutdown complete');
  }

  /**
   * Get the application configuration
   */
  getConfig(): Readonly<AppConfig> {
    return { ...this.config };
  }

  /**
   * Get the logger instance
   */
  getLogger(module?: string): Logger {
    if (module) {
      return this.services.logger.child(module);
    }
    return this.services.logger;
  }

  /**
   * Get or create the cache instance
   */
  getCache(): HighPerformanceCache {
    if (!this.services.cache) {
      this.services.logger.debug('Initializing cache');
      this.services.cache = new HighPerformanceCache(this.config.cache);
    }
    return this.services.cache;
  }

  /**
   * Get or create the rate limiter instance
   */
  getRateLimiter(): RateLimiter {
    if (!this.services.rateLimiter) {
      this.services.logger.debug('Initializing rate limiter');
      this.services.rateLimiter = new RateLimiter(this.config.rateLimitingEnabled);
    }
    return this.services.rateLimiter;
  }

  /**
   * Get or create the file operations instance
   */
  getFileOps(): AtomicFileOperations {
    if (!this.services.fileOps) {
      this.services.logger.debug('Initializing file operations');
      this.services.fileOps = new AtomicFileOperations();
    }
    return this.services.fileOps;
  }

  /**
   * Get or create the performance monitor instance
   */
  getPerformanceMonitor(): PerformanceMonitor {
    if (!this.services.performanceMonitor) {
      this.services.logger.debug('Initializing performance monitor');
      this.services.performanceMonitor = new PerformanceMonitor();
    }
    return this.services.performanceMonitor;
  }

  /**
   * Check if the context is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  /**
   * Check if running in test mode
   */
  isTest(): boolean {
    return this.config.environment === 'test';
  }
}

/**
 * Factory functions for creating services with specific configurations
 */
export const factories = {
  /**
   * Create a cache with custom configuration
   */
  createCache(config?: Partial<CacheConfig>): HighPerformanceCache {
    return new HighPerformanceCache(config);
  },

  /**
   * Create a rate limiter with analytics setting
   */
  createRateLimiter(analyticsEnabled: boolean = true): RateLimiter {
    return new RateLimiter(analyticsEnabled);
  },

  /**
   * Create a file operations instance
   */
  createFileOps(): AtomicFileOperations {
    return new AtomicFileOperations();
  },

  /**
   * Create a logger for a module
   */
  createLogger(module: string): Logger {
    return createLogger(module);
  }
};

/**
 * Get the default application context
 */
export function getAppContext(): AppContext {
  return AppContext.getInstance();
}

/**
 * Initialize the application with configuration
 */
export async function initializeApp(config?: Partial<AppConfig>): Promise<AppContext> {
  const context = AppContext.getInstance(config);
  await context.initialize();
  return context;
}

/**
 * Shutdown the application
 */
export async function shutdownApp(): Promise<void> {
  const context = AppContext.getInstance();
  await context.shutdown();
  AppContext.reset();
}

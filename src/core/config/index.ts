/**
 * Environment-based Configuration System
 * Provides centralized configuration management with environment-specific defaults
 *
 * Phase 3: Production Readiness Feature
 * Version: 1.0.0
 */

import { createLogger } from '../logging/index.js';
import { TIME, SIZE, RATE_LIMIT, PERFORMANCE, AI } from '../constants/index.js';

const logger = createLogger('config');

// ============================================================================
// ENVIRONMENT TYPES
// ============================================================================

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface ServerConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  trustProxy: boolean;
  maxRequestSize: number;
}

export interface CacheConfiguration {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  maxEntries: number;
  compressionEnabled: boolean;
  compressionThreshold: number;
  cleanupInterval: number;
}

export interface RateLimitConfiguration {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  burstLimit: number;
}

export interface AIConfiguration {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface LoggingConfiguration {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent';
  format: 'pretty' | 'json';
  includeTimestamp: boolean;
  includeRequestId: boolean;
}

export interface SecurityConfiguration {
  enableSSRF: boolean;
  enableAPIKeyValidation: boolean;
  maxURLLength: number;
  maxAPIKeyLength: number;
  rateLimitPerIP: number;
  encryptionEnabled: boolean;
}

export interface PerformanceConfiguration {
  startupTimeout: number;
  responseTimeThreshold: number;
  cacheHitRateTarget: number;
  memoryThreshold: number;
  enableProfiling: boolean;
  enableMetrics: boolean;
}

export interface BatchConfiguration {
  enabled: boolean;
  maxUrls: number;
  maxConcurrent: number;
  timeout: number;
}

export interface PWAConfiguration {
  enabled: boolean;
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
}

export interface ApplicationConfig {
  name: string;
  version: string;
  environment: Environment;
  server: ServerConfig;
  cache: CacheConfiguration;
  rateLimit: RateLimitConfiguration;
  ai: AIConfiguration;
  logging: LoggingConfiguration;
  security: SecurityConfiguration;
  performance: PerformanceConfiguration;
  batch: BatchConfiguration;
  pwa: PWAConfiguration;
}

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Detect the current environment
 */
export function detectEnvironment(): Environment {
  const env = process.env.NODE_ENV?.toLowerCase();

  switch (env) {
    case 'production':
    case 'prod':
      return 'production';
    case 'staging':
    case 'stage':
      return 'staging';
    case 'test':
    case 'testing':
      return 'test';
    default:
      return 'development';
  }
}

// ============================================================================
// DEFAULT CONFIGURATIONS BY ENVIRONMENT
// ============================================================================

const baseConfig: Omit<ApplicationConfig, 'environment'> = {
  name: 'Obsidianize',
  version: '1.0.0',
  server: {
    port: 3000,
    host: 'localhost',
    corsOrigins: ['*'],
    trustProxy: false,
    maxRequestSize: SIZE.MAX_CONTENT_LENGTH
  },
  cache: {
    enabled: true,
    ttl: TIME.DEFAULT_CACHE_TTL,
    maxSize: SIZE.DEFAULT_CACHE_MAX_SIZE,
    maxEntries: SIZE.MAX_CACHE_ENTRIES,
    compressionEnabled: true,
    compressionThreshold: SIZE.COMPRESSION_THRESHOLD,
    cleanupInterval: TIME.CACHE_CLEANUP_INTERVAL
  },
  rateLimit: {
    enabled: true,
    windowMs: RATE_LIMIT.WINDOW_SIZE,
    maxRequests: RATE_LIMIT.USER_TOKENS,
    skipSuccessfulRequests: false,
    burstLimit: RATE_LIMIT.USER_MAX_BURST
  },
  ai: {
    model: AI.DEFAULT_MODEL,
    temperature: AI.DEFAULT_TEMPERATURE,
    maxTokens: AI.DEFAULT_MAX_TOKENS,
    topP: AI.DEFAULT_TOP_P,
    topK: AI.DEFAULT_TOP_K,
    timeout: TIME.AI_PROCESSING_TIMEOUT,
    retryAttempts: 3,
    retryDelay: TIME.RETRY_BASE_DELAY
  },
  logging: {
    level: 'info',
    format: 'pretty',
    includeTimestamp: true,
    includeRequestId: true
  },
  security: {
    enableSSRF: true,
    enableAPIKeyValidation: true,
    maxURLLength: SIZE.MAX_URL_LENGTH,
    maxAPIKeyLength: SIZE.MAX_API_KEY_LENGTH,
    rateLimitPerIP: 100,
    encryptionEnabled: true
  },
  performance: {
    startupTimeout: PERFORMANCE.STARTUP_TIME_TARGET,
    responseTimeThreshold: PERFORMANCE.RESPONSE_TIME_THRESHOLD,
    cacheHitRateTarget: PERFORMANCE.CACHE_HIT_RATE_TARGET,
    memoryThreshold: SIZE.MEMORY_THRESHOLD,
    enableProfiling: false,
    enableMetrics: false
  },
  batch: {
    enabled: true,
    maxUrls: 10,
    maxConcurrent: 3,
    timeout: TIME.MAX_PROCESSING_TIME
  },
  pwa: {
    enabled: false,
    name: 'Obsidianize',
    shortName: 'Obsidianize',
    description: 'Transform web content into structured Markdown notes',
    themeColor: '#9b59d0',
    backgroundColor: '#0f0f23'
  }
};

const developmentOverrides: Partial<ApplicationConfig> = {
  logging: {
    level: 'debug',
    format: 'pretty',
    includeTimestamp: true,
    includeRequestId: true
  },
  performance: {
    ...baseConfig.performance,
    enableProfiling: true,
    enableMetrics: true
  },
  server: {
    ...baseConfig.server,
    corsOrigins: ['*']
  }
};

const stagingOverrides: Partial<ApplicationConfig> = {
  logging: {
    level: 'info',
    format: 'json',
    includeTimestamp: true,
    includeRequestId: true
  },
  performance: {
    ...baseConfig.performance,
    enableProfiling: false,
    enableMetrics: true
  },
  server: {
    ...baseConfig.server,
    trustProxy: true
  }
};

const productionOverrides: Partial<ApplicationConfig> = {
  logging: {
    level: 'warn',
    format: 'json',
    includeTimestamp: true,
    includeRequestId: true
  },
  performance: {
    ...baseConfig.performance,
    enableProfiling: false,
    enableMetrics: true
  },
  server: {
    ...baseConfig.server,
    host: '0.0.0.0',
    trustProxy: true,
    corsOrigins: [] // Should be configured via environment variable
  },
  cache: {
    ...baseConfig.cache,
    enabled: true
  },
  pwa: {
    ...baseConfig.pwa,
    enabled: true
  }
};

const testOverrides: Partial<ApplicationConfig> = {
  logging: {
    level: 'silent',
    format: 'pretty',
    includeTimestamp: false,
    includeRequestId: false
  },
  cache: {
    ...baseConfig.cache,
    enabled: false
  },
  rateLimit: {
    ...baseConfig.rateLimit,
    enabled: false
  },
  performance: {
    ...baseConfig.performance,
    enableProfiling: false,
    enableMetrics: false
  }
};

// ============================================================================
// CONFIGURATION LOADING
// ============================================================================

/**
 * Parse environment variable as integer
 */
function parseIntEnv(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse environment variable as float
 */
function parseFloatEnv(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse environment variable as boolean
 */
function parseBoolEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parse environment variable as string array
 */
function parseArrayEnv(name: string, defaultValue: string[]): string[] {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Load configuration from environment variables
 */
function loadFromEnvironment(): Partial<ApplicationConfig> {
  return {
    server: {
      port: parseIntEnv('PORT', baseConfig.server.port),
      host: process.env.HOST || baseConfig.server.host,
      corsOrigins: parseArrayEnv('CORS_ORIGINS', baseConfig.server.corsOrigins),
      trustProxy: parseBoolEnv('TRUST_PROXY', baseConfig.server.trustProxy),
      maxRequestSize: parseIntEnv('MAX_REQUEST_SIZE', baseConfig.server.maxRequestSize)
    },
    cache: {
      enabled: parseBoolEnv('CACHE_ENABLED', baseConfig.cache.enabled),
      ttl: parseIntEnv('CACHE_TTL', baseConfig.cache.ttl),
      maxSize: parseIntEnv('CACHE_MAX_SIZE', baseConfig.cache.maxSize),
      maxEntries: parseIntEnv('CACHE_MAX_ENTRIES', baseConfig.cache.maxEntries),
      compressionEnabled: parseBoolEnv('CACHE_COMPRESSION_ENABLED', baseConfig.cache.compressionEnabled),
      compressionThreshold: parseIntEnv('CACHE_COMPRESSION_THRESHOLD', baseConfig.cache.compressionThreshold),
      cleanupInterval: parseIntEnv('CACHE_CLEANUP_INTERVAL', baseConfig.cache.cleanupInterval)
    },
    rateLimit: {
      enabled: parseBoolEnv('RATE_LIMIT_ENABLED', baseConfig.rateLimit.enabled),
      windowMs: parseIntEnv('RATE_LIMIT_WINDOW', baseConfig.rateLimit.windowMs),
      maxRequests: parseIntEnv('RATE_LIMIT_MAX', baseConfig.rateLimit.maxRequests),
      skipSuccessfulRequests: parseBoolEnv('RATE_LIMIT_SKIP_SUCCESS', baseConfig.rateLimit.skipSuccessfulRequests),
      burstLimit: parseIntEnv('RATE_LIMIT_BURST', baseConfig.rateLimit.burstLimit)
    },
    ai: {
      model: process.env.AI_MODEL || baseConfig.ai.model,
      temperature: parseFloatEnv('AI_TEMPERATURE', baseConfig.ai.temperature),
      maxTokens: parseIntEnv('AI_MAX_TOKENS', baseConfig.ai.maxTokens),
      topP: parseFloatEnv('AI_TOP_P', baseConfig.ai.topP),
      topK: parseIntEnv('AI_TOP_K', baseConfig.ai.topK),
      timeout: parseIntEnv('AI_TIMEOUT', baseConfig.ai.timeout),
      retryAttempts: parseIntEnv('AI_RETRY_ATTEMPTS', baseConfig.ai.retryAttempts),
      retryDelay: parseIntEnv('AI_RETRY_DELAY', baseConfig.ai.retryDelay)
    },
    logging: {
      level: (process.env.LOG_LEVEL as LoggingConfiguration['level']) || baseConfig.logging.level,
      format: (process.env.LOG_FORMAT as LoggingConfiguration['format']) || baseConfig.logging.format,
      includeTimestamp: parseBoolEnv('LOG_TIMESTAMP', baseConfig.logging.includeTimestamp),
      includeRequestId: parseBoolEnv('LOG_REQUEST_ID', baseConfig.logging.includeRequestId)
    },
    security: {
      enableSSRF: parseBoolEnv('SECURITY_SSRF_ENABLED', baseConfig.security.enableSSRF),
      enableAPIKeyValidation: parseBoolEnv('SECURITY_API_KEY_VALIDATION', baseConfig.security.enableAPIKeyValidation),
      maxURLLength: parseIntEnv('SECURITY_MAX_URL_LENGTH', baseConfig.security.maxURLLength),
      maxAPIKeyLength: parseIntEnv('SECURITY_MAX_API_KEY_LENGTH', baseConfig.security.maxAPIKeyLength),
      rateLimitPerIP: parseIntEnv('SECURITY_RATE_LIMIT_PER_IP', baseConfig.security.rateLimitPerIP),
      encryptionEnabled: parseBoolEnv('SECURITY_ENCRYPTION_ENABLED', baseConfig.security.encryptionEnabled)
    },
    performance: {
      startupTimeout: parseIntEnv('PERF_STARTUP_TIMEOUT', baseConfig.performance.startupTimeout),
      responseTimeThreshold: parseIntEnv('PERF_RESPONSE_THRESHOLD', baseConfig.performance.responseTimeThreshold),
      cacheHitRateTarget: parseFloatEnv('PERF_CACHE_HIT_TARGET', baseConfig.performance.cacheHitRateTarget),
      memoryThreshold: parseIntEnv('PERF_MEMORY_THRESHOLD', baseConfig.performance.memoryThreshold),
      enableProfiling: parseBoolEnv('PERF_PROFILING_ENABLED', baseConfig.performance.enableProfiling),
      enableMetrics: parseBoolEnv('PERF_METRICS_ENABLED', baseConfig.performance.enableMetrics)
    },
    batch: {
      enabled: parseBoolEnv('BATCH_ENABLED', baseConfig.batch.enabled),
      maxUrls: parseIntEnv('BATCH_MAX_URLS', baseConfig.batch.maxUrls),
      maxConcurrent: parseIntEnv('BATCH_MAX_CONCURRENT', baseConfig.batch.maxConcurrent),
      timeout: parseIntEnv('BATCH_TIMEOUT', baseConfig.batch.timeout)
    },
    pwa: {
      enabled: parseBoolEnv('PWA_ENABLED', baseConfig.pwa.enabled),
      name: process.env.PWA_NAME || baseConfig.pwa.name,
      shortName: process.env.PWA_SHORT_NAME || baseConfig.pwa.shortName,
      description: process.env.PWA_DESCRIPTION || baseConfig.pwa.description,
      themeColor: process.env.PWA_THEME_COLOR || baseConfig.pwa.themeColor,
      backgroundColor: process.env.PWA_BACKGROUND_COLOR || baseConfig.pwa.backgroundColor
    }
  };
}

/**
 * Deep merge objects
 */
function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  const result = { ...target };

  for (const source of sources) {
    for (const key in source) {
      if (source[key] !== undefined) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          typeof result[key] === 'object' &&
          result[key] !== null
        ) {
          (result as any)[key] = deepMerge(result[key], source[key] as any);
        } else {
          (result as any)[key] = source[key];
        }
      }
    }
  }

  return result;
}

// ============================================================================
// CONFIGURATION SINGLETON
// ============================================================================

let configInstance: ApplicationConfig | null = null;

/**
 * Build the configuration based on environment
 */
export function buildConfig(environment?: Environment): ApplicationConfig {
  const env = environment || detectEnvironment();

  // Start with base config
  let config = { ...baseConfig, environment: env } as ApplicationConfig;

  // Apply environment-specific overrides
  switch (env) {
    case 'development':
      config = deepMerge(config, developmentOverrides);
      break;
    case 'staging':
      config = deepMerge(config, stagingOverrides);
      break;
    case 'production':
      config = deepMerge(config, productionOverrides);
      break;
    case 'test':
      config = deepMerge(config, testOverrides);
      break;
  }

  // Apply environment variable overrides
  const envOverrides = loadFromEnvironment();
  config = deepMerge(config, envOverrides);

  return config;
}

/**
 * Get the application configuration (singleton)
 */
export function getConfig(): ApplicationConfig {
  if (!configInstance) {
    configInstance = buildConfig();
    logger.info('Configuration loaded', {
      environment: configInstance.environment,
      version: configInstance.version
    });
  }
  return configInstance;
}

/**
 * Reset the configuration (for testing)
 */
export function resetConfig(): void {
  configInstance = null;
}

/**
 * Override configuration (for testing)
 */
export function setConfig(config: ApplicationConfig): void {
  configInstance = config;
}

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================

/**
 * Validate the configuration
 */
export function validateConfig(config: ApplicationConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Server validation
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push(`Invalid port: ${config.server.port}`);
  }

  // Cache validation
  if (config.cache.maxSize < SIZE.KB) {
    errors.push(`Cache max size too small: ${config.cache.maxSize}`);
  }

  // Rate limit validation
  if (config.rateLimit.maxRequests < 1) {
    errors.push(`Invalid rate limit max requests: ${config.rateLimit.maxRequests}`);
  }

  // AI validation
  if (config.ai.temperature < 0 || config.ai.temperature > 2) {
    errors.push(`Invalid AI temperature: ${config.ai.temperature}`);
  }

  if (config.ai.maxTokens < 1) {
    errors.push(`Invalid AI max tokens: ${config.ai.maxTokens}`);
  }

  // Batch validation
  if (config.batch.maxUrls < 1) {
    errors.push(`Invalid batch max URLs: ${config.batch.maxUrls}`);
  }

  if (config.batch.maxConcurrent < 1) {
    errors.push(`Invalid batch max concurrent: ${config.batch.maxConcurrent}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// ENVIRONMENT HELPERS
// ============================================================================

/**
 * Check if in production
 */
export function isProduction(): boolean {
  return getConfig().environment === 'production';
}

/**
 * Check if in development
 */
export function isDevelopment(): boolean {
  return getConfig().environment === 'development';
}

/**
 * Check if in staging
 */
export function isStaging(): boolean {
  return getConfig().environment === 'staging';
}

/**
 * Check if in test
 */
export function isTest(): boolean {
  return getConfig().environment === 'test';
}

/**
 * Get a friendly environment name
 */
export function getEnvironmentName(): string {
  const env = getConfig().environment;
  return env.charAt(0).toUpperCase() + env.slice(1);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getConfig,
  buildConfig,
  resetConfig,
  setConfig,
  validateConfig,
  detectEnvironment,
  isProduction,
  isDevelopment,
  isStaging,
  isTest,
  getEnvironmentName
};

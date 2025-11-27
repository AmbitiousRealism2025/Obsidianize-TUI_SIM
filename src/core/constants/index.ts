/**
 * Application Constants
 * Centralized configuration values and magic numbers
 *
 * Based on Opus Code Review recommendations (QUAL-1.1 - QUAL-1.4)
 * Version: 1.0.0
 */

/**
 * Time-related constants (in milliseconds unless noted)
 */
export const TIME = {
  /** 1 second in milliseconds */
  SECOND: 1000,
  /** 1 minute in milliseconds */
  MINUTE: 60 * 1000,
  /** 1 hour in milliseconds */
  HOUR: 60 * 60 * 1000,
  /** 1 day in milliseconds */
  DAY: 24 * 60 * 60 * 1000,
  /** 1 week in milliseconds */
  WEEK: 7 * 24 * 60 * 60 * 1000,
  /** 30 days in milliseconds */
  MONTH: 30 * 24 * 60 * 60 * 1000,

  // Processing timeouts
  /** Maximum processing time (10 minutes) */
  MAX_PROCESSING_TIME: 10 * 60 * 1000,
  /** Default timeout for AI processing (2 minutes) */
  AI_PROCESSING_TIMEOUT: 2 * 60 * 1000,
  /** Default timeout for content fetching (30 seconds) */
  CONTENT_FETCH_TIMEOUT: 30 * 1000,
  /** Default timeout for formatting operations (5 seconds) */
  FORMATTING_TIMEOUT: 5 * 1000,

  // Cache timing
  /** Default cache TTL (1 hour) */
  DEFAULT_CACHE_TTL: 60 * 60 * 1000,
  /** Cache cleanup interval (5 minutes) */
  CACHE_CLEANUP_INTERVAL: 5 * 60 * 1000,
  /** Short cache TTL for frequently changing data (5 minutes) */
  SHORT_CACHE_TTL: 5 * 60 * 1000,
  /** Long cache TTL for stable data (1 day) */
  LONG_CACHE_TTL: 24 * 60 * 60 * 1000,

  // Performance monitoring
  /** Memory check interval (5 seconds) */
  MEMORY_CHECK_INTERVAL: 5 * 1000,
  /** Event loop monitoring interval (1 second) */
  EVENT_LOOP_CHECK_INTERVAL: 1000,
  /** Analytics data retention (30 days) */
  ANALYTICS_RETENTION: 30 * 24 * 60 * 60 * 1000,

  // Retry timing
  /** Base delay for retries (1 second) */
  RETRY_BASE_DELAY: 1000,
  /** Maximum delay for retries (30 seconds) */
  RETRY_MAX_DELAY: 30 * 1000,
} as const;

/**
 * Size limits (in bytes unless noted)
 */
export const SIZE = {
  /** 1 KB in bytes */
  KB: 1024,
  /** 1 MB in bytes */
  MB: 1024 * 1024,
  /** 1 GB in bytes */
  GB: 1024 * 1024 * 1024,

  // Content limits
  /** Maximum content length (10 MB) */
  MAX_CONTENT_LENGTH: 10 * 1024 * 1024,
  /** Maximum URL length */
  MAX_URL_LENGTH: 2000,
  /** Maximum API key length */
  MAX_API_KEY_LENGTH: 500,
  /** Maximum prompt length (100 KB) */
  MAX_PROMPT_LENGTH: 100 * 1024,
  /** Content truncation threshold for AI processing (8000 characters) */
  AI_CONTENT_TRUNCATE_LENGTH: 8000,

  // Cache limits
  /** Default maximum cache size (50 MB) */
  DEFAULT_CACHE_MAX_SIZE: 50 * 1024 * 1024,
  /** Compression threshold (1 KB) */
  COMPRESSION_THRESHOLD: 1024,
  /** Maximum cache entries */
  MAX_CACHE_ENTRIES: 10000,

  // Memory thresholds
  /** Memory warning threshold (100 MB) */
  MEMORY_THRESHOLD: 100 * 1024 * 1024,
  /** Baseline memory usage target (50 MB) */
  MEMORY_BASELINE_TARGET: 50 * 1024 * 1024,
} as const;

/**
 * Rate limiting constants
 */
export const RATE_LIMIT = {
  // Token bucket defaults
  /** Default tokens for guest tier */
  GUEST_TOKENS: 100,
  /** Default tokens for user tier */
  USER_TOKENS: 1000,
  /** Default tokens for premium tier */
  PREMIUM_TOKENS: 5000,
  /** Default tokens for admin tier */
  ADMIN_TOKENS: 50000,

  // Refill rates (tokens per second)
  /** Guest tier refill rate */
  GUEST_REFILL_RATE: 10,
  /** User tier refill rate */
  USER_REFILL_RATE: 50,
  /** Premium tier refill rate */
  PREMIUM_REFILL_RATE: 100,
  /** Admin tier refill rate */
  ADMIN_REFILL_RATE: 1000,

  // Burst limits (max accumulated tokens)
  /** Guest tier max burst (1.5x base) */
  GUEST_MAX_BURST: 150,
  /** User tier max burst */
  USER_MAX_BURST: 1500,
  /** Premium tier max burst */
  PREMIUM_MAX_BURST: 7500,
  /** Admin tier max burst */
  ADMIN_MAX_BURST: 100000,

  // Global limits
  /** Global AI request limit */
  GLOBAL_AI_REQUESTS: 10000,
  /** Global file operations limit */
  GLOBAL_FILE_OPS: 5000,

  // Window sizes
  /** Rate limit window size (1 minute) */
  WINDOW_SIZE: 60 * 1000,

  // Token costs for different operations
  TOKEN_COSTS: {
    AI_REQUEST: 10,
    FILE_READ: 1,
    FILE_WRITE: 2,
    CACHE_ACCESS: 0.5,
    API_CALL: 3,
    WEB_SCRAPE: 5,
  },

  // Throttle settings
  /** Cleanup throttle interval (1 hour) */
  CLEANUP_THROTTLE_INTERVAL: 60 * 60 * 1000,
} as const;

/**
 * Performance thresholds
 */
export const PERFORMANCE = {
  /** Target startup time (100ms) */
  STARTUP_TIME_TARGET: 100,
  /** Response time warning threshold (1 second) */
  RESPONSE_TIME_THRESHOLD: 1000,
  /** Cache hit rate target (80%) */
  CACHE_HIT_RATE_TARGET: 0.8,
  /** Maximum request times to store for averaging */
  MAX_REQUEST_TIMES: 1000,
  /** Maximum alerts to retain */
  MAX_ALERTS: 100,

  // Circular buffer sizes
  /** Request times buffer size */
  REQUEST_BUFFER_SIZE: 1000,
  /** Cache access times buffer size */
  CACHE_ACCESS_BUFFER_SIZE: 1000,
} as const;

/**
 * Retry configuration
 */
export const RETRY = {
  /** Maximum retry attempts */
  MAX_ATTEMPTS: 3,
  /** Base delay between retries (1 second) */
  BASE_DELAY: 1000,
  /** Maximum delay between retries (30 seconds) */
  MAX_DELAY: 30000,
  /** Backoff multiplier */
  BACKOFF_FACTOR: 2,
  /** Enable jitter for retry delays */
  ENABLE_JITTER: true,
} as const;

/**
 * AI/Gemini configuration
 */
export const AI = {
  /** Default model */
  DEFAULT_MODEL: 'gemini-pro',
  /** Default temperature */
  DEFAULT_TEMPERATURE: 0.7,
  /** Default max output tokens */
  DEFAULT_MAX_TOKENS: 4096,
  /** Default top P */
  DEFAULT_TOP_P: 0.8,
  /** Default top K */
  DEFAULT_TOP_K: 40,

  // Token limits
  /** Minimum tokens for processing */
  MIN_TOKENS: 1,
  /** Maximum tokens per request */
  MAX_TOKENS_PER_REQUEST: 8192,
} as const;

/**
 * Validation constants
 */
export const VALIDATION = {
  /** Minimum API key length */
  MIN_API_KEY_LENGTH: 20,
  /** Maximum API key length */
  MAX_API_KEY_LENGTH: 500,
  /** Minimum summary length */
  MIN_SUMMARY_LENGTH: 50,
  /** Maximum summary length */
  MAX_SUMMARY_LENGTH: 5000,
  /** Minimum analysis length */
  MIN_ANALYSIS_LENGTH: 100,
  /** Maximum analysis length */
  MAX_ANALYSIS_LENGTH: 10000,
  /** Maximum tags */
  MAX_TAGS: 50,
  /** Maximum entities */
  MAX_ENTITIES: 100,
  /** Maximum sections */
  MAX_SECTIONS: 50,
  /** Maximum key points */
  MAX_KEY_POINTS: 20,
  /** Maximum insights */
  MAX_INSIGHTS: 20,
} as const;

/**
 * HTTP status codes commonly used
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Content type patterns for URL classification
 */
export const URL_PATTERNS = {
  YOUTUBE: /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ARTICLE: /^https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/(?:article|post|blog|news)\/.+/,
  PAPER: /^https?:\/\/(?:www\.)?(?:arxiv\.org|researchgate\.net|acm\.org|ieee\.org)\/.+/,
  PODCAST: /^https?:\/\/(?:www\.)?(?:spotify\.com|apple\.com|soundcloud\.com)\/(?:podcast|episode)\/.+/,
} as const;

/**
 * User agent string for transparent bot identification
 */
export const USER_AGENT = {
  /** Default user agent for web requests */
  DEFAULT: 'Obsidianize/1.0 (+https://github.com/obsidianize; Content Processor Bot)',
  /** Short version for headers */
  SHORT: 'Obsidianize/1.0',
} as const;

/**
 * Feature flags and environment checks
 */
export const FEATURES = {
  /** Check if running in production */
  isProduction: () => process.env.NODE_ENV === 'production',
  /** Check if running in development */
  isDevelopment: () => process.env.NODE_ENV === 'development',
  /** Check if running in test mode */
  isTest: () => process.env.NODE_ENV === 'test',
} as const;

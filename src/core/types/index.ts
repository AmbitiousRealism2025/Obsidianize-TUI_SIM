/**
 * Core TypeScript Type Definitions for Obsidianize
 * Implements the complete "Gemini Gem" format specification
 *
 * Version: 1.0.0
 * Last Updated: October 11, 2024
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

/** Content source types supported by the system */
export enum ContentType {
  YOUTUBE = 'youtube',
  ARTICLE = 'article',
  PAPER = 'paper',
  PODCAST = 'podcast',
  TWITTER = 'twitter',
  UNKNOWN = 'unknown'
}

/** Processing status for content items */
export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

/** Analysis modes for content processing */
export enum AnalysisMode {
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
  ACADEMIC = 'academic'
}

/** Error categories for structured error handling */
export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AI_API = 'ai_api',
  PROCESSING = 'processing',
  AUTH = 'auth',
  RATE_LIMIT = 'rate_limit',
  SYSTEM = 'system'
}

/** Output format types */
export enum OutputFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  YAML = 'yaml'
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

/** Main Gemini Gem interface - the complete data structure */
export interface GeminiGem {
  frontmatter: GeminiGemFrontmatter;
  content: GeminiGemContent;
}

/** YAML frontmatter structure */
export interface GeminiGemFrontmatter {
  /** Content title (required) */
  title: string;

  /** Original source URL */
  source: string;

  /** Content type classification */
  type: ContentType;

  /** Processing timestamp */
  processed: Date;

  /** Content tags (normalized) */
  tags: string[];

  /** Extracted entities */
  entities: ExtractedEntity[];

  /** AI-generated insights */
  insights: string[];

  /** Additional metadata */
  metadata: Record<string, unknown>;

  /** Content confidence score (0-1) */
  confidence?: number;

  /** Processing duration in milliseconds */
  processingTime?: number;
}

/** Main content body structure */
export interface GeminiGemContent {
  /** Executive summary */
  summary: string;

  /** Key takeaways */
  keyPoints: string[];

  /** Structured content sections */
  sections: ContentSection[];

  /** Deep analysis and insights */
  analysis: string;

  /** Transcript (for video/audio) */
  transcript?: string;

  /** Related resources */
  relatedResources?: RelatedResource[];
}

/** Individual content section */
export interface ContentSection {
  /** Section identifier */
  id: string;

  /** Section heading */
  heading: string;

  /** Section content */
  content: string;

  /** Section type */
  type: SectionType;

  /** Section order */
  order: number;

  /** Subsections (optional) */
  subsections?: ContentSection[];
}

/** Section types for classification */
export enum SectionType {
  INTRODUCTION = 'introduction',
  METHODOLOGY = 'methodology',
  FINDINGS = 'findings',
  ANALYSIS = 'analysis',
  CONCLUSION = 'conclusion',
  REFERENCES = 'references',
  QUOTES = 'quotes',
  KEY_POINTS = 'key_points',
  CUSTOM = 'custom'
}

// ============================================================================
// ENTITY AND EXTRACTION TYPES
// ============================================================================

/** Extracted entity from content */
export interface ExtractedEntity {
  /** Entity text */
  text: string;

  /** Entity type */
  type: EntityType;

  /** Confidence score (0-1) */
  confidence: number;

  /** Context where entity was found */
  context: string;

  /** Position in content */
  position?: {
    start: number;
    end: number;
  };
}

/** Entity classification types */
export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  CONCEPT = 'concept',
  TECHNOLOGY = 'technology',
  DATE = 'date',
  STATISTIC = 'statistic',
  QUOTE = 'quote',
  CUSTOM = 'custom'
}

/** Related resource reference */
export interface RelatedResource {
  /** Resource title */
  title: string;

  /** Resource URL */
  url: string;

  /** Resource type */
  type: ContentType;

  /** Relevance score (0-1) */
  relevance: number;

  /** Brief description */
  description?: string;
}

// ============================================================================
// PROCESSING AND REQUEST TYPES
// ============================================================================

/** Main processing request */
export interface ProcessingRequest {
  /** Source URL or content */
  input: string | ContentInput;

  /** Processing options */
  options: ProcessingOptions;

  /** API authentication */
  auth: AuthConfig;

  /** Output preferences */
  output?: OutputConfig;
}

/** Content input alternatives */
export interface ContentInput {
  /** Direct text content */
  text?: string;

  /** File path */
  filePath?: string;

  /** Buffer content */
  buffer?: Buffer;

  /** Content type override */
  type?: ContentType;
}

/** Processing configuration options */
export interface ProcessingOptions {
  /** Analysis mode */
  analysisMode: AnalysisMode;

  /** Include timestamps in output */
  includeTimestamps: boolean;

  /** Include full transcript */
  includeTranscript: boolean;

  /** Custom prompts */
  customPrompts?: Record<string, string>;

  /** Output format */
  outputFormat: OutputFormat;

  /** Tag overrides */
  tagOverrides?: string[];

  /** Entity extraction enabled */
  extractEntities: boolean;

  /** Maximum processing time (ms) */
  timeoutMs?: number;

  /** Language preference */
  language?: string;
}

/** Authentication configuration */
export interface AuthConfig {
  /** API key (encrypted or plain) */
  apiKey: string;

  /** Key encryption status */
  encrypted: boolean;

  /** Key source */
  source: 'user' | 'environment' | 'service';

  /** Rate limiting configuration */
  rateLimits?: RateLimitConfig;
}

/** Rate limiting configuration */
export interface RateLimitConfig {
  /** Requests per minute */
  requestsPerMinute: number;

  /** Tokens per hour */
  tokensPerHour: number;

  /** Daily limit */
  dailyLimit: number;

  /** Burst allowance */
  burstAllowance: number;
}

/** Output configuration */
export interface OutputConfig {
  /** Output directory path */
  directory: string;

  /** Filename pattern */
  filenamePattern?: string;

  /** Create directories if needed */
  createDirectories: boolean;

  /** Overwrite existing files */
  overwrite: boolean;

  /** Include metadata file */
  includeMetadata: boolean;
}

// ============================================================================
// RESPONSE AND RESULT TYPES
// ============================================================================

/** Main processing result */
export interface ProcessingResult {
  /** Success status */
  success: boolean;

  /** Processed data (if successful) */
  data?: GeminiGem;

  /** Error information (if failed) */
  error?: ProcessingError;

  /** Processing metadata */
  metadata: ProcessingMetadata;
}

/** Processing metadata */
export interface ProcessingMetadata {
  /** Processing start time */
  startTime: Date;

  /** Processing end time */
  endTime: Date;

  /** Total duration in milliseconds */
  duration: number;

  /** Content source URL */
  sourceUrl: string;

  /** Content type detected */
  contentType: ContentType;

  /** Analysis mode used */
  analysisMode: AnalysisMode;

  /** AI tokens used */
  tokensUsed: number;

  /** Processing stages completed */
  stages: ProcessingStage[];

  /** Cache hit status */
  cacheHit: boolean;

  /** Retry attempts */
  retryAttempts: number;
}

/** Individual processing stage */
export interface ProcessingStage {
  /** Stage name */
  name: string;

  /** Stage status */
  status: ProcessingStatus;

  /** Stage start time */
  startTime: Date;

  /** Stage end time */
  endTime?: Date;

  /** Stage duration */
  duration?: number;

  /** Stage-specific data */
  data?: Record<string, unknown>;

  /** Stage errors */
  errors?: ProcessingError[];
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/** Structured processing error */
export interface ProcessingError {
  /** Error category */
  category: ErrorCategory;

  /** Error code */
  code: string;

  /** Human-readable message */
  message: string;

  /** Technical details */
  details?: Record<string, unknown>;

  /** Suggested resolution */
  suggestion?: string;

  /** Recovery possibility */
  recoverable: boolean;

  /** Error timestamp */
  timestamp: Date;

  /** Stack trace (development) */
  stack?: string;

  /** Retry count */
  retryCount?: number;
}

/** Validation result */
export interface ValidationResult {
  /** Validity status */
  valid: boolean;

  /** Validation errors */
  errors: ValidationError[];

  /** Validation warnings */
  warnings: ValidationWarning[];
}

/** Validation error details */
export interface ValidationError {
  /** Error field path */
  field: string;

  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Invalid value */
  value: unknown;

  /** Expected value/type */
  expected?: string;
}

/** Validation warning details */
export interface ValidationWarning {
  /** Warning field path */
  field: string;

  /** Warning code */
  code: string;

  /** Warning message */
  message: string;

  /** Warning value */
  value: unknown;
}

// ============================================================================
// AI API TYPES
// ============================================================================

/** Gemini API request configuration */
export interface GeminiRequestConfig {
  /** Model identifier */
  model: string;

  /** Request prompt */
  prompt: string;

  /** Context information */
  context?: string;

  /** Temperature (0-1) */
  temperature: number;

  /** Maximum tokens */
  maxTokens: number;

  /** Safety settings */
  safetySettings: SafetySettings;

  /** System instruction */
  systemInstruction?: string;
}

/** Gemini API response structure */
export interface GeminiResponse {
  /** Generated content */
  content: string;

  /** Tokens used */
  tokensUsed: number;

  /** Confidence score */
  confidence: number;

  /** Safety ratings */
  safetyRatings: SafetyRating[];

  /** Finish reason */
  finishReason: string;

  /** Response metadata */
  metadata: {
    model: string;
    timestamp: Date;
    processingTime: number;
  };
}

/** Safety settings configuration */
export interface SafetySettings {
  /** Block harassment */
  harassment: SafetyThreshold;

  /** Block hate speech */
  hateSpeech: SafetyThreshold;

  /** Block sexually explicit content */
  sexuallyExplicit: SafetyThreshold;

  /** Block dangerous content */
  dangerousContent: SafetyThreshold;
}

/** Safety threshold levels */
export enum SafetyThreshold {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  NONE = 'NONE'
}

/** Individual safety rating */
export interface SafetyRating {
  /** Category */
  category: string;

  /** Probability */
  probability: SafetyThreshold;

  /** Blocked status */
  blocked: boolean;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/** Complete user configuration */
export interface UserConfig {
  /** API configuration */
  api: APIConfig;

  /** User preferences */
  preferences: UserPreferences;

  /** Rate limiting */
  rateLimits: RateLimitConfig;

  /** Security settings */
  security: SecurityConfig;

  /** Output settings */
  output: OutputConfig;
}

/** API configuration */
export interface APIConfig {
  /** API provider */
  provider: 'gemini';

  /** Base URL */
  baseUrl: string;

  /** Default model */
  defaultModel: string;

  /** Request timeout */
  timeout: number;

  /** Retry configuration */
  retry: RetryConfig;
}

/** Retry configuration */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;

  /** Base delay in milliseconds */
  baseDelay: number;

  /** Maximum delay in milliseconds */
  maxDelay: number;

  /** Exponential backoff factor */
  backoffFactor: number;

  /** Jitter enabled */
  jitter: boolean;
}

/** User preferences */
export interface UserPreferences {
  /** Default analysis mode */
  analysisMode: AnalysisMode;

  /** Default output format */
  outputFormat: OutputFormat;

  /** Include timestamps by default */
  includeTimestamps: boolean;

  /** Include transcripts by default */
  includeTranscripts: boolean;

  /** Extract entities by default */
  extractEntities: boolean;

  /** Language preference */
  language: string;

  /** Custom prompts */
  customPrompts: Record<string, string>;

  /** Tag preferences */
  tagPreferences: TagPreferences;
}

/** Tag processing preferences */
export interface TagPreferences {
  /** Auto-generate tags */
  autoGenerate: boolean;

  /** Maximum number of tags */
  maxTags: number;

  /** Tag format (lowercase, uppercase, camelCase) */
  format: 'lowercase' | 'uppercase' | 'camelCase' | 'original';

  /** Tag prefixes to include */
  includePrefixes: string[];

  /** Tags to exclude */
  exclude: string[];
}

/** Security configuration */
export interface SecurityConfig {
  /** Encryption enabled */
  encryptionEnabled: boolean;

  /** Key derivation iterations */
  keyDerivationIterations: number;

  /** Session timeout (minutes) */
  sessionTimeout: number;

  /** Audit logging */
  auditLogging: boolean;

  /** Secure storage location */
  storageLocation: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Type guard for content types */
export type ContentTypeGuard = {
  youtube: (url: string) => boolean;
  article: (url: string) => boolean;
  paper: (url: string) => boolean;
  podcast: (url: string) => boolean;
  twitter: (url: string) => boolean;
};

/** Cache entry structure */
export interface CacheEntry<T = unknown> {
  /** Cached data */
  data: T;

  /** Entry timestamp */
  timestamp: Date;

  /** Time-to-live in seconds */
  ttl: number;

  /** Access count */
  accessCount: number;

  /** Last access time */
  lastAccessed: Date;

  /** Cache key */
  key: string;
}

/** Progress tracking information */
export interface ProgressInfo {
  /** Current processing stage */
  stage: ProcessingStage | string;

  /** Progress percentage (0-100) */
  progress: number;

  /** Status message */
  message: string;

  /** Time elapsed in milliseconds */
  timeElapsed: number;

  /** Estimated remaining time */
  estimatedTimeRemaining?: number;

  /** Current operation details */
  currentOperation?: string;
}

/** File naming convention */
export interface FilenameConfig {
  /** Pattern template */
  pattern: string;

  /** Include timestamp */
  includeTimestamp: boolean;

  /** Max filename length */
  maxLength: number;

  /** Character replacements */
  replacements: Record<string, string>;

  /** Reserved filenames to avoid */
  reservedNames: string[];
}

/** Processor configuration */
export interface ProcessorConfig {
  /** AI provider configuration */
  aiProvider: {
    name: string;
    apiKey: string;
    model?: string;
    baseUrl?: string;
  };

  /** Processing options */
  processing: {
    timeout: number;
    maxRetries: number;
    batchSize: number;
    enableCache: boolean;
  };

  /** Output configuration */
  output: {
    directory: string;
    format: OutputFormat;
    includeMetadata: boolean;
    createDirectories: boolean;
  };

  /** Feature flags */
  features: {
    contentExtraction: boolean;
    entityExtraction: boolean;
    sentimentAnalysis: boolean;
    qualityScoring: boolean;
  };
}

// ============================================================================
// ENUM EXPORTS
// ============================================================================

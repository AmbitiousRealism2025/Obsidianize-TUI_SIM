# Obsidianize TUI - API Specifications

**Version**: 1.0  
**Created**: October 11, 2024  
**Companion to**: [DESIGN_DOCUMENT.md](./DESIGN_DOCUMENT.md)

## Table of Contents

1. [Core Processing API](#core-processing-api)
2. [Gemini AI Integration API](#gemini-ai-integration-api)
3. [Authentication & Security API](#authentication--security-api)
4. [Configuration Management API](#configuration-management-api)
5. [Content Processing API](#content-processing-api)
6. [Output Generation API](#output-generation-api)
7. [Error Handling API](#error-handling-api)
8. [Web Interface API](#web-interface-api)
9. [CLI Interface API](#cli-interface-api)
10. [Type Definitions](#type-definitions)

---

## Core Processing API

### Main Processing Function

```typescript
/**
 * Main content processing function - shared by both Web and CLI interfaces
 */
export async function processContent(
  request: ProcessContentRequest
): Promise<ProcessingResult>

interface ProcessContentRequest {
  /** Source URL to process */
  url: string;
  
  /** Processing configuration */
  options: ProcessingOptions;
  
  /** Gemini API key for AI processing */
  apiKey: string;
  
  /** Optional output file path (for CLI) */
  outputPath?: string;
  
  /** Progress callback for real-time updates */
  onProgress?: (progress: ProgressUpdate) => void;
  
  /** Cancellation token for aborting processing */
  cancelToken?: CancellationToken;
}

interface ProcessingOptions {
  /** AI analysis depth level */
  analysisMode: 'standard' | 'enhanced' | 'academic';
  
  /** Include timestamp markers in output */
  includeTimestamps: boolean;
  
  /** Include full transcript/content in output */
  includeTranscript: boolean;
  
  /** Custom AI prompts for specific analysis */
  customPrompts?: CustomPromptConfig;
  
  /** Output format preference */
  outputFormat: 'markdown' | 'json' | 'yaml';
  
  /** Manual tag overrides */
  tagOverrides?: string[];
  
  /** Language preference for analysis */
  language?: string;
  
  /** Maximum processing time in seconds */
  timeoutSeconds?: number;
}

interface ProcessingResult {
  /** Processing success status */
  success: boolean;
  
  /** Processed content data (if successful) */
  data?: ProcessedContent;
  
  /** Error information (if failed) */
  error?: ProcessingError;
  
  /** Processing metadata and statistics */
  metadata: ProcessingMetadata;
  
  /** Generated filename */
  filename?: string;
  
  /** Processing performance metrics */
  performance: PerformanceMetrics;
}
```

### Progress Tracking

```typescript
interface ProgressUpdate {
  /** Current processing stage */
  stage: ProcessingStage;
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Current stage description */
  message: string;
  
  /** Time elapsed in milliseconds */
  timeElapsed: number;
  
  /** Estimated time remaining (if calculable) */
  estimatedTimeRemaining?: number;
  
  /** Additional stage-specific data */
  stageData?: Record<string, any>;
}

enum ProcessingStage {
  INITIALIZING = 'initializing',
  VALIDATING_URL = 'validating_url',
  FETCHING_CONTENT = 'fetching_content',
  ANALYZING_AI = 'analyzing_ai',
  PROCESSING_CONTENT = 'processing_content',
  GENERATING_OUTPUT = 'generating_output',
  FINALIZING = 'finalizing',
  COMPLETE = 'complete',
  ERROR = 'error'
}
```

---

## Gemini AI Integration API

### GeminiClient

```typescript
/**
 * Core Gemini API client for AI-powered content analysis
 */
export class GeminiClient {
  constructor(config: GeminiClientConfig);
  
  /**
   * Analyze content using Gemini AI
   */
  async analyzeContent(request: AIAnalysisRequest): Promise<AIAnalysisResult>;
  
  /**
   * Generate structured insights from analysis
   */
  async generateInsights(
    analysis: AIAnalysisResult,
    insightType: InsightType
  ): Promise<GeneratedInsight[]>;
  
  /**
   * Validate API key and check permissions
   */
  async validateApiKey(): Promise<KeyValidationResult>;
  
  /**
   * Get current usage information
   */
  async getUsageInfo(): Promise<UsageInfo>;
  
  /**
   * Test connection with minimal request
   */
  async healthCheck(): Promise<HealthCheckResult>;
}

interface GeminiClientConfig {
  /** Gemini API key */
  apiKey: string;
  
  /** Model to use for processing */
  model: 'gemini-pro' | 'gemini-pro-vision' | 'gemini-1.5-pro';
  
  /** Temperature for AI responses (0.0-1.0) */
  temperature: number;
  
  /** Maximum tokens per request */
  maxTokens: number;
  
  /** Rate limiting configuration */
  rateLimits: RateLimitConfig;
  
  /** Safety settings */
  safetySettings: SafetySettings;
  
  /** Request timeout in milliseconds */
  timeoutMs: number;
}

interface AIAnalysisRequest {
  /** Source URL */
  url: string;
  
  /** Raw content to analyze */
  content: string;
  
  /** Content type for specialized analysis */
  contentType: ContentType;
  
  /** Analysis depth/mode */
  analysisMode: AnalysisMode;
  
  /** Additional context for AI */
  context?: string;
  
  /** Specific questions to answer */
  focusQuestions?: string[];
}

interface AIAnalysisResult {
  /** Generated summary */
  summary: string;
  
  /** Key points extracted */
  keyPoints: string[];
  
  /** Identified entities */
  entities: ExtractedEntities;
  
  /** Topic categories */
  topics: string[];
  
  /** Generated insights */
  insights: GeneratedInsight[];
  
  /** Enhanced metadata */
  metadata: AIEnhancedMetadata;
  
  /** Confidence score (0.0-1.0) */
  confidence: number;
  
  /** Processing time in milliseconds */
  processingTime: number;
  
  /** Token usage information */
  tokenUsage: TokenUsage;
}
```

### AI Content Types and Analysis

```typescript
enum ContentType {
  YOUTUBE_VIDEO = 'youtube_video',
  WEB_ARTICLE = 'web_article',
  ACADEMIC_PAPER = 'academic_paper',
  PODCAST = 'podcast',
  PRESENTATION = 'presentation',
  DOCUMENTATION = 'documentation',
  UNKNOWN = 'unknown'
}

enum AnalysisMode {
  STANDARD = 'standard',      // Basic summary and key points
  ENHANCED = 'enhanced',      // Detailed analysis with insights
  ACADEMIC = 'academic',      // Academic-style analysis
  TECHNICAL = 'technical',    // Technical documentation focus
  CREATIVE = 'creative'       // Creative content analysis
}

interface ExtractedEntities {
  /** People mentioned */
  people: NamedEntity[];
  
  /** Organizations mentioned */
  organizations: NamedEntity[];
  
  /** Products/services mentioned */
  products: NamedEntity[];
  
  /** Locations mentioned */
  locations: NamedEntity[];
  
  /** Technical concepts */
  concepts: NamedEntity[];
  
  /** Tools/technologies */
  technologies: NamedEntity[];
}

interface NamedEntity {
  /** Entity name */
  name: string;
  
  /** Entity type */
  type: string;
  
  /** Relevance score (0.0-1.0) */
  relevance: number;
  
  /** First occurrence position */
  firstMention: number;
  
  /** Total mention count */
  mentionCount: number;
}

interface GeneratedInsight {
  /** Insight type */
  type: InsightType;
  
  /** Insight content */
  content: string;
  
  /** Supporting evidence */
  evidence: string[];
  
  /** Confidence level (0.0-1.0) */
  confidence: number;
  
  /** Source references */
  sources: string[];
}

enum InsightType {
  KEY_TAKEAWAY = 'key_takeaway',
  ACTIONABLE_ADVICE = 'actionable_advice',
  IMPORTANT_QUOTE = 'important_quote',
  TECHNICAL_DETAIL = 'technical_detail',
  FOLLOW_UP_QUESTION = 'follow_up_question',
  RELATED_CONCEPT = 'related_concept'
}
```

---

## Authentication & Security API

### ApiKeyManager

```typescript
/**
 * Secure API key management with encryption
 */
export class ApiKeyManager {
  constructor(config: KeyManagerConfig);
  
  /**
   * Validate API key format and permissions
   */
  async validateKey(key: string): Promise<KeyValidationResult>;
  
  /**
   * Encrypt API key for storage
   */
  async encryptKey(
    key: string, 
    passphrase?: string
  ): Promise<EncryptedKeyData>;
  
  /**
   * Decrypt stored API key
   */
  async decryptKey(
    encryptedData: EncryptedKeyData, 
    passphrase?: string
  ): Promise<string>;
  
  /**
   * Store encrypted key securely
   */
  async storeKey(
    config: ApiKeyConfig, 
    storage: StorageProvider
  ): Promise<void>;
  
  /**
   * Retrieve and decrypt stored key
   */
  async retrieveKey(storage: StorageProvider): Promise<ApiKeyConfig | null>;
  
  /**
   * Rotate API key (update with new key)
   */
  async rotateKey(oldKey: string, newKey: string): Promise<void>;
  
  /**
   * Clear all stored keys
   */
  async clearKeys(): Promise<void>;
}

interface KeyManagerConfig {
  /** Encryption algorithm to use */
  encryptionAlgorithm: 'aes-256-gcm';
  
  /** Key derivation function */
  keyDerivation: 'pbkdf2' | 'scrypt';
  
  /** Encryption iterations */
  iterations: number;
  
  /** Salt length in bytes */
  saltLength: number;
}

interface KeyValidationResult {
  /** Validation success status */
  valid: boolean;
  
  /** Key permissions/scopes */
  permissions: string[];
  
  /** Key expiration date (if any) */
  expiresAt?: Date;
  
  /** Associated usage limits */
  limits: UsageLimits;
  
  /** Error message (if invalid) */
  error?: string;
}

interface EncryptedKeyData {
  /** Encrypted key content */
  encrypted: string;
  
  /** Encryption salt */
  salt: string;
  
  /** Initialization vector */
  iv: string;
  
  /** Authentication tag */
  authTag: string;
  
  /** Encryption algorithm used */
  algorithm: string;
  
  /** Creation timestamp */
  createdAt: Date;
}

interface ApiKeyConfig {
  /** The actual API key */
  key: string;
  
  /** Whether the key is encrypted */
  encrypted: boolean;
  
  /** Key source */
  source: 'user' | 'service' | 'environment';
  
  /** Key permissions */
  permissions: string[];
  
  /** Key expiration */
  expiresAt?: Date;
  
  /** Usage limits */
  limits: UsageLimits;
}
```

### Rate Limiting

```typescript
/**
 * Rate limiting and usage tracking
 */
export class RateLimitManager {
  constructor(config: RateLimitManagerConfig);
  
  /**
   * Check if request is within rate limits
   */
  async checkLimit(keyId: string): Promise<LimitCheckResult>;
  
  /**
   * Record usage for a request
   */
  async recordUsage(
    keyId: string, 
    usage: UsageRecord
  ): Promise<void>;
  
  /**
   * Get remaining quota for key
   */
  async getRemainingQuota(keyId: string): Promise<QuotaInfo>;
  
  /**
   * Wait for rate limit reset
   */
  async waitForReset(keyId: string): Promise<void>;
  
  /**
   * Get usage history
   */
  async getUsageHistory(
    keyId: string, 
    timeRange: TimeRange
  ): Promise<UsageHistory>;
}

interface RateLimitConfig {
  /** Requests per minute */
  requestsPerMinute: number;
  
  /** Tokens per hour */
  tokensPerHour: number;
  
  /** Daily request limit */
  dailyLimit: number;
  
  /** Burst allowance */
  burstAllowance: number;
  
  /** Reset window in milliseconds */
  resetWindow: number;
}

interface LimitCheckResult {
  /** Whether request is allowed */
  allowed: boolean;
  
  /** Remaining requests in window */
  remaining: number;
  
  /** Reset time for current window */
  resetTime: Date;
  
  /** Retry delay if not allowed (ms) */
  retryAfter?: number;
  
  /** Detailed limit status */
  limits: {
    requests: LimitStatus;
    tokens: LimitStatus;
    daily: LimitStatus;
  };
}

interface UsageRecord {
  /** Timestamp of usage */
  timestamp: Date;
  
  /** Tokens consumed */
  tokens: number;
  
  /** Request type */
  requestType: string;
  
  /** Processing time */
  processingTime: number;
  
  /** Success status */
  success: boolean;
}
```

---

## Configuration Management API

### ConfigManager

```typescript
/**
 * Application configuration management
 */
export class ConfigManager {
  /**
   * Load configuration from file or environment
   */
  static async loadConfig(configPath?: string): Promise<UserConfig>;
  
  /**
   * Save configuration to file
   */
  static async saveConfig(
    config: UserConfig, 
    configPath?: string
  ): Promise<void>;
  
  /**
   * Validate configuration structure and values
   */
  static async validateConfig(
    config: Partial<UserConfig>
  ): Promise<ConfigValidationResult>;
  
  /**
   * Migrate configuration from older version
   */
  static async migrateConfig(
    oldVersion: number, 
    newVersion: number
  ): Promise<MigrationResult>;
  
  /**
   * Reset configuration to defaults
   */
  static async resetConfig(configPath?: string): Promise<void>;
  
  /**
   * Get default configuration
   */
  static getDefaultConfig(): UserConfig;
}

interface UserConfig {
  /** Configuration version */
  version: string;
  
  /** API key configuration */
  apiKey: ApiKeyConfig;
  
  /** User preferences */
  preferences: UserPreferences;
  
  /** Rate limiting settings */
  rateLimits: RateLimitConfig;
  
  /** Output settings */
  output: OutputConfig;
  
  /** Advanced settings */
  advanced: AdvancedConfig;
  
  /** Configuration metadata */
  metadata: ConfigMetadata;
}

interface UserPreferences {
  /** Default analysis mode */
  defaultAnalysisMode: AnalysisMode;
  
  /** Default output directory */
  outputDirectory: string;
  
  /** Include timestamps by default */
  includeTimestamps: boolean;
  
  /** Include transcripts by default */
  includeTranscripts: boolean;
  
  /** Custom prompt templates */
  customPrompts: Record<string, string>;
  
  /** Preferred language */
  language: string;
  
  /** Theme/styling preferences */
  theme: ThemeConfig;
}

interface OutputConfig {
  /** Default output format */
  format: 'markdown' | 'json' | 'yaml';
  
  /** Filename template */
  filenameTemplate: string;
  
  /** Directory structure template */
  directoryTemplate: string;
  
  /** Frontmatter options */
  frontmatter: FrontmatterConfig;
  
  /** Content structure options */
  structure: ContentStructureConfig;
}
```

---

## Content Processing API

### ContentProcessor

```typescript
/**
 * Main content processing pipeline
 */
export class ContentProcessor {
  constructor(config: ProcessorConfig);
  
  /**
   * Process content from URL to final output
   */
  async processUrl(
    url: string, 
    options: ProcessingOptions,
    progressCallback?: ProgressCallback
  ): Promise<ProcessingResult>;
  
  /**
   * Process raw content directly
   */
  async processContent(
    content: string,
    metadata: ContentMetadata,
    options: ProcessingOptions
  ): Promise<ProcessingResult>;
  
  /**
   * Detect content type from URL or content
   */
  async detectContentType(
    url: string, 
    content?: string
  ): Promise<ContentTypeResult>;
  
  /**
   * Extract metadata from content
   */
  async extractMetadata(
    url: string,
    content: string,
    contentType: ContentType
  ): Promise<ExtractedMetadata>;
}

interface ProcessorConfig {
  /** AI client for processing */
  aiClient: GeminiClient;
  
  /** Content fetching configuration */
  fetcher: FetcherConfig;
  
  /** Output generation configuration */
  generator: GeneratorConfig;
  
  /** Caching configuration */
  cache: CacheConfig;
  
  /** Processing timeouts */
  timeouts: TimeoutConfig;
}

interface ContentTypeResult {
  /** Detected content type */
  type: ContentType;
  
  /** Confidence in detection (0.0-1.0) */
  confidence: number;
  
  /** Content characteristics */
  characteristics: ContentCharacteristics;
  
  /** Suggested processing options */
  suggestedOptions: Partial<ProcessingOptions>;
}

interface ExtractedMetadata {
  /** Content title */
  title: string;
  
  /** Content description */
  description: string;
  
  /** Author/creator information */
  author: AuthorInfo;
  
  /** Publication date */
  publishedAt: Date;
  
  /** Content duration (if applicable) */
  duration: Duration;
  
  /** Content language */
  language: string;
  
  /** Content tags/keywords */
  tags: string[];
  
  /** Content categories */
  categories: string[];
  
  /** Content statistics */
  stats: ContentStats;
}
```

### Content Fetching

```typescript
/**
 * Universal content fetching with type-specific handlers
 */
export class ContentFetcher {
  /**
   * Fetch content from any supported URL
   */
  async fetchContent(url: string): Promise<FetchResult>;
  
  /**
   * Fetch YouTube video content and metadata
   */
  async fetchYouTubeContent(url: string): Promise<YouTubeContent>;
  
  /**
   * Fetch web article content
   */
  async fetchWebContent(url: string): Promise<WebContent>;
  
  /**
   * Fetch academic paper content
   */
  async fetchPaperContent(url: string): Promise<PaperContent>;
  
  /**
   * Check if URL is supported
   */
  async isSupported(url: string): Promise<boolean>;
}

interface FetchResult {
  /** Source URL */
  url: string;
  
  /** Fetched content */
  content: string;
  
  /** Content metadata */
  metadata: ContentMetadata;
  
  /** Content type */
  type: ContentType;
  
  /** Fetch success status */
  success: boolean;
  
  /** Fetch timestamp */
  fetchedAt: Date;
  
  /** Content size in bytes */
  size: number;
}

interface YouTubeContent extends FetchResult {
  /** Video ID */
  videoId: string;
  
  /** Video transcript */
  transcript: TranscriptSegment[];
  
  /** Video metadata */
  videoInfo: YouTubeVideoInfo;
  
  /** Channel information */
  channel: YouTubeChannelInfo;
  
  /** Comment data (if enabled) */
  comments?: YouTubeComment[];
}

interface TranscriptSegment {
  /** Segment text */
  text: string;
  
  /** Start time in seconds */
  start: number;
  
  /** Duration in seconds */
  duration: number;
  
  /** Confidence score (if available) */
  confidence?: number;
}
```

---

## Output Generation API

### MarkdownAssembler

```typescript
/**
 * Generate final markdown output with AI insights
 */
export class MarkdownAssembler {
  constructor(config: AssemblerConfig);
  
  /**
   * Generate complete markdown document
   */
  async generateMarkdown(
    content: ProcessedContent,
    template?: MarkdownTemplate
  ): Promise<GeneratedMarkdown>;
  
  /**
   * Generate YAML frontmatter
   */
  generateFrontmatter(
    metadata: ProcessingMetadata,
    insights: GeneratedInsight[]
  ): string;
  
  /**
   * Generate structured content sections
   */
  generateContentSections(
    analysis: AIAnalysisResult,
    options: SectionOptions
  ): ContentSection[];
  
  /**
   * Generate filename following conventions
   */
  generateFilename(
    url: string,
    metadata: ContentMetadata,
    template?: string
  ): string;
}

interface GeneratedMarkdown {
  /** Complete markdown content */
  content: string;
  
  /** Generated filename */
  filename: string;
  
  /** Content statistics */
  stats: ContentStats;
  
  /** Generation metadata */
  generationInfo: GenerationMetadata;
}

interface MarkdownTemplate {
  /** Frontmatter template */
  frontmatter: string;
  
  /** Content section templates */
  sections: Record<string, string>;
  
  /** Custom formatting rules */
  formatting: FormattingRules;
}

interface ContentSection {
  /** Section type */
  type: SectionType;
  
  /** Section title */
  title: string;
  
  /** Section content */
  content: string;
  
  /** Section order/priority */
  order: number;
  
  /** Whether section is required */
  required: boolean;
}

enum SectionType {
  TLDR = 'tldr',
  EXECUTIVE_SUMMARY = 'executive_summary',
  KEY_TOPICS = 'key_topics',
  TIMELINE = 'timeline',
  QUOTES = 'quotes',
  GLOSSARY = 'glossary',
  CLAIMS_EVIDENCE = 'claims_evidence',
  ACTIONABLE_INSIGHTS = 'actionable_insights',
  OPEN_QUESTIONS = 'open_questions',
  SOURCE_NOTES = 'source_notes',
  REFERENCES = 'references'
}
```

---

## Error Handling API

### ErrorManager

```typescript
/**
 * Centralized error handling and recovery
 */
export class ErrorManager {
  /**
   * Handle and classify errors
   */
  static handleError(error: unknown): ProcessingError;
  
  /**
   * Attempt error recovery
   */
  static async attemptRecovery(
    error: ProcessingError,
    context: ErrorContext
  ): Promise<RecoveryResult>;
  
  /**
   * Log error with appropriate level
   */
  static logError(error: ProcessingError, context?: ErrorContext): void;
  
  /**
   * Generate user-friendly error message
   */
  static formatUserMessage(
    error: ProcessingError,
    interface: 'web' | 'cli'
  ): string;
}

interface ProcessingError {
  /** Error category */
  category: ErrorCategory;
  
  /** Specific error code */
  code: string;
  
  /** Human-readable message */
  message: string;
  
  /** Technical details */
  details?: Record<string, any>;
  
  /** User-friendly suggestion */
  suggestion?: string;
  
  /** Whether error is recoverable */
  recoverable: boolean;
  
  /** Error timestamp */
  timestamp: Date;
  
  /** Stack trace (for debugging) */
  stack?: string;
  
  /** Related/caused by error */
  cause?: Error;
}

enum ErrorCategory {
  VALIDATION = 'validation',        // Input validation errors
  NETWORK = 'network',             // Network/connectivity errors
  AI_API = 'ai_api',              // Gemini API errors
  PROCESSING = 'processing',       // Content processing errors
  AUTH = 'auth',                  // Authentication errors
  RATE_LIMIT = 'rate_limit',      // Rate limiting errors
  SYSTEM = 'system',              // System/runtime errors
  USER_CONFIG = 'user_config',    // Configuration errors
  CONTENT_FETCH = 'content_fetch' // Content fetching errors
}

interface ErrorContext {
  /** Operation being performed */
  operation: string;
  
  /** Input parameters */
  inputs: Record<string, any>;
  
  /** Processing stage */
  stage: ProcessingStage;
  
  /** User interface type */
  interface: 'web' | 'cli';
  
  /** Additional context data */
  context: Record<string, any>;
}

interface RecoveryResult {
  /** Recovery success status */
  success: boolean;
  
  /** Whether to retry original operation */
  shouldRetry: boolean;
  
  /** Delay before retry (milliseconds) */
  retryDelay?: number;
  
  /** Alternative action to take */
  fallbackAction?: string;
  
  /** Recovery message for user */
  message?: string;
}
```

---

## Web Interface API

### Web Server Endpoints

```typescript
/**
 * Web server API endpoints
 */
export const webRoutes = {
  /** Main application page */
  'GET /': handleHomePage,
  
  /** Process content endpoint */
  'POST /api/process': handleProcessContent,
  
  /** Validate API key */
  'POST /api/validate-key': handleValidateKey,
  
  /** Get processing status */
  'GET /api/status/:jobId': handleGetStatus,
  
  /** Cancel processing */
  'DELETE /api/process/:jobId': handleCancelProcessing,
  
  /** WebSocket for real-time updates */
  'WS /ws/progress': handleProgressWebSocket,
  
  /** Health check */
  'GET /api/health': handleHealthCheck
};

interface ProcessContentRequest {
  /** Source URL */
  url: string;
  
  /** Gemini API key */
  apiKey: string;
  
  /** Processing options */
  options: ProcessingOptions;
  
  /** Job ID for tracking */
  jobId?: string;
}

interface ProcessContentResponse {
  /** Job ID for tracking */
  jobId: string;
  
  /** Processing result (if completed) */
  result?: ProcessingResult;
  
  /** Current status */
  status: 'pending' | 'processing' | 'completed' | 'error';
  
  /** Progress information */
  progress: ProgressUpdate;
  
  /** Estimated completion time */
  eta?: Date;
}

interface WebSocketProgressMessage {
  /** Message type */
  type: 'progress' | 'complete' | 'error';
  
  /** Job ID */
  jobId: string;
  
  /** Progress data */
  data: ProgressUpdate | ProcessingResult | ProcessingError;
  
  /** Message timestamp */
  timestamp: Date;
}
```

---

## CLI Interface API

### Command Definitions

```typescript
/**
 * CLI command structure and handlers
 */
export const cliCommands = {
  /** Main processing command */
  process: {
    description: 'Process content from URL',
    usage: 'obsidianize <url> [options]',
    handler: handleProcessCommand,
    options: processCommandOptions
  },
  
  /** Interactive mode */
  interactive: {
    description: 'Start interactive processing mode',
    usage: 'obsidianize',
    handler: handleInteractiveMode,
    options: []
  },
  
  /** Setup command */
  setup: {
    description: 'Configure API key and settings',
    usage: 'obsidianize setup',
    handler: handleSetupCommand,
    options: setupCommandOptions
  },
  
  /** Configuration management */
  config: {
    description: 'Manage configuration',
    usage: 'obsidianize config <action>',
    handler: handleConfigCommand,
    options: configCommandOptions
  },
  
  /** Batch processing */
  batch: {
    description: 'Process multiple URLs from file',
    usage: 'obsidianize batch <file> [options]',
    handler: handleBatchCommand,
    options: batchCommandOptions
  }
};

interface CLICommandOptions {
  /** Long option name */
  long: string;
  
  /** Short option alias */
  short?: string;
  
  /** Option description */
  description: string;
  
  /** Option type */
  type: 'string' | 'boolean' | 'number';
  
  /** Default value */
  default?: any;
  
  /** Whether option is required */
  required?: boolean;
  
  /** Possible values (for validation) */
  choices?: string[];
}

interface CLICommandResult {
  /** Command success status */
  success: boolean;
  
  /** Exit code */
  exitCode: number;
  
  /** Output message */
  message?: string;
  
  /** Result data */
  data?: any;
  
  /** Error information */
  error?: ProcessingError;
}
```

---

## Type Definitions

### Core Types

```typescript
/**
 * Shared type definitions used across all components
 */

/** Content duration representation */
interface Duration {
  /** Total seconds */
  seconds: number;
  
  /** ISO 8601 duration string */
  iso8601: string;
  
  /** Human-readable format */
  humanReadable: string;
}

/** Author/creator information */
interface AuthorInfo {
  /** Author name */
  name: string;
  
  /** Author URL/profile */
  url?: string;
  
  /** Author avatar */
  avatar?: string;
  
  /** Verification status */
  verified?: boolean;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/** Content statistics */
interface ContentStats {
  /** Word count */
  words: number;
  
  /** Character count */
  characters: number;
  
  /** Estimated reading time (minutes) */
  readingTime: number;
  
  /** Number of sections */
  sections: number;
  
  /** Number of insights generated */
  insights: number;
}

/** Token usage tracking */
interface TokenUsage {
  /** Input tokens */
  input: number;
  
  /** Output tokens */
  output: number;
  
  /** Total tokens */
  total: number;
  
  /** Estimated cost */
  estimatedCost?: number;
}

/** Performance metrics */
interface PerformanceMetrics {
  /** Total processing time (ms) */
  totalTime: number;
  
  /** Content fetching time (ms) */
  fetchTime: number;
  
  /** AI analysis time (ms) */
  analysisTime: number;
  
  /** Output generation time (ms) */
  generationTime: number;
  
  /** Memory usage (bytes) */
  memoryUsage: number;
  
  /** CPU time (ms) */
  cpuTime: number;
}
```

### YouTube-Specific Types

```typescript
interface YouTubeVideoInfo {
  /** Video ID */
  id: string;
  
  /** Video title */
  title: string;
  
  /** Video description */
  description: string;
  
  /** Video duration */
  duration: Duration;
  
  /** Upload date */
  uploadDate: Date;
  
  /** View count */
  views: number;
  
  /** Like count */
  likes?: number;
  
  /** Comment count */
  comments?: number;
  
  /** Video thumbnail URLs */
  thumbnails: Record<string, string>;
  
  /** Video tags */
  tags: string[];
  
  /** Video category */
  category: string;
  
  /** Language */
  language: string;
  
  /** Captions available */
  captionsAvailable: boolean;
}

interface YouTubeChannelInfo {
  /** Channel ID */
  id: string;
  
  /** Channel name */
  name: string;
  
  /** Channel URL */
  url: string;
  
  /** Subscriber count */
  subscribers?: number;
  
  /** Channel avatar */
  avatar?: string;
  
  /** Verification status */
  verified: boolean;
  
  /** Channel description */
  description?: string;
}

interface YouTubeComment {
  /** Comment ID */
  id: string;
  
  /** Comment text */
  text: string;
  
  /** Author name */
  author: string;
  
  /** Like count */
  likes: number;
  
  /** Comment timestamp */
  timestamp: Date;
  
  /** Whether comment is pinned */
  pinned: boolean;
  
  /** Reply count */
  replies: number;
}
```

### Configuration Types

```typescript
interface ThemeConfig {
  /** Color scheme */
  colorScheme: 'purple' | 'green' | 'blue' | 'custom';
  
  /** Custom colors (if scheme is 'custom') */
  customColors?: Record<string, string>;
  
  /** Font preferences */
  font: FontConfig;
  
  /** Terminal styling */
  terminal: TerminalStyleConfig;
}

interface FontConfig {
  /** Font family */
  family: string;
  
  /** Font size */
  size: number;
  
  /** Line height */
  lineHeight: number;
  
  /** Font weight */
  weight: 'normal' | 'bold';
}

interface TerminalStyleConfig {
  /** Show window decorations */
  showDecorations: boolean;
  
  /** Terminal opacity */
  opacity: number;
  
  /** Cursor style */
  cursor: 'block' | 'line' | 'underline';
  
  /** Cursor blinking */
  cursorBlink: boolean;
}
```

---

This API specification document provides the complete interface definitions needed for implementing all system components. Each interface is designed to be type-safe, extensible, and compatible with both Web and CLI implementations.

The specifications follow TypeScript conventions and include comprehensive error handling, progress tracking, and configuration management. All APIs are designed with security, performance, and user experience as primary concerns.

<citations>
<document>
<document_type>RULE</document_type>
<document_id>/Users/ambrealismwork/Desktop/Coding-Projects/Obsidianize-TUI_SIM/agents.md</document_id>
</document>
</citations>
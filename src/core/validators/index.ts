/**
 * Comprehensive Validation Framework for Obsidianize
 * Implements Zod-based validation for all data structures
 *
 * Version: 1.1.0
 * Last Updated: November 27, 2025
 */

import { z } from 'zod';

import {
  ContentType,
  ProcessingStatus,
  AnalysisMode,
  ErrorCategory,
  OutputFormat,
  EntityType,
  SafetyThreshold
} from '../types/index.js';
import { ssrfProtection, type SSRFValidationResult } from './ssrf-protection.js';
import {
  ApiKeyValidator as NewApiKeyValidator,
  validateApiKeyFormat,
  validateGeminiKey,
  type ApiKeyValidationResult
} from './api-key-validator.js';
import type {
  GeminiGem,
  ProcessingRequest,
  ProcessingOptions,
  AuthConfig,
  ProcessingResult,
  ProcessingError,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  UserConfig,
  GeminiRequestConfig,
  GeminiResponse
} from '../types/index.js';
// Using the enums imported above
const ContentTypeEnum = ContentType;
const ProcessingStatusEnum = ProcessingStatus;
const AnalysisModeEnum = AnalysisMode;
const ErrorCategoryEnum = ErrorCategory;
const OutputFormatEnum = OutputFormat;
const EntityTypeEnum = EntityType;
const SafetyThresholdEnum = SafetyThreshold;

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/** ISO date string validation */
const dateSchema = z.string().datetime().transform((str) => new Date(str));

/** Non-empty string validation */
const nonEmptyString = z.string().min(1, 'String cannot be empty');

/** URL validation with HTTPS requirement */
const httpsUrlSchema = z.string().url('Must be a valid URL').refine(
  (url) => url.startsWith('https://'),
  { message: 'URL must use HTTPS protocol' }
);

/** Generic identifier schema */
const idSchema = z.string().min(1).max(100);

/** Confidence score validation (0-1) */
const confidenceSchema = z.number().min(0).max(1);

/** Processing time validation (milliseconds) */
const processingTimeSchema = z.number().min(0);

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

/** Content type enum schema */
const contentTypeSchema = z.nativeEnum(ContentTypeEnum);

/** Processing status enum schema */
const processingStatusSchema = z.nativeEnum(ProcessingStatusEnum);

/** Analysis mode enum schema */
const analysisModeSchema = z.nativeEnum(AnalysisModeEnum);

/** Error category enum schema */
const errorCategorySchema = z.nativeEnum(ErrorCategoryEnum);

/** Output format enum schema */
const outputFormatSchema = z.nativeEnum(OutputFormatEnum);

/** Entity type enum schema */
const entityTypeSchema = z.nativeEnum(EntityTypeEnum);

/** Safety threshold enum schema */
const safetyThresholdSchema = z.nativeEnum(SafetyThresholdEnum);

// ============================================================================
// ENTITY AND CONTENT SCHEMAS
// ============================================================================

/** Extracted entity schema */
const extractedEntitySchema = z.object({
  text: nonEmptyString.max(500, 'Entity text too long'),
  type: entityTypeSchema,
  confidence: confidenceSchema,
  context: z.string().max(1000, 'Context too long'),
  position: z.object({
    start: z.number().min(0),
    end: z.number().min(0)
  }).optional()
});

/** Related resource schema */
const relatedResourceSchema = z.object({
  title: nonEmptyString.max(200, 'Resource title too long'),
  url: httpsUrlSchema,
  type: contentTypeSchema,
  relevance: confidenceSchema,
  description: z.string().max(500, 'Description too long').optional()
});

/** Content section schema */
const contentSectionSchema: z.ZodType<any> = z.object({
  id: idSchema,
  heading: nonEmptyString.max(200, 'Section heading too long'),
  content: z.string().min(10, 'Section content too short').max(10000, 'Section content too long'),
  type: z.string().min(1, 'Section type required'),
  order: z.number().int().min(0, 'Section order must be non-negative integer'),
  subsections: z.array(z.lazy(() => contentSectionSchema)).optional()
});

/** Gemini Gem content schema */
const geminiGemContentSchema = z.object({
  summary: z.string().min(50, 'Summary too short').max(5000, 'Summary too long'),
  keyPoints: z.array(
    nonEmptyString.min(10, 'Key point too short').max(500, 'Key point too long')
  ).min(1, 'At least one key point required').max(20, 'Too many key points'),
  sections: z.array(contentSectionSchema).max(50, 'Too many sections'),
  analysis: z.string().min(100, 'Analysis too short').max(10000, 'Analysis too long'),
  transcript: z.string().max(50000, 'Transcript too long').optional(),
  relatedResources: z.array(relatedResourceSchema).max(20, 'Too many related resources').optional()
});

/** Gemini Gem frontmatter schema */
const geminiGemFrontmatterSchema = z.object({
  title: nonEmptyString.max(200, 'Title too long'),
  source: httpsUrlSchema,
  type: contentTypeSchema,
  processed: dateSchema,
  tags: z.array(
    z.string().min(1).max(50)
  ).max(50, 'Too many tags'),
  entities: z.array(extractedEntitySchema).max(100, 'Too many entities'),
  insights: z.array(
    z.string().min(10, 'Insight too short').max(500, 'Insight too long')
  ).max(20, 'Too many insights'),
  metadata: z.record(z.string(), z.unknown()),
  confidence: confidenceSchema.optional(),
  processingTime: processingTimeSchema.optional()
});

/** Main Gemini Gem schema */
export const geminiGemSchema = z.object({
  frontmatter: geminiGemFrontmatterSchema,
  content: geminiGemContentSchema
}).strict();

// ============================================================================
// PROCESSING SCHEMAS
// ============================================================================

/** Content input schema */
const contentInputSchema = z.object({
  text: z.string().max(1000000, 'Text content too large').optional(),
  filePath: z.string().max(500, 'File path too long').optional(),
  buffer: z.instanceof(Buffer).refine((buffer) => buffer.length <= 10 * 1024 * 1024, { message: 'Buffer too large (max 10MB)' }).optional(),
  type: contentTypeSchema.optional()
}).refine(
  (data) => Object.keys(data).filter(key => data[key as keyof typeof data] !== undefined).length === 1,
  { message: 'Exactly one content input type must be provided' }
);

/** Rate limit config schema */
const rateLimitConfigSchema = z.object({
  requestsPerMinute: z.number().int().min(1, 'Must allow at least 1 request per minute').max(1000),
  tokensPerHour: z.number().int().min(100, 'Must allow at least 100 tokens per hour').max(1000000),
  dailyLimit: z.number().int().min(1, 'Must allow at least 1 request per day').max(10000),
  burstAllowance: z.number().int().min(0, 'Burst allowance must be non-negative').max(100)
});

/** Auth config schema */
const authConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key required').max(500, 'API key too long'),
  encrypted: z.boolean(),
  source: z.enum(['user', 'environment', 'service']),
  rateLimits: rateLimitConfigSchema.optional()
});

/** Processing options schema */
const processingOptionsSchema = z.object({
  analysisMode: analysisModeSchema,
  includeTimestamps: z.boolean(),
  includeTranscript: z.boolean(),
  customPrompts: z.record(z.string(), z.string().max(1000)).optional(),
  outputFormat: outputFormatSchema,
  tagOverrides: z.array(z.string().max(50)).max(50, 'Too many tag overrides').optional(),
  extractEntities: z.boolean(),
  timeoutMs: z.number().int().min(1000, 'Timeout must be at least 1 second').max(600000, 'Timeout too long').optional(),
  language: z.string().length(2, 'Language must be 2-character code').optional()
});

/** Output config schema */
const outputConfigSchema = z.object({
  directory: z.string().min(1, 'Output directory required').max(500),
  filenamePattern: z.string().max(200).optional(),
  createDirectories: z.boolean(),
  overwrite: z.boolean(),
  includeMetadata: z.boolean()
});

/** Processing request schema */
export const processingRequestSchema = z.object({
  input: z.union([nonEmptyString.max(2000, 'URL too long'), contentInputSchema]),
  options: processingOptionsSchema,
  auth: authConfigSchema,
  output: outputConfigSchema.optional()
});

/** Processing stage schema */
const processingStageSchema = z.object({
  name: nonEmptyString.max(100),
  status: processingStatusSchema,
  startTime: dateSchema,
  endTime: dateSchema.optional(),
  duration: processingTimeSchema.optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  errors: z.array(z.any()).optional()
});

/** Processing metadata schema */
const processingMetadataSchema = z.object({
  startTime: dateSchema,
  endTime: dateSchema,
  duration: processingTimeSchema,
  sourceUrl: httpsUrlSchema,
  contentType: contentTypeSchema,
  analysisMode: analysisModeSchema,
  tokensUsed: z.number().int().min(0),
  stages: z.array(processingStageSchema),
  cacheHit: z.boolean(),
  retryAttempts: z.number().int().min(0)
});

/** Processing error schema */
const processingErrorSchema = z.object({
  category: errorCategorySchema,
  code: nonEmptyString.max(50, 'Error code too long'),
  message: nonEmptyString.max(500, 'Error message too long'),
  details: z.record(z.string(), z.unknown()).optional(),
  suggestion: z.string().max(200, 'Suggestion too long').optional(),
  recoverable: z.boolean(),
  timestamp: dateSchema,
  stack: z.string().max(10000, 'Stack trace too long').optional(),
  retryCount: z.number().int().min(0).optional()
});

/** Processing result schema */
export const processingResultSchema = z.object({
  success: z.boolean(),
  data: geminiGemSchema.optional(),
  error: processingErrorSchema.optional(),
  metadata: processingMetadataSchema
}).refine(
  (data) => {
    if (data.success) {
      return data.data !== undefined && data.error === undefined;
    } else {
      return data.data === undefined && data.error !== undefined;
    }
  },
  { message: 'Invalid result: success must match data/error presence' }
);

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================

/** Retry config schema */
const retryConfigSchema = z.object({
  maxAttempts: z.number().int().min(1, 'Must allow at least 1 retry').max(10, 'Too many retries'),
  baseDelay: z.number().int().min(100, 'Base delay too short').max(10000, 'Base delay too long'),
  maxDelay: z.number().int().min(1000, 'Max delay too short').max(300000, 'Max delay too long'),
  backoffFactor: z.number().min(1).max(5),
  jitter: z.boolean()
});

/** API config schema */
const apiConfigSchema = z.object({
  provider: z.literal('gemini'),
  baseUrl: httpsUrlSchema,
  defaultModel: z.string().min(1, 'Default model required'),
  timeout: z.number().int().min(5000, 'Timeout too short').max(120000, 'Timeout too long'),
  retry: retryConfigSchema
});

/** Tag preferences schema */
const tagPreferencesSchema = z.object({
  autoGenerate: z.boolean(),
  maxTags: z.number().int().min(1, 'Must allow at least 1 tag').max(100),
  format: z.enum(['lowercase', 'uppercase', 'camelCase', 'original']),
  includePrefixes: z.array(z.string().max(20)).max(20, 'Too many prefixes'),
  exclude: z.array(z.string().max(50)).max(100, 'Too many exclusions')
});

/** User preferences schema */
const userPreferencesSchema = z.object({
  analysisMode: analysisModeSchema,
  outputFormat: outputFormatSchema,
  includeTimestamps: z.boolean(),
  includeTranscripts: z.boolean(),
  extractEntities: z.boolean(),
  language: z.string().length(2, 'Language must be 2-character code'),
  customPrompts: z.record(z.string(), z.string().max(1000)),
  tagPreferences: tagPreferencesSchema
});

/** Security config schema */
const securityConfigSchema = z.object({
  encryptionEnabled: z.boolean(),
  keyDerivationIterations: z.number().int().min(1000, 'Iterations too low').max(1000000),
  sessionTimeout: z.number().int().min(5, 'Timeout too short').max(1440, 'Timeout too long'),
  auditLogging: z.boolean(),
  storageLocation: z.string().min(1, 'Storage location required').max(500)
});

/** User config schema */
export const userConfigSchema = z.object({
  api: apiConfigSchema,
  preferences: userPreferencesSchema,
  rateLimits: rateLimitConfigSchema,
  security: securityConfigSchema,
  output: outputConfigSchema
});

// ============================================================================
// API SCHEMAS
// ============================================================================

/** Safety settings schema */
const safetySettingsSchema = z.object({
  harassment: safetyThresholdSchema,
  hateSpeech: safetyThresholdSchema,
  sexuallyExplicit: safetyThresholdSchema,
  dangerousContent: safetyThresholdSchema
});

/** Safety rating schema */
const safetyRatingSchema = z.object({
  category: z.string().min(1),
  probability: safetyThresholdSchema,
  blocked: z.boolean()
});

/** Gemini request config schema */
export const geminiRequestConfigSchema = z.object({
  model: z.string().min(1, 'Model required'),
  prompt: z.string().min(1, 'Prompt required').max(100000, 'Prompt too long'),
  context: z.string().max(50000, 'Context too long').optional(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().min(1).max(8192),
  safetySettings: safetySettingsSchema,
  systemInstruction: z.string().max(10000, 'System instruction too long').optional()
});

/** Gemini response schema */
export const geminiResponseSchema = z.object({
  content: z.string().min(1, 'Response content required').max(100000),
  tokensUsed: z.number().int().min(0),
  confidence: confidenceSchema,
  safetyRatings: z.array(safetyRatingSchema),
  finishReason: z.string().min(1),
  metadata: z.object({
    model: z.string().min(1),
    timestamp: dateSchema,
    processingTime: processingTimeSchema
  })
});

// ============================================================================
// VALIDATOR CLASSES
// ============================================================================

/** Base validator class */
export class BaseValidator<T> {
  protected schema: z.ZodSchema<T>;
  protected options: {
    /** Strict validation mode */
    strict: boolean;
    /** Custom validation rules */
    customRules?: Array<(data: T) => string | null>;
  };

  constructor(schema: z.ZodSchema<T>, options: Partial<typeof BaseValidator.prototype.options> = {}) {
    this.schema = schema;
    this.options = {
      strict: true,
      ...options
    };
  }

  /** Validate data against schema */
  async validate(data: unknown): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Zod validation
      const result = await this.schema.parseAsync(data);

      // Custom validation rules
      if (this.options.customRules) {
        for (const rule of this.options.customRules) {
          const customError = rule(result);
          if (customError) {
            errors.push({
              field: 'custom',
              code: 'CUSTOM_VALIDATION',
              message: customError,
              value: result,
              expected: 'Custom validation passed'
            });
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Convert Zod errors to ValidationError format
        error.issues.forEach(zodError => {
          errors.push({
            field: zodError.path.join('.'),
            code: zodError.code,
            message: zodError.message,
            value: (zodError as any).received || data,
            expected: (zodError as any).expected?.toString() || 'Valid value'
          });
        });
      } else {
        // Unexpected error
        errors.push({
          field: 'validation',
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          value: data
        });
      }

      return {
        valid: false,
        errors,
        warnings
      };
    }
  }

  /** Safely parse data with type inference */
  safeParse(data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
    const result = this.schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  }
}

/** Gemini Gem validator */
export class GeminiGemValidator extends BaseValidator<GeminiGem> {
  constructor(options: Partial<{ strict: boolean; customRules?: Array<(data: GeminiGem) => string | null> }> = {}) {
    const customRules = [
      // Validate content quality
      (gem: GeminiGem) => {
        if (gem.content.summary.length < 100) {
          return 'Summary should be at least 100 characters';
        }
        if (gem.content.keyPoints.length === 0) {
          return 'At least one key point is required';
        }
        return null;
      },
      // Validate metadata consistency
      (gem: GeminiGem) => {
        if (gem.frontmatter.confidence && (gem.frontmatter.confidence < 0.5 || gem.frontmatter.confidence > 1)) {
          return 'Confidence score should be between 0.5 and 1.0';
        }
        return null;
      }
    ];

    super(geminiGemSchema, {
      ...options,
      customRules: [...(options.customRules || []), ...customRules]
    });
  }
}

/** Processing request validator */
export class ProcessingRequestValidator extends BaseValidator<ProcessingRequest> {
  constructor(options: Partial<{ strict: boolean; customRules?: Array<(data: ProcessingRequest) => string | null> }> = {}) {
    super(processingRequestSchema, options);
  }
}

/** Processing result validator */
export class ProcessingResultValidator extends BaseValidator<ProcessingResult> {
  constructor(options: Partial<{ strict: boolean; customRules?: Array<(data: ProcessingResult) => string | null> }> = {}) {
    super(processingResultSchema, options);
  }
}

/** User config validator */
export class UserConfigValidator extends BaseValidator<UserConfig> {
  constructor(options: Partial<{ strict: boolean; customRules?: Array<(data: UserConfig) => string | null> }> = {}) {
    super(userConfigSchema, options);
  }
}

/** URL validator with content type detection and SSRF protection */
export class URLValidator {
  private static URL_PATTERNS = {
    youtube: /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    article: /^https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/(?:article|post|blog|news)\/.+/,
    paper: /^https?:\/\/(?:www\.)?(?:arxiv\.org|researchgate\.net|acm\.org|ieee\.org)\/.+/,
    podcast: /^https?:\/\/(?:www\.)?(?:spotify\.com|apple\.com|soundcloud\.com)\/(?:podcast|episode)\/.+/
  };

  /** Validate URL and detect content type with SSRF protection */
  static validateAndClassify(url: string): { valid: boolean; type: ContentType; error?: string } {
    try {
      // Basic URL validation
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'https:') {
        return {
          valid: false,
          type: ContentType.UNKNOWN,
          error: 'Only HTTPS URLs are supported'
        };
      }

      // SSRF Protection - check for internal/private IP ranges
      const ssrfResult = ssrfProtection.validateURL(url);
      if (!ssrfResult.safe) {
        return {
          valid: false,
          type: ContentType.UNKNOWN,
          error: ssrfResult.error || 'URL blocked by security policy'
        };
      }

      // Content type detection
      for (const [type, pattern] of Object.entries(this.URL_PATTERNS)) {
        if (pattern.test(url)) {
          return {
            valid: true,
            type: ContentTypeEnum[type as keyof typeof ContentTypeEnum]
          };
        }
      }

      return {
        valid: true,
        type: ContentTypeEnum.ARTICLE // Default to article for unknown patterns
      };
    } catch (error) {
      return {
        valid: false,
        type: ContentTypeEnum.UNKNOWN,
        error: error instanceof Error ? error.message : 'Invalid URL format'
      };
    }
  }

  /** Validate URL for SSRF vulnerabilities only */
  static validateSSRF(url: string): SSRFValidationResult {
    return ssrfProtection.validateURL(url);
  }

  /** Extract YouTube video ID from URL */
  static extractYouTubeId(url: string): string | null {
    const match = url.match(this.URL_PATTERNS.youtube);
    return match ? match[1] : null;
  }
}

/** API key validator (DEPRECATED - Use ApiKeyValidator from api-key-validator.ts) */
export class ApiKeyValidator {
  /** Validate Gemini API key format (DEPRECATED) */
  static validateGeminiKey(key: string): { valid: boolean; error?: string } {
    if (!key || typeof key !== 'string') {
      return { valid: false, error: 'API key is required' };
    }

    if (key.length < 20) {
      return { valid: false, error: 'API key appears to be too short' };
    }

    if (key.length > 500) {
      return { valid: false, error: 'API key is too long' };
    }

    // Basic format validation for Gemini keys
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      return { valid: false, error: 'API key contains invalid characters' };
    }

    return { valid: true };
  }

  /** Test API key with minimal request (DEPRECATED - consumes API quota) */
  static async testGeminiKey(key: string): Promise<{ valid: boolean; error?: string }> {
    const formatValidation = this.validateGeminiKey(key);
    if (!formatValidation.valid) {
      return formatValidation;
    }

    try {
      // Import dynamically to avoid circular dependencies
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      // Test with minimal request
      const result = await model.generateContent('test');

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'API key validation failed'
      };
    }
  }
}

// ============================================================================
// VALIDATOR FACTORY
// ============================================================================

/** Factory for creating validators */
export class ValidatorFactory {
  private static validators = new Map<string, () => BaseValidator<any>>([
    ['geminiGem', () => new GeminiGemValidator()],
    ['processingRequest', () => new ProcessingRequestValidator()],
    ['processingResult', () => new ProcessingResultValidator()],
    ['userConfig', () => new UserConfigValidator()]
  ]);

  /** Create validator by name */
  static create<T>(name: string): BaseValidator<T> {
    const validatorFactory = this.validators.get(name);
    if (!validatorFactory) {
      throw new Error(`Unknown validator: ${name}`);
    }
    return validatorFactory();
  }

  /** Get available validators */
  static getAvailableValidators(): string[] {
    return Array.from(this.validators.keys());
  }

  /** Register custom validator */
  static register<T>(name: string, factory: () => BaseValidator<T>): void {
    this.validators.set(name, factory);
  }
}

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/** Input sanitizer for security */
export class InputSanitizer {
  /** Sanitize user input text */
  static sanitizeText(text: string, maxLength: number = 10000): string {
    if (typeof text !== 'string') {
      throw new Error('Input must be a string');
    }

    // Remove potentially dangerous content
    let sanitized = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
      .replace(/javascript:/gi, '') // Remove javascript URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /** Sanitize filename */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Collapse multiple underscores
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .toLowerCase();
  }

  /** Sanitize API key for logging */
  static sanitizeApiKey(key: string): string {
    if (!key || key.length < 10) {
      return '[INVALID]';
    }
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  }
}

// ============================================================================
// EXPORTS - API Key Validation
// ============================================================================

/**
 * Export new API key validator (recommended)
 * Provides format-only validation without consuming API quota
 */
export {
  NewApiKeyValidator as ApiKeyValidatorV2,
  validateApiKeyFormat,
  validateGeminiKey,
  type ApiKeyValidationResult
};
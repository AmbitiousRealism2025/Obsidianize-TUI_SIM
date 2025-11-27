/**
 * Obsidianize Core Module
 * Main entry point for the data processing pipeline
 *
 * Version: 1.0.0
 * Last Updated: October 11, 2024
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Core types
  GeminiGem,
  GeminiGemFrontmatter,
  GeminiGemContent,
  ContentSection,
  ExtractedEntity,
  RelatedResource,

  // Processing types
  ProcessingRequest,
  ContentInput,
  ProcessingOptions,
  AuthConfig,
  RateLimitConfig,
  OutputConfig,
  ProcessingResult,
  ProcessingMetadata,
  ProcessingStage,

  // Error types
  ProcessingError,
  ValidationResult,
  ValidationError,
  ValidationWarning,

  // API types
  GeminiRequestConfig,
  GeminiResponse,
  SafetySettings,
  SafetyRating,

  // Configuration types
  UserConfig,
  APIConfig,
  RetryConfig,
  UserPreferences,
  TagPreferences,
  SecurityConfig,

  // Utility types
  ContentTypeGuard,
  CacheEntry,
  ProgressInfo,
  FilenameConfig,
  ProcessorConfig
} from './types/index.js';

// ============================================================================
// ENUM EXPORTS
// ============================================================================

export {
  ContentType,
  ProcessingStatus,
  AnalysisMode,
  ErrorCategory,
  OutputFormat,
  SectionType,
  EntityType,
  SafetyThreshold
} from './types/index.js';

// ============================================================================
// FORMATTER EXPORTS
// ============================================================================

export {
  type IFormatter,
  type MarkdownFormatterOptions,
  FrontmatterFormatter,
  MarkdownFormatter,
  JSONFormatter,
  YAMLFormatter,
  FormatterFactory,
  ContentStructureUtils
} from './formatters/index.js';

// ============================================================================
// VALIDATOR EXPORTS
// ============================================================================

export {
  // Schema exports
  geminiGemSchema,
  processingRequestSchema,
  processingResultSchema,
  userConfigSchema,
  geminiRequestConfigSchema,
  geminiResponseSchema,

  // Validator classes
  GeminiGemValidator,
  ProcessingRequestValidator,
  ProcessingResultValidator,
  UserConfigValidator,
  URLValidator,
  ApiKeyValidator,
  ValidatorFactory,
  InputSanitizer
} from './validators/index.js';

// ============================================================================
// PROCESSOR EXPORTS
// ============================================================================

export {
  DataProcessor,
  DEFAULT_CONFIG,
  ContentFetcher,
  AIProcessor,
  ProcessingError as CoreProcessingError
} from './processor.js';

// ============================================================================
// MAIN API FUNCTIONS
// ============================================================================

import { DataProcessor, DEFAULT_CONFIG, type ProcessorConfig } from './processor.js';
import type {
  ProcessingRequest,
  ProcessingResult,
  GeminiGem,
  ProcessingOptions,
  ContentType,
  AnalysisMode,
  ValidationResult,
  OutputFormat
} from './types/index.js';
import {
  ContentType as ContentTypeEnum,
  ProcessingStatus,
  AnalysisMode as AnalysisModeEnum,
  ErrorCategory,
  OutputFormat as OutputFormatEnum
} from './types/index.js';
import { FormatterFactory, ContentStructureUtils } from './formatters/index.js';
import { URLValidator, InputSanitizer } from './validators/index.js';

/** Global processor instance */
let globalProcessor: DataProcessor | null = null;

/**
 * Initialize the core processing system
 * @param config Optional processor configuration
 */
export function initializeCore(config?: Partial<ProcessorConfig>): DataProcessor {
  globalProcessor = new DataProcessor(config);
  return globalProcessor;
}

/**
 * Get the global processor instance
 * @returns DataProcessor instance
 */
export function getProcessor(): DataProcessor {
  if (!globalProcessor) {
    throw new Error('Core not initialized. Call initializeCore() first.');
  }
  return globalProcessor;
}

/**
 * Process content using the global processor
 * @param request Processing request
 * @returns Processing result
 */
export async function processContent(request: ProcessingRequest): Promise<ProcessingResult> {
  const processor = getProcessor();
  return await processor.processRequest(request);
}

/**
 * Validate a Gemini Gem object
 * @param gem GeminiGem to validate
 * @returns Validation result
 */
export async function validateGeminiGem(gem: unknown): Promise<ValidationResult> {
  const validator = new (await import('./validators/index.js')).GeminiGemValidator();
  return await validator.validate(gem);
}

/**
 * Format a Gemini Gem to specified output format
 * @param gem GeminiGem to format
 * @param format Output format
 * @param options Formatter options
 * @returns Formatted string
 */
export async function formatGeminiGem(
  gem: GeminiGem,
  format: OutputFormat = OutputFormatEnum.MARKDOWN,
  options?: unknown
): Promise<string> {
  const formatter = FormatterFactory.create(format);
  return await formatter.format(gem);
}

/**
 * Validate and classify a URL
 * @param url URL to validate
 * @returns Validation result with content type
 */
export function validateUrl(url: string): { valid: boolean; type: ContentType; error?: string } {
  return URLValidator.validateAndClassify(url);
}

/**
 * Create a filename from a Gemini Gem
 * @param gem GeminiGem
 * @param pattern Optional filename pattern
 * @returns Generated filename
 */
export function createFilename(gem: GeminiGem, pattern?: string): string {
  return ContentStructureUtils.createFilename(gem, pattern);
}

/**
 * Sanitize user input text
 * @param text Text to sanitize
 * @param maxLength Maximum length
 * @returns Sanitized text
 */
export function sanitizeInput(text: string, maxLength?: number): string {
  return InputSanitizer.sanitizeText(text, maxLength);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick process function for simple use cases
 * @param url URL to process
 * @param apiKey Gemini API key
 * @param options Processing options
 * @returns Processing result
 */
export async function quickProcess(
  url: string,
  apiKey: string,
  options: Partial<ProcessingOptions> = {}
): Promise<ProcessingResult> {
  const defaultOptions: ProcessingOptions = {
    analysisMode: AnalysisModeEnum.STANDARD,
    includeTimestamps: true,
    includeTranscript: false,
    outputFormat: OutputFormatEnum.MARKDOWN,
    extractEntities: true,
    ...options
  };

  const request: ProcessingRequest = {
    input: url,
    options: defaultOptions,
    auth: {
      apiKey,
      encrypted: false,
      source: 'user'
    }
  };

  return await processContent(request);
}

/**
 * Create a default processing request
 * @param url URL to process
 * @param apiKey Gemini API key
 * @returns Processing request
 */
export async function createDefaultRequest(url: string, apiKey: string): Promise<ProcessingRequest> {
  return {
    input: url,
    options: {
      analysisMode: AnalysisModeEnum.STANDARD,
      includeTimestamps: true,
      includeTranscript: false,
      outputFormat: OutputFormatEnum.MARKDOWN,
      extractEntities: true,
      language: 'en'
    },
    auth: {
      apiKey,
      encrypted: false,
      source: 'user'
    },
    output: {
      directory: './output',
      createDirectories: true,
      overwrite: false,
      includeMetadata: true
    }
  };
}

/**
 * Get system information
 * @returns System info object
 */
export function getSystemInfo(): {
  version: string;
  nodeVersion: string;
  platform: string;
  features: string[];
} {
  return {
    version: '1.0.0',
    nodeVersion: process.version,
    platform: process.platform,
    features: [
      'content-fetching',
      'ai-processing',
      'markdown-formatting',
      'validation',
      'caching'
    ]
  };
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Check if an error is recoverable
 * @param error Error to check
 * @returns Whether error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'recoverable' in error) {
    return (error as any).recoverable;
  }
  return false;
}

/**
 * Get user-friendly error message
 * @param error Error to format
 * @returns User-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as any).message;
  }
  return 'An unknown error occurred';
}

/**
 * Get error suggestion for recovery
 * @param error Error to get suggestion for
 * @returns Recovery suggestion
 */
export function getErrorSuggestion(error: unknown): string | null {
  if (error && typeof error === 'object' && 'suggestion' in error) {
    return (error as any).suggestion || null;
  }
  return null;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

const defaultExport = {
  // Core functions
  initializeCore,
  getProcessor,
  processContent,

  // Validation
  validateGeminiGem,
  validateUrl,

  // Formatting
  formatGeminiGem,
  createFilename,

  // Utilities
  sanitizeInput,
  quickProcess,
  createDefaultRequest,
  getSystemInfo,

  // Error handling
  isRecoverableError,
  getErrorMessage,
  getErrorSuggestion,

  // Classes
  DataProcessor,
  FormatterFactory,

  // Enums (imported from types)
  ContentType: ContentTypeEnum,
  ProcessingStatus: ProcessingStatus,
  AnalysisMode: AnalysisModeEnum,
  ErrorCategory: ErrorCategory,
  OutputFormat: OutputFormatEnum
};

export default defaultExport;
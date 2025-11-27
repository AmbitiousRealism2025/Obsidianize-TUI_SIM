/**
 * Main Data Processing Pipeline for Obsidianize
 * Orchestrates the complete data flow from input to output
 *
 * Version: 1.0.0
 * Last Updated: October 11, 2024
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { createLogger } from './logging/index.js';

const logger = createLogger('processor');
import * as cheerio from 'cheerio';
import { PDFParse } from 'pdf-parse';
import type {
  GeminiGem,
  ProcessingRequest,
  ProcessingResult,
  ProcessingOptions,
  ProcessingMetadata,
  ProcessingStage,
  ProcessingStatus,
  ContentType,
  AnalysisMode,
  ProcessingError,
  ErrorCategory,
  ValidationResult,
  ProgressInfo
} from './types/index.js';
import {
  ContentType as ContentTypeEnum,
  ProcessingStatus as ProcessingStatusEnum,
  AnalysisMode as AnalysisModeEnum,
  ErrorCategory as ErrorCategoryEnum
} from './types/index.js';
import {
  FormatterFactory,
  MarkdownFormatter,
  ContentStructureUtils
} from './formatters/index.js';
import {
  GeminiGemValidator,
  ProcessingRequestValidator,
  URLValidator,
  ApiKeyValidator,
  InputSanitizer
} from './validators/index.js';

// ============================================================================
// PROCESSOR CONFIGURATION
// ============================================================================

/** Processor configuration */
interface ProcessorConfig {
  /** Maximum processing time in milliseconds */
  maxProcessingTime: number;

  /** Retry configuration */
  retryConfig: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };

  /** Cache configuration */
  cacheConfig: {
    enabled: boolean;
    ttl: number; // Time to live in seconds
    maxSize: number; // Maximum cache size in MB
  };

  /** Processing timeouts */
  timeouts: {
    fetchContent: number;
    aiProcessing: number;
    formatting: number;
  };

  /** Content size limits */
  limits: {
    maxContentLength: number;
    maxUrlLength: number;
    maxApiKeyLength: number;
  };
}

/** Default processor configuration */
const DEFAULT_CONFIG: ProcessorConfig = {
  maxProcessingTime: 600000, // 10 minutes
  retryConfig: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2
  },
  cacheConfig: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 100 // 100MB
  },
  timeouts: {
    fetchContent: 30000, // 30 seconds
    aiProcessing: 120000, // 2 minutes
    formatting: 5000 // 5 seconds
  },
  limits: {
    maxContentLength: 10 * 1024 * 1024, // 10MB
    maxUrlLength: 2000,
    maxApiKeyLength: 500
  }
};

// ============================================================================
// CONTENT FETCHER
// ============================================================================

/** Content fetching functionality */
class ContentFetcher {
  private config: ProcessorConfig;

  constructor(config: ProcessorConfig) {
    this.config = config;
  }

  /** Fetch content from URL */
  async fetchContent(url: string, timeout: number = this.config.timeouts.fetchContent): Promise<{
    content: string;
    type: ContentType;
    metadata: Record<string, unknown>;
  }> {
    const startTime = Date.now();

    try {
      // Validate and classify URL
      const urlValidation = URLValidator.validateAndClassify(url);
      if (!urlValidation.valid) {
        throw new Error(`Invalid URL: ${urlValidation.error}`);
      }

      let content: string;
      let metadata: Record<string, unknown> = {};

      switch (urlValidation.type) {
        case ContentTypeEnum.YOUTUBE:
          ({ content, metadata } = await this.fetchYouTubeContent(url));
          break;

        case ContentTypeEnum.ARTICLE:
        case ContentTypeEnum.PAPER:
          ({ content, metadata } = await this.fetchWebContent(url));
          break;

        default:
          throw new Error(`Unsupported content type: ${urlValidation.type}`);
      }

      // Validate content size
      if (content.length > this.config.limits.maxContentLength) {
        throw new Error(`Content too large: ${content.length} bytes (max: ${this.config.limits.maxContentLength})`);
      }

      return {
        content: InputSanitizer.sanitizeText(content),
        type: urlValidation.type,
        metadata: {
          ...metadata,
          fetchTime: Date.now() - startTime,
          contentLength: content.length
        }
      };
    } catch (error) {
      throw new CoreProcessingError({
        category: ErrorCategoryEnum.NETWORK,
        code: 'CONTENT_FETCH_FAILED',
        message: `Failed to fetch content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recoverable: true,
        timestamp: new Date()
      });
    }
  }

  /** Fetch YouTube video information (simplified) */
  private async fetchYouTubeContent(url: string): Promise<{ content: string; metadata: Record<string, unknown> }> {
    const videoId = URLValidator.extractYouTubeId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // In a real implementation, this would use YouTube API
    // For now, return a placeholder
    const metadata = {
      videoId,
      platform: 'youtube',
      url
    };

    const content = `YouTube Video: ${videoId}\n\nContent would be fetched using YouTube API or transcription service.`;

    return { content, metadata };
  }

  /** Fetch web content (articles, papers) */
  private async fetchWebContent(url: string): Promise<{ content: string; metadata: Record<string, unknown> }> {
    const response = await axios.get(url, {
      timeout: this.config.timeouts.fetchContent,
      headers: {
        'User-Agent': 'Obsidianize/1.0 (Content Processor)'
      }
    });

    const contentType = response.headers['content-type'] || '';
    let content: string;
    let metadata: Record<string, unknown> = {
      url,
      contentType,
      status: response.status,
      headers: response.headers
    };

    if (contentType.includes('application/pdf')) {
      // Handle PDF content using pdf-parse v2 API
      const buffer = Buffer.from(response.data);
      const pdfParser = new PDFParse({ data: new Uint8Array(buffer) });
      const textResult = await pdfParser.getText();
      const infoResult = await pdfParser.getInfo();
      content = textResult.text;
      metadata = {
        ...metadata,
        pages: infoResult.total,
        info: infoResult.info,
        metadata: infoResult.metadata
      };
      await pdfParser.destroy();
    } else {
      // Handle HTML content
      const $ = cheerio.load(response.data);

      // Remove unwanted elements
      $('script, style, nav, header, footer, aside, .ads, .advertisement').remove();

      // Extract main content
      const mainContent = $('main, article, .content, .post-body, .entry-content')
        .first()
        .text()
        .trim();

      const title = $('title').first().text().trim() ||
                   $('h1').first().text().trim();

      content = mainContent || $('body').text().trim();
      metadata = {
        ...metadata,
        title,
        wordCount: content.split(/\s+/).length,
        extractedMain: !!mainContent
      };
    }

    if (!content || content.length < 100) {
      throw new Error('Extracted content is too short or empty');
    }

    return { content, metadata };
  }
}

// ============================================================================
// AI PROCESSOR
// ============================================================================

/** AI processing with Gemini API */
class AIProcessor {
  private genAI: GoogleGenerativeAI;
  private config: ProcessorConfig;

  constructor(apiKey: string, config: ProcessorConfig) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.config = config;
  }

  /** Process content with AI */
  async processContent(
    content: string,
    contentType: ContentType,
    options: ProcessingOptions
  ): Promise<{
    summary: string;
    keyPoints: string[];
    analysis: string;
    entities: Array<{ text: string; type: string; confidence: number }>;
    insights: string[];
  }> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        topP: 0.8,
        topK: 40
      }
    });

    const prompt = this.generatePrompt(content, contentType, options);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse AI response into structured data
      return this.parseAIResponse(text);
    } catch (error) {
      throw new CoreProcessingError({
        category: ErrorCategoryEnum.AI_API,
        code: 'AI_PROCESSING_FAILED',
        message: `AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recoverable: true,
        timestamp: new Date()
      });
    }
  }

  /** Generate prompt based on content type and options */
  private generatePrompt(content: string, contentType: ContentType, options: ProcessingOptions): string {
    const basePrompt = `Analyze the following ${contentType} content and provide a structured analysis in JSON format:

CONTENT:
${content.substring(0, 8000)} ${content.length > 8000 ? '...(content truncated for processing)' : ''}

Please provide a JSON response with the following structure:
{
  "summary": "A comprehensive summary of the content",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "analysis": "Detailed analysis and insights",
  "entities": [
    {"text": "Entity name", "type": "person|organization|concept|technology", "confidence": 0.95}
  ],
  "insights": ["Insight 1", "Insight 2", "Insight 3"]
}

Analysis mode: ${options.analysisMode}
Include entities: ${options.extractEntities}
Language: ${options.language || 'English'}`;

    if (options.customPrompts?.system) {
      return `${options.customPrompts.system}\n\n${basePrompt}`;
    }

    return basePrompt;
  }

  /** Parse AI response into structured data */
  private parseAIResponse(response: string): {
    summary: string;
    keyPoints: string[];
    analysis: string;
    entities: Array<{ text: string; type: string; confidence: number }>;
    insights: string[];
  } {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          summary: parsed.summary || 'Summary not available',
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          analysis: parsed.analysis || 'Analysis not available',
          entities: Array.isArray(parsed.entities) ? parsed.entities : [],
          insights: Array.isArray(parsed.insights) ? parsed.insights : []
        };
      }
    } catch (error) {
      logger.warn('Failed to parse AI response as JSON, falling back to text extraction');
    }

    // Fallback: extract from plain text
    return {
      summary: this.extractSection(response, 'summary') || response.substring(0, 500),
      keyPoints: this.extractListItems(response, 'key points') || [],
      analysis: this.extractSection(response, 'analysis') || response.substring(500),
      entities: [],
      insights: this.extractListItems(response, 'insights') || []
    };
  }

  /** Extract a section from text response */
  private extractSection(text: string, sectionName: string): string | null {
    const patterns = [
      new RegExp(`${sectionName}:?\s*([^\n]+(?:\n[^{]*?)*?)(?=\n\n|\n[A-Z]|\n\{|$)`, 'i'),
      new RegExp(`##? ${sectionName}\s*\n([\s\S]*?)(?=\n##|\n$|$)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /** Extract list items from text response */
  private extractListItems(text: string, context: string): string[] | null {
    const listPattern = new RegExp(`${context}:?\s*\n((?:[-*•]\s.*\n?)*)`, 'i');
    const match = text.match(listPattern);

    if (match && match[1]) {
      return match[1]
        .split('\n')
        .filter(line => /^[-*•]\s/.test(line))
        .map(line => line.replace(/^[-*•]\s/, '').trim())
        .filter(line => line.length > 0);
    }

    return null;
  }
}

// ============================================================================
// MAIN PROCESSOR CLASS
// ============================================================================

/** Main data processing pipeline */
export class DataProcessor {
  private config: ProcessorConfig;
  private contentFetcher: ContentFetcher;
  private aiProcessor: AIProcessor | null = null;
  private requestValidator: ProcessingRequestValidator;
  private gemValidator: GeminiGemValidator;

  // In-memory cache (simplified)
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor(config: Partial<ProcessorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.contentFetcher = new ContentFetcher(this.config);
    this.requestValidator = new ProcessingRequestValidator();
    this.gemValidator = new GeminiGemValidator();
  }

  /** Process content request */
  async processRequest(request: ProcessingRequest): Promise<ProcessingResult> {
    const startTime = new Date();
    const stages: ProcessingStage[] = [];

    try {
      // Validation stage
      const validationStage = await this.executeStage(
        'validation',
        async () => {
          const validation = await this.requestValidator.validate(request);
          if (!validation.valid) {
            throw new CoreProcessingError({
              category: ErrorCategoryEnum.VALIDATION,
              code: 'REQUEST_VALIDATION_FAILED',
              message: `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
              details: { errors: validation.errors },
              recoverable: false,
              timestamp: new Date()
            });
          }

          // Validate API key
          const apiKeyValidator = new ApiKeyValidator();
          const keyValidation = await ApiKeyValidator.testGeminiKey(request.auth.apiKey);
          if (!keyValidation.valid) {
            throw new CoreProcessingError({
              category: ErrorCategoryEnum.AUTH,
              code: 'INVALID_API_KEY',
              message: keyValidation.error || 'Invalid API key',
              recoverable: false,
              timestamp: new Date()
            });
          }

          return validation;
        },
        stages
      );

      // Initialize AI processor
      this.aiProcessor = new AIProcessor(request.auth.apiKey, this.config);

      // Check cache
      const cacheKey = this.generateCacheKey(request);
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        const endTime = new Date();
        return {
          success: true,
          data: cachedResult,
          metadata: {
            startTime,
            endTime,
            duration: endTime.getTime() - startTime.getTime(),
            sourceUrl: typeof request.input === 'string' ? request.input : 'direct_input',
            contentType: cachedResult.frontmatter.type,
            analysisMode: request.options.analysisMode,
            tokensUsed: 0,
            stages: [...stages, {
              name: 'cache_hit',
              status: ProcessingStatusEnum.COMPLETED,
              startTime: new Date(),
              endTime: new Date(),
              duration: 0
            }],
            cacheHit: true,
            retryAttempts: 0
          }
        };
      }

      // Content fetching stage
      const url = typeof request.input === 'string' ? request.input : 'direct_input';
      const fetchedContent = await this.executeStage(
        'content_fetch',
        async () => {
          return await this.contentFetcher.fetchContent(url);
        },
        stages
      );

      // AI processing stage
      const aiResult = await this.executeStage(
        'ai_processing',
        async () => {
          if (!this.aiProcessor) {
            throw new Error('AI processor not initialized');
          }
          return await this.aiProcessor.processContent(
            fetchedContent.content,
            fetchedContent.type,
            request.options
          );
        },
        stages
      );

      // Gemini Gem creation stage
      const geminiGem = await this.executeStage(
        'gem_creation',
        async () => {
          return await this.createGeminiGem(
            request,
            url,
            fetchedContent,
            aiResult
          );
        },
        stages
      );

      // Validation stage
      await this.executeStage(
        'final_validation',
        async () => {
          const validation = await this.gemValidator.validate(geminiGem);
          if (!validation.valid) {
            throw new CoreProcessingError({
              category: ErrorCategoryEnum.PROCESSING,
              code: 'GEMINI_GEM_VALIDATION_FAILED',
              message: `Final validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
              details: { errors: validation.errors },
              recoverable: false,
              timestamp: new Date()
            });
          }
          return validation;
        },
        stages
      );

      // Cache result
      this.setCache(cacheKey, geminiGem);

      const endTime = new Date();

      return {
        success: true,
        data: geminiGem,
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
          sourceUrl: url,
          contentType: geminiGem.frontmatter.type,
          analysisMode: request.options.analysisMode,
          tokensUsed: 0, // Would be calculated from AI response
          stages,
          cacheHit: false,
          retryAttempts: 0
        }
      };

    } catch (error) {
      const endTime = new Date();

      return {
        success: false,
        error: error instanceof CoreProcessingError ? error.toInterface() : new CoreProcessingError({
          category: ErrorCategoryEnum.SYSTEM,
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          recoverable: false,
          timestamp: new Date()
        }).toInterface(),
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
          sourceUrl: typeof request.input === 'string' ? request.input : 'direct_input',
          contentType: ContentTypeEnum.UNKNOWN,
          analysisMode: request.options.analysisMode,
          tokensUsed: 0,
          stages,
          cacheHit: false,
          retryAttempts: 0
        }
      };
    }
  }

  /** Execute a processing stage with error handling */
  private async executeStage<T>(
    stageName: string,
    stageFunction: () => Promise<T>,
    stages: ProcessingStage[]
  ): Promise<T> {
    const stage: ProcessingStage = {
      name: stageName,
      status: ProcessingStatusEnum.PROCESSING,
      startTime: new Date()
    };
    stages.push(stage);

    try {
      const result = await stageFunction();

      stage.status = ProcessingStatusEnum.COMPLETED;
      stage.endTime = new Date();
      stage.duration = stage.endTime.getTime() - stage.startTime.getTime();

      return result;
    } catch (error) {
      stage.status = ProcessingStatusEnum.FAILED;
      stage.endTime = new Date();
      stage.duration = stage.endTime.getTime() - stage.startTime.getTime();
      stage.errors = [error as ProcessingError];

      throw error;
    }
  }

  /** Create GeminiGem from processed data */
  private async createGeminiGem(
    request: ProcessingRequest,
    url: string,
    fetchedContent: { content: string; type: ContentType; metadata: Record<string, unknown> },
    aiResult: {
      summary: string;
      keyPoints: string[];
      analysis: string;
      entities: Array<{ text: string; type: string; confidence: number }>;
      insights: string[];
    }
  ): Promise<GeminiGem> {
    const processed = new Date();

    // Generate tags from content and metadata
    const tags = ContentStructureUtils.normalizeTags([
      ...aiResult.insights.slice(0, 5), // Use insights as tags
      ...Object.keys(fetchedContent.metadata).filter(key =>
        typeof fetchedContent.metadata[key] === 'string'
      ) as string[]
    ], {
      maxTags: 20,
      format: 'lowercase'
    });

    const geminiGem: GeminiGem = {
      frontmatter: {
        title: (fetchedContent.metadata.title as string) || `Content from ${url}`,
        source: url,
        type: fetchedContent.type,
        processed,
        tags,
        entities: aiResult.entities.map(entity => ({
          text: entity.text,
          type: entity.type as any,
          confidence: entity.confidence,
          context: 'AI extraction'
        })),
        insights: aiResult.insights,
        metadata: {
          ...fetchedContent.metadata,
          analysisMode: request.options.analysisMode,
          language: request.options.language || 'en',
          processingOptions: request.options
        }
      },
      content: {
        summary: aiResult.summary,
        keyPoints: aiResult.keyPoints,
        sections: [], // Would be enhanced in production
        analysis: aiResult.analysis,
        transcript: request.options.includeTranscript ? fetchedContent.content : undefined
      }
    };

    return geminiGem;
  }

  /** Generate cache key for request */
  private generateCacheKey(request: ProcessingRequest): string {
    const keyData = {
      url: typeof request.input === 'string' ? request.input : 'direct',
      options: request.options,
      type: request.options.analysisMode
    };

    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /** Get data from cache */
  private getFromCache(key: string): GeminiGem | null {
    if (!this.config.cacheConfig.enabled) {
      return null;
    }

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /** Set data in cache */
  private setCache(key: string, data: GeminiGem): void {
    if (!this.config.cacheConfig.enabled) {
      return;
    }

    // Simple cache size management
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cacheConfig.ttl
    });
  }

  /** Get processing progress */
  getProgress(): ProgressInfo {
    // In a real implementation, this would track active processing
    return {
      stage: 'idle',
      progress: 0,
      message: 'No active processing',
      timeElapsed: 0
    };
  }

  /** Clear cache */
  clearCache(): void {
    this.cache.clear();
  }

  /** Get cache statistics */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// ============================================================================
// PROCESSING ERROR CLASS
// ============================================================================

/** Enhanced ProcessingError class */
class CoreProcessingError extends Error {
  public readonly category: ErrorCategory;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly suggestion?: string;
  public readonly recoverable: boolean;
  public readonly timestamp: Date;
  public readonly retryCount?: number;

  constructor(options: {
    category: ErrorCategory;
    code: string;
    message: string;
    details?: Record<string, unknown>;
    suggestion?: string;
    recoverable: boolean;
    timestamp: Date;
    retryCount?: number;
  }) {
    super(options.message);
    this.name = 'CoreProcessingError';
    this.category = options.category;
    this.code = options.code;
    this.details = options.details;
    this.suggestion = options.suggestion;
    this.recoverable = options.recoverable;
    this.timestamp = options.timestamp;
    this.retryCount = options.retryCount;
  }

  /** Convert to ProcessingError interface */
  toInterface(): ProcessingError {
    return {
      category: this.category,
      code: this.code,
      message: this.message,
      details: this.details,
      suggestion: this.suggestion,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      retryCount: this.retryCount
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ProcessorConfig,
  DEFAULT_CONFIG,
  ContentFetcher,
  AIProcessor,
  CoreProcessingError as ProcessingError
};
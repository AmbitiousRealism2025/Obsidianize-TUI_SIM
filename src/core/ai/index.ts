// Main AI Service
export { AIService, createAIService, type AnalysisOptions, type AnalysisResult } from './ai-service';

// Gemini Client
export {
  GeminiClient,
  initializeGeminiClient,
  getGeminiClient,
  type GeminiConfig,
  type RetryConfig,
  type GenerationRequest,
  type GenerationResponse,
  type GeminiError
} from './gemini-client';

// Content Analyzer
export {
  ContentAnalyzer,
  type ContentType,
  type ContentMetadata,
  type ExtractedContent,
  type ContentValidationError
} from './content-analyzer';

// Response Processor
export {
  ResponseProcessor,
  type ProcessedGeminiGem,
  type GeminiGemFrontmatter,
  type ProcessingMetadata,
  type ResponseValidationError,
  type QualityMetrics
} from './response-processor';

// Prompt Templates
export { PromptFactory } from './prompts/prompt-factory';
export {
  BasePromptTemplate,
  type PromptTemplate,
  type PromptContext
} from './prompts/base-prompt';
export { YouTubePromptTemplate } from './prompts/youtube-prompt';
export { ArticlePromptTemplate } from './prompts/article-prompt';
export { PaperPromptTemplate } from './prompts/paper-prompt';
export { PodcastPromptTemplate } from './prompts/podcast-prompt';

// Re-export commonly used types
export type {
  ContentType as SupportedContentType,
  ExtractedContent as ContentData
} from './content-analyzer';

export type {
  ProcessedGeminiGem as GeminiGem,
  AnalysisResult as ContentAnalysisResult
} from './ai-service';
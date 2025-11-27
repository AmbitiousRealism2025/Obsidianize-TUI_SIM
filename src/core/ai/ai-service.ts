import { GeminiClient, GenerationRequest } from './gemini-client';
import { ContentAnalyzer, ExtractedContent, ContentType } from './content-analyzer';
import { PromptFactory } from './prompts/prompt-factory';
import { ResponseProcessor, ProcessedGeminiGem } from './response-processor';
import { createLogger } from '../logging/index.js';

const logger = createLogger('ai-service');

export interface AnalysisOptions {
  customInstructions?: string;
  temperature?: number;
  maxOutputTokens?: number;
  includeQualityMetrics?: boolean;
  timeout?: number;
}

export interface AnalysisResult {
  success: boolean;
  processedGeminiGem?: ProcessedGeminiGem;
  extractedContent?: ExtractedContent;
  error?: string;
  processingTime: number;
  metadata: {
    contentType: ContentType;
    url: string;
    model: string;
    tokensUsed: number;
    qualityScore?: number;
  };
}

// Export ProcessedGeminiGem for external use
export type { ProcessedGeminiGem } from './response-processor';

export class AIService {
  private geminiClient: GeminiClient;

  constructor(geminiClient: GeminiClient) {
    this.geminiClient = geminiClient;
  }

  /**
   * Analyze content from a URL and generate a Gemini Gem
   */
  async analyzeContent(url: string, options: AnalysisOptions = {}): Promise<AnalysisResult> {
    const startTime = Date.now();
    logger.info('Starting AI analysis', { url });

    try {
      // Step 1: Extract content from URL
      logger.debug('Extracting content from URL');
      const extractedContent = await ContentAnalyzer.analyzeContent(url);

      // Validate extracted content
      const contentErrors = ContentAnalyzer.validateExtractedContent(extractedContent);
      if (contentErrors.length > 0) {
        logger.warn('Content validation warnings', { errors: contentErrors });
      }

      // Step 2: Generate AI analysis
      logger.debug('Generating AI analysis');
      const processedGeminiGem = await this.generateAnalysis(extractedContent, options);

      // Step 3: Final validation
      logger.debug('Performing final validation');
      const validationErrors = ResponseProcessor.validateGeminiGemFormat(processedGeminiGem);
      if (validationErrors.length > 0) {
        logger.warn('Final validation warnings', { errors: validationErrors });
      }

      const processingTime = Date.now() - startTime;
      logger.info('AI analysis completed successfully', { processingTime, url });

      return {
        success: true,
        processedGeminiGem,
        extractedContent,
        processingTime,
        metadata: {
          contentType: extractedContent.type,
          url,
          model: processedGeminiGem.processingMetadata.model,
          tokensUsed: processedGeminiGem.processingMetadata.tokensUsed,
          qualityScore: processedGeminiGem.qualityScore
        }
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      logger.error('AI analysis failed', error, { processingTime, url });

      return {
        success: false,
        error: error.message,
        processingTime,
        metadata: {
          contentType: 'unknown',
          url,
          model: 'unknown',
          tokensUsed: 0
        }
      };
    }
  }

  /**
   * Analyze already extracted content
   */
  async analyzeExtractedContent(
    extractedContent: ExtractedContent,
    options: AnalysisOptions = {}
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      const processedGeminiGem = await this.generateAnalysis(extractedContent, options);

      return {
        success: true,
        processedGeminiGem,
        extractedContent,
        processingTime: Date.now() - startTime,
        metadata: {
          contentType: extractedContent.type,
          url: extractedContent.url,
          model: processedGeminiGem.processingMetadata.model,
          tokensUsed: processedGeminiGem.processingMetadata.tokensUsed,
          qualityScore: processedGeminiGem.qualityScore
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
        metadata: {
          contentType: extractedContent.type,
          url: extractedContent.url,
          model: 'unknown',
          tokensUsed: 0
        }
      };
    }
  }

  /**
   * Batch analyze multiple URLs
   */
  async analyzeBatch(urls: string[], options: AnalysisOptions = {}): Promise<AnalysisResult[]> {
    logger.info('Starting batch analysis', { urlCount: urls.length });
    const results: AnalysisResult[] = [];

    // Process URLs in parallel with rate limiting
    const concurrencyLimit = 3; // Limit concurrent requests to avoid rate limiting
    const chunks = this.chunkArray(urls, concurrencyLimit);

    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(url => this.analyzeContent(url, options))
      );

      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason?.message || 'Unknown error',
            processingTime: 0,
            metadata: {
              contentType: 'unknown',
              url: 'unknown',
              model: 'unknown',
              tokensUsed: 0
            }
          });
        }
      }

      // Add delay between chunks to respect rate limits
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await this.sleep(1000);
      }
    }

    const successCount = results.filter(r => r.success).length;
    logger.info('Batch analysis completed', { successCount, totalUrls: urls.length });

    return results;
  }

  private async generateAnalysis(
    extractedContent: ExtractedContent,
    options: AnalysisOptions
  ): Promise<ProcessedGeminiGem> {
    // Step 1: Get appropriate prompt template
    const promptTemplate = PromptFactory.getPrompt(
      extractedContent.type,
      {
        contentType: extractedContent.type,
        content: extractedContent.content,
        metadata: { ...extractedContent.metadata, url: extractedContent.url },
        customInstructions: options.customInstructions
      }
    );

    // Step 2: Create combined prompt
    const fullPrompt = `${promptTemplate.systemInstruction}\n\n${promptTemplate.userPrompt}`;

    // Step 3: Generate AI response
    const generationRequest: GenerationRequest = {
      prompt: fullPrompt,
      temperature: options.temperature || 0.7,
      maxOutputTokens: options.maxOutputTokens || 2048
    };

    const response = await this.geminiClient.generateContent(generationRequest);

    // Step 4: Process and validate response
    const processedGeminiGem = ResponseProcessor.processResponse(
      response,
      extractedContent.type,
      extractedContent.url
    );

    return processedGeminiGem;
  }

  /**
   * Generate markdown output from analysis result
   */
  generateMarkdown(result: AnalysisResult): string {
    if (!result.success || !result.processedGeminiGem) {
      return `# Analysis Failed

Error: ${result.error}

URL: ${result.metadata.url}
Content Type: ${result.metadata.contentType}
Processing Time: ${result.processingTime}ms`;
    }

    return ResponseProcessor.generateMarkdownOutput(result.processedGeminiGem);
  }

  /**
   * Get content type detection for a URL
   */
  detectContentType(url: string): ContentType {
    return ContentAnalyzer.detectContentType(url);
  }

  /**
   * Get supported content types
   */
  getSupportedContentTypes(): ContentType[] {
    return ContentAnalyzer.detectContentType('') === 'unknown'
      ? ['youtube', 'article', 'paper', 'podcast']
      : PromptFactory.getSupportedContentTypes();
  }

  /**
   * Health check for the AI service
   */
  async healthCheck(): Promise<{ gemini: boolean; overall: boolean }> {
    try {
      const geminiHealthy = await this.geminiClient.healthCheck();
      return {
        gemini: geminiHealthy,
        overall: geminiHealthy
      };
    } catch (error) {
      logger.error('AI service health check failed', error);
      return {
        gemini: false,
        overall: false
      };
    }
  }

  /**
   * Get service statistics
   */
  getServiceInfo(): {
    model: string;
    supportedTypes: ContentType[];
    features: string[];
  } {
    return {
      model: this.geminiClient.getModelInfo().model,
      supportedTypes: this.getSupportedContentTypes(),
      features: [
        'Content analysis',
        'Structured output generation',
        'Quality scoring',
        'Batch processing',
        'Multiple content types',
        'Error handling and retry logic'
      ]
    };
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Factory function for creating AI service
export function createAIService(geminiClient: GeminiClient): AIService {
  return new AIService(geminiClient);
}
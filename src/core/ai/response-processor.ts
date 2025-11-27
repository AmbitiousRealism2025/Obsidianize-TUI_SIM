import { ContentType } from './content-analyzer';
import { GenerationResponse } from './gemini-client';
import { createLogger } from '../logging/index.js';

const logger = createLogger('response-processor');

export interface ProcessedGeminiGem {
  frontmatter: GeminiGemFrontmatter;
  content: string;
  rawResponse: string;
  qualityScore: number;
  processingMetadata: ProcessingMetadata;
}

export interface GeminiGemFrontmatter {
  title: string;
  source: string;
  type: ContentType;
  channel?: string;
  author?: string;
  authors?: string;
  episode?: string;
  duration?: string;
  publishDate?: string;
  processed: string;
  tags: string[];
  entities: string[];
  insights: string[];
}

export interface ProcessingMetadata {
  processedAt: Date;
  model: string;
  tokensUsed: number;
  processingTime: number;
  validationErrors: string[];
  qualityIssues: string[];
}

export interface ResponseValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface QualityMetrics {
  completenessScore: number;
  accuracyScore: number;
  structureScore: number;
  valueScore: number;
  overallScore: number;
}

export class ResponseProcessor {
  private static readonly REQUIRED_FRONTMATTER_FIELDS = ['title', 'source', 'type', 'processed', 'tags', 'entities', 'insights'];
  private static readonly MIN_CONTENT_LENGTH = 100;
  private static readonly MIN_TAGS_COUNT = 2;
  private static readonly MIN_INSIGHTS_COUNT = 1;

  static processResponse(
    response: GenerationResponse,
    contentType: ContentType,
    sourceUrl: string
  ): ProcessedGeminiGem {
    const startTime = Date.now();
    const processingMetadata: ProcessingMetadata = {
      processedAt: new Date(),
      model: response.model,
      tokensUsed: response.usage.totalTokens,
      processingTime: 0,
      validationErrors: [],
      qualityIssues: []
    };

    try {
      // Parse YAML frontmatter and content
      const { frontmatter, content } = this.parseYamlFrontmatter(response.text);

      // Validate and fix frontmatter
      const validatedFrontmatter = this.validateAndFixFrontmatter(
        frontmatter,
        contentType,
        sourceUrl,
        processingMetadata
      );

      // Validate content
      this.validateContent(content, processingMetadata);

      // Calculate quality scores
      const qualityScore = this.calculateQualityScore(validatedFrontmatter, content, response.text);

      const processedGeminiGem: ProcessedGeminiGem = {
        frontmatter: validatedFrontmatter,
        content,
        rawResponse: response.text,
        qualityScore: qualityScore.overallScore,
        processingMetadata: {
          ...processingMetadata,
          processingTime: Date.now() - startTime
        }
      };

      logger.debug('Response processed successfully', {
        processingTime: Date.now() - startTime,
        qualityScore: qualityScore.overallScore
      });
      return processedGeminiGem;

    } catch (error: any) {
      processingMetadata.validationErrors.push(`Processing failed: ${error.message}`);

      // Return fallback response
      return this.createFallbackResponse(response, contentType, sourceUrl, processingMetadata);
    }
  }

  private static parseYamlFrontmatter(text: string): { frontmatter: any; content: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = text.match(frontmatterRegex);

    if (!match) {
      // No frontmatter found, treat entire text as content
      return {
        frontmatter: {},
        content: text.trim()
      };
    }

    try {
      // Parse YAML content (simple implementation)
      const yamlContent = match[1];
      const content = match[2].trim();

      const frontmatter = this.parseSimpleYaml(yamlContent);
      return { frontmatter, content };
    } catch (error) {
      logger.warn('Failed to parse YAML frontmatter', { error });
      return {
        frontmatter: {},
        content: text.trim()
      };
    }
  }

  private static parseSimpleYaml(yamlText: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = yamlText.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        let value = trimmed.substring(colonIndex + 1).trim();

        // Handle quoted values
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        // Handle array values
        if (value.startsWith('[') && value.endsWith(']')) {
          const arrayContent = value.slice(1, -1);
          result[key] = arrayContent
            .split(',')
            .map(item => item.trim().replace(/^["']|["']$/g, ''))
            .filter(item => item.length > 0);
        } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
          result[key] = value.toLowerCase() === 'true';
        } else if (!isNaN(Number(value)) && value !== '') {
          result[key] = Number(value);
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }

  private static validateAndFixFrontmatter(
    frontmatter: any,
    contentType: ContentType,
    sourceUrl: string,
    metadata: ProcessingMetadata
  ): GeminiGemFrontmatter {
    const validated: GeminiGemFrontmatter = {
      title: '',
      source: sourceUrl,
      type: contentType,
      processed: new Date().toISOString().split('T')[0],
      tags: [],
      entities: [],
      insights: []
    };

    // Check required fields
    for (const field of this.REQUIRED_FRONTMATTER_FIELDS) {
      if (!frontmatter[field]) {
        metadata.validationErrors.push(`Missing required frontmatter field: ${field}`);
      }
    }

    // Copy and validate fields
    validated.title = this.validateTitle(frontmatter.title, metadata);
    validated.source = sourceUrl;
    validated.type = contentType;
    validated.processed = this.validateProcessedDate(frontmatter.processed, metadata);
    validated.tags = this.validateTags(frontmatter.tags, metadata);
    validated.entities = this.validateEntities(frontmatter.entities, metadata);
    validated.insights = this.validateInsights(frontmatter.insights, metadata);

    // Content-type specific fields
    if (contentType === 'youtube') {
      validated.channel = frontmatter.channel;
      validated.duration = frontmatter.duration;
    } else if (contentType === 'article') {
      validated.author = frontmatter.author;
      validated.publishDate = frontmatter.publishDate;
    } else if (contentType === 'paper') {
      validated.authors = frontmatter.authors;
      validated.publishDate = frontmatter.publishDate;
    } else if (contentType === 'podcast') {
      validated.episode = frontmatter.episode;
      validated.duration = frontmatter.duration;
    }

    return validated;
  }

  private static validateTitle(title: any, metadata: ProcessingMetadata): string {
    if (!title || typeof title !== 'string') {
      metadata.validationErrors.push('Invalid or missing title');
      return 'Untitled Content';
    }

    if (title.length < 10) {
      metadata.qualityIssues.push('Title is too short');
    }

    if (title.length > 200) {
      metadata.qualityIssues.push('Title is too long');
      return title.substring(0, 200);
    }

    return title.trim();
  }

  private static validateProcessedDate(processed: any, metadata: ProcessingMetadata): string {
    if (processed && typeof processed === 'string') {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(processed)) {
        return processed;
      }
    }

    // Return today's date if invalid
    return new Date().toISOString().split('T')[0];
  }

  private static validateTags(tags: any, metadata: ProcessingMetadata): string[] {
    if (!Array.isArray(tags)) {
      metadata.validationErrors.push('Tags must be an array');
      return ['untagged'];
    }

    const validTags = tags
      .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length >= 2 && tag.length <= 30);

    if (validTags.length < this.MIN_TAGS_COUNT) {
      metadata.qualityIssues.push(`Too few valid tags (minimum ${this.MIN_TAGS_COUNT})`);
    }

    return validTags.length > 0 ? validTags : ['untagged'];
  }

  private static validateEntities(entities: any, metadata: ProcessingMetadata): string[] {
    if (!Array.isArray(entities)) {
      metadata.qualityIssues.push('Entities should be an array');
      return [];
    }

    return entities
      .filter(entity => typeof entity === 'string' && entity.trim().length > 0)
      .map(entity => entity.trim())
      .filter(entity => entity.length >= 2 && entity.length <= 100);
  }

  private static validateInsights(insights: any, metadata: ProcessingMetadata): string[] {
    if (!Array.isArray(insights)) {
      metadata.validationErrors.push('Insights must be an array');
      return [];
    }

    const validInsights = insights
      .filter(insight => typeof insight === 'string' && insight.trim().length > 0)
      .map(insight => insight.trim())
      .filter(insight => insight.length >= 10 && insight.length <= 200);

    if (validInsights.length < this.MIN_INSIGHTS_COUNT) {
      metadata.qualityIssues.push(`Too few insights (minimum ${this.MIN_INSIGHTS_COUNT})`);
    }

    return validInsights;
  }

  private static validateContent(content: string, metadata: ProcessingMetadata): void {
    if (!content || content.trim().length === 0) {
      metadata.validationErrors.push('No content provided');
      return;
    }

    if (content.length < this.MIN_CONTENT_LENGTH) {
      metadata.qualityIssues.push('Content is too short');
    }

    // Check for markdown structure
    const hasHeaders = /^#+\s/m.test(content);
    if (!hasHeaders) {
      metadata.qualityIssues.push('Content lacks proper markdown structure');
    }

    // Check for lists
    const hasLists = /^[-*+]\s/m.test(content);
    if (!hasLists) {
      metadata.qualityIssues.push('Content could benefit from bullet points for readability');
    }
  }

  private static calculateQualityScore(
    frontmatter: GeminiGemFrontmatter,
    content: string,
    rawResponse: string
  ): QualityMetrics {
    let completenessScore = 0;
    let accuracyScore = 0;
    let structureScore = 0;
    let valueScore = 0;

    // Completeness score (0-100)
    const requiredFields = ['title', 'source', 'type', 'processed', 'tags', 'entities', 'insights'];
    const presentFields = requiredFields.filter(field => frontmatter[field as keyof GeminiGemFrontmatter]);
    completenessScore = (presentFields.length / requiredFields.length) * 100;

    // Bonus for optional fields
    if (frontmatter.author || frontmatter.channel || frontmatter.duration) completenessScore += 10;
    if (frontmatter.tags.length >= 3) completenessScore += 10;
    if (frontmatter.insights.length >= 3) completenessScore += 10;

    completenessScore = Math.min(completenessScore, 100);

    // Accuracy score (0-100)
    accuracyScore = rawResponse.includes('---') ? 50 : 0; // Has frontmatter
    accuracyScore += content.length > 500 ? 25 : 0; // Substantial content
    accuracyScore += frontmatter.title.length > 10 ? 25 : 0; // Valid title

    // Structure score (0-100)
    const hasMarkdownHeaders = /^#+\s/m.test(content);
    const hasMarkdownLists = /^[-*+]\s/m.test(content);
    const hasYamlStructure = rawResponse.includes('---');

    structureScore = hasYamlStructure ? 40 : 0;
    structureScore += hasMarkdownHeaders ? 30 : 0;
    structureScore += hasMarkdownLists ? 30 : 0;

    // Value score (0-100)
    valueScore = frontmatter.insights.length > 0 ? 30 : 0;
    valueScore += frontmatter.entities.length > 0 ? 20 : 0;
    valueScore += content.length > 1000 ? 20 : 0;
    valueScore += frontmatter.tags.length > 2 ? 15 : 0;
    valueScore += this.hasActionableContent(content) ? 15 : 0;

    const overallScore = Math.round((completenessScore + accuracyScore + structureScore + valueScore) / 4);

    return {
      completenessScore: Math.round(completenessScore),
      accuracyScore: Math.round(accuracyScore),
      structureScore: Math.round(structureScore),
      valueScore: Math.round(valueScore),
      overallScore
    };
  }

  private static hasActionableContent(content: string): boolean {
    const actionableKeywords = [
      'how to', 'step by step', 'implement', 'apply', 'action', 'recommendation',
      'strategy', 'technique', 'method', 'approach', 'solution', 'best practice'
    ];

    const lowerContent = content.toLowerCase();
    return actionableKeywords.some(keyword => lowerContent.includes(keyword));
  }

  private static createFallbackResponse(
    response: GenerationResponse,
    contentType: ContentType,
    sourceUrl: string,
    metadata: ProcessingMetadata
  ): ProcessedGeminiGem {
    const fallbackFrontmatter: GeminiGemFrontmatter = {
      title: 'Content Analysis (Processing Error)',
      source: sourceUrl,
      type: contentType,
      processed: new Date().toISOString().split('T')[0],
      tags: ['error', 'processing-failed'],
      entities: [],
      insights: ['Content processing encountered an error']
    };

    const fallbackContent = `# Content Analysis Error

The content analysis encountered an error during processing.

## Original Response
${response.text}

## Error Details
${metadata.validationErrors.join('\n')}

## Recommendations
- Please check the content source and try again
- Verify the content is accessible and not behind paywalls
- Try with a different content format if available`;

    return {
      frontmatter: fallbackFrontmatter,
      content: fallbackContent,
      rawResponse: response.text,
      qualityScore: 25,
      processingMetadata: metadata
    };
  }

  static generateMarkdownOutput(processedGeminiGem: ProcessedGeminiGem): string {
    const { frontmatter, content } = processedGeminiGem;

    // Convert frontmatter to YAML
    const yamlLines = ['---'];
    for (const [key, value] of Object.entries(frontmatter)) {
      if (Array.isArray(value)) {
        yamlLines.push(`${key}: [${value.map(v => `"${v}"`).join(', ')}]`);
      } else if (value !== undefined && value !== null) {
        yamlLines.push(`${key}: "${value}"`);
      }
    }
    yamlLines.push('---');
    yamlLines.push('');

    return yamlLines.join('\n') + content;
  }

  static validateGeminiGemFormat(processedGeminiGem: ProcessedGeminiGem): ResponseValidationError[] {
    const errors: ResponseValidationError[] = [];

    // Validate frontmatter structure
    if (!processedGeminiGem.frontmatter.title) {
      errors.push({ field: 'title', message: 'Title is required', severity: 'error' });
    }

    if (!processedGeminiGem.frontmatter.type) {
      errors.push({ field: 'type', message: 'Content type is required', severity: 'error' });
    }

    if (!processedGeminiGem.frontmatter.processed) {
      errors.push({ field: 'processed', message: 'Processing date is required', severity: 'error' });
    }

    // Validate content structure
    if (!processedGeminiGem.content || processedGeminiGem.content.trim().length === 0) {
      errors.push({ field: 'content', message: 'Content is required', severity: 'error' });
    }

    // Quality warnings
    if (processedGeminiGem.qualityScore < 50) {
      errors.push({
        field: 'quality',
        message: `Low quality score: ${processedGeminiGem.qualityScore}`,
        severity: 'warning'
      });
    }

    if (processedGeminiGem.processingMetadata.validationErrors.length > 0) {
      errors.push({
        field: 'validation',
        message: `${processedGeminiGem.processingMetadata.validationErrors.length} validation errors`,
        severity: 'warning'
      });
    }

    return errors;
  }
}
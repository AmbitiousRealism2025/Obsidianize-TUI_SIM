/**
 * Content Formatting Engine for Obsidianize
 * Handles conversion of GeminiGem data to various output formats
 *
 * Version: 1.0.0
 * Last Updated: October 11, 2024
 */

import { type GeminiGem, OutputFormat, type ProcessingOptions, type ContentSection } from '../types/index.js';
import * as YAML from 'yaml';
import matter from 'gray-matter';

// ============================================================================
// FORMATTER INTERFACES
// ============================================================================

/** Base formatter interface */
export interface IFormatter {
  /** Format the GeminiGem data to string output */
  format(gem: GeminiGem): Promise<string>;

  /** Get the output format this formatter handles */
  getFormat(): OutputFormat;

  /** Validate that the data can be formatted */
  validate(gem: GeminiGem): Promise<boolean>;
}

/** Markdown formatter options */
export interface MarkdownFormatterOptions {
  /** Include table of contents */
  includeTOC: boolean;

  /** Include timestamps */
  includeTimestamps: boolean;

  /** Section heading level (1-6) */
  baseHeadingLevel: number;

  /** Code block language for analysis */
  analysisCodeLanguage: string;

  /** Custom CSS classes */
  cssClasses?: {
    container?: string;
    summary?: string;
    keyPoints?: string;
    analysis?: string;
    sections?: string;
  };
}

// ============================================================================
// YAML FRONTMATTER FORMATTER
// ============================================================================

/** YAML frontmatter generator */
export class FrontmatterFormatter {
  private options: {
    /** Sort frontmatter keys alphabetically */
    sortKeys: boolean;

    /** Custom YAML formatting options */
    yamlOptions: YAML.DocumentOptions;
  };

  constructor(options: Partial<typeof FrontmatterFormatter.prototype.options> = {}) {
    this.options = {
      sortKeys: true,
      yamlOptions: {
        version: '1.2'
      } as YAML.DocumentOptions,
      ...options
    };
  }

  /** Generate YAML frontmatter from GeminiGem frontmatter */
  async generate(gem: GeminiGem): Promise<string> {
    const frontmatter = gem.frontmatter;

    // Prepare frontmatter data
    const frontmatterData = {
      title: frontmatter.title,
      source: frontmatter.source,
      type: frontmatter.type,
      processed: frontmatter.processed.toISOString(),
      tags: frontmatter.tags.sort(),
      entities: this.formatEntities(frontmatter.entities),
      insights: frontmatter.insights,
      confidence: frontmatter.confidence,
      processingTime: frontmatter.processingTime,
      ...frontmatter.metadata
    };

    // Convert to YAML
    const yamlString = YAML.stringify(frontmatterData, this.options.yamlOptions);

    // Wrap in YAML delimiters
    return `---\n${yamlString.trim()}\n---`;
  }

  /** Format entities for frontmatter */
  private formatEntities(entities: Array<{
    text: string;
    type: string;
    confidence: number;
  }>): Array<{ name: string; type: string; confidence: number }> {
    return entities.map(entity => ({
      name: entity.text,
      type: entity.type,
      confidence: Math.round(entity.confidence * 100) / 100
    }));
  }

  /** Parse frontmatter from existing markdown */
  parse(markdownContent: string): { data: Record<string, any>; content: string } {
    return matter(markdownContent);
  }
}

// ============================================================================
// MARKDOWN FORMATTER
// ============================================================================

/** Markdown output formatter */
export class MarkdownFormatter implements IFormatter {
  private frontmatterFormatter: FrontmatterFormatter;
  private options: MarkdownFormatterOptions;

  constructor(options: Partial<MarkdownFormatterOptions> = {}) {
    this.frontmatterFormatter = new FrontmatterFormatter();
    this.options = {
      includeTOC: true,
      includeTimestamps: true,
      baseHeadingLevel: 2,
      analysisCodeLanguage: 'text',
      cssClasses: {
        container: 'obsidianize-container',
        summary: 'obsidianize-summary',
        keyPoints: 'obsidianize-key-points',
        analysis: 'obsidianize-analysis',
        sections: 'obsidianize-sections'
      },
      ...options
    };
  }

  /** Format GeminiGem as markdown */
  async format(gem: GeminiGem): Promise<string> {
    const sections: string[] = [];

    // Generate frontmatter
    sections.push(await this.frontmatterFormatter.generate(gem));
    sections.push('');

    // Add table of contents if enabled
    if (this.options.includeTOC) {
      sections.push(this.generateTOC(gem));
      sections.push('');
    }

    // Add content sections
    sections.push(this.formatSummary(gem.content.summary));
    sections.push('');

    sections.push(this.formatKeyPoints(gem.content.keyPoints));
    sections.push('');

    sections.push(this.formatSections(gem.content.sections));
    sections.push('');

    sections.push(this.formatAnalysis(gem.content.analysis));

    // Add transcript if available
    if (gem.content.transcript) {
      sections.push('');
      sections.push(this.formatTranscript(gem.content.transcript));
    }

    // Add related resources if available
    if (gem.content.relatedResources?.length) {
      sections.push('');
      sections.push(this.formatRelatedResources(gem.content.relatedResources));
    }

    return sections.join('\n');
  }

  /** Get the output format */
  getFormat(): OutputFormat {
    return OutputFormat.MARKDOWN;
  }

  /** Validate GeminiGem for markdown formatting */
  async validate(gem: GeminiGem): Promise<boolean> {
    const requiredFields = ['title', 'source', 'type', 'processed'];
    const hasRequiredFields = requiredFields.every(field =>
      field in gem.frontmatter && gem.frontmatter[field as keyof typeof gem.frontmatter] !== undefined
    );

    const hasContent = Boolean(gem.content.summary && gem.content.keyPoints.length > 0);

    return hasRequiredFields && hasContent;
  }

  /** Generate table of contents */
  private generateTOC(gem: GeminiGem): string {
    const toc: string[] = [
      '## Table of Contents',
      '',
      '- [Summary](#summary)',
      '- [Key Points](#key-points)',
      ''
    ];

    // Add sections to TOC
    if (gem.content.sections.length > 0) {
      toc.push('- [Content Sections](#content-sections)');

      gem.content.sections.forEach(section => {
        const anchor = this.generateAnchor(section.heading);
        toc.push(`  - [${section.heading}](#${anchor})`);
      });
      toc.push('');
    }

    toc.push('- [Analysis](#analysis)');

    if (gem.content.transcript) {
      toc.push('- [Transcript](#transcript)');
    }

    if (gem.content.relatedResources?.length) {
      toc.push('- [Related Resources](#related-resources)');
    }

    return toc.join('\n');
  }

  /** Format summary section */
  private formatSummary(summary: string): string {
    const className = this.options.cssClasses?.summary;
    const heading = this.generateHeading('Summary', this.options.baseHeadingLevel);
    const wrapper = className ? `<div class="${className}">\n` : '';

    return [
      heading,
      wrapper,
      summary,
      className ? '</div>' : ''
    ].filter(Boolean).join('\n');
  }

  /** Format key points section */
  private formatKeyPoints(keyPoints: string[]): string {
    const className = this.options.cssClasses?.keyPoints;
    const heading = this.generateHeading('Key Points', this.options.baseHeadingLevel);
    const wrapper = className ? `<div class="${className}">\n` : '';

    const pointsList = keyPoints.map(point => `- ${point}`).join('\n');

    return [
      heading,
      wrapper,
      pointsList,
      className ? '</div>' : ''
    ].filter(Boolean).join('\n');
  }

  /** Format content sections */
  private formatSections(sections: ContentSection[]): string {
    if (sections.length === 0) return '';

    const className = this.options.cssClasses?.sections;
    const wrapper = className ? `<div class="${className}">\n` : '';
    const heading = this.generateHeading('Content Sections', this.options.baseHeadingLevel);

    const formattedSections = sections.map(section =>
      this.formatSection(section, this.options.baseHeadingLevel + 1)
    ).join('\n\n');

    return [
      heading,
      wrapper,
      formattedSections,
      className ? '</div>' : ''
    ].filter(Boolean).join('\n');
  }

  /** Format individual section */
  private formatSection(section: ContentSection, headingLevel: number): string {
    const sectionHeading = this.generateHeading(section.heading, headingLevel);
    const subsections = section.subsections?.map(sub =>
      this.formatSection(sub, headingLevel + 1)
    ).join('\n\n') || '';

    return [
      sectionHeading,
      section.content,
      subsections
    ].filter(Boolean).join('\n');
  }

  /** Format analysis section */
  private formatAnalysis(analysis: string): string {
    const className = this.options.cssClasses?.analysis;
    const heading = this.generateHeading('Analysis', this.options.baseHeadingLevel);
    const wrapper = className ? `<div class="${className}">\n` : '';

    // Wrap analysis in code block for better formatting
    const codeBlock = `\`\`\`${this.options.analysisCodeLanguage}\n${analysis}\n\`\`\``;

    return [
      heading,
      wrapper,
      codeBlock,
      className ? '</div>' : ''
    ].filter(Boolean).join('\n');
  }

  /** Format transcript section */
  private formatTranscript(transcript: string): string {
    const heading = this.generateHeading('Transcript', this.options.baseHeadingLevel);

    return [
      heading,
      '\`\`\`transcript\n' + transcript + '\n\`\`\`'
    ].join('\n');
  }

  /** Format related resources */
  private formatRelatedResources(resources: Array<{
    title: string;
    url: string;
    type: string;
    relevance: number;
    description?: string;
  }>): string {
    const heading = this.generateHeading('Related Resources', this.options.baseHeadingLevel);

    const resourceList = resources.map(resource => {
      const relevance = Math.round(resource.relevance * 100);
      const description = resource.description ? `\n  ${resource.description}` : '';

      return `- [${resource.title}](${resource.url}) (${resource.type}, ${relevance}% relevant)${description}`;
    }).join('\n');

    return [heading, resourceList].join('\n');
  }

  /** Generate heading with proper level */
  private generateHeading(text: string, level: number): string {
    const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
    return `${hashes} ${text}`;
  }

  /** Generate anchor from heading text */
  private generateAnchor(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

// ============================================================================
// JSON FORMATTER
// ============================================================================

/** JSON output formatter */
export class JSONFormatter implements IFormatter {
  private options: {
    /** Pretty print JSON */
    pretty: boolean;

    /** Include metadata */
    includeMetadata: boolean;

    /** Custom replacer function */
    replacer?: (key: string, value: any) => any;
  };

  constructor(options: Partial<typeof JSONFormatter.prototype.options> = {}) {
    this.options = {
      pretty: true,
      includeMetadata: true,
      ...options
    };
  }

  /** Format GeminiGem as JSON */
  async format(gem: GeminiGem): Promise<string> {
    const data = this.prepareData(gem);

    const jsonString = JSON.stringify(
      data,
      this.options.replacer,
      this.options.pretty ? 2 : 0
    );

    return jsonString;
  }

  /** Get the output format */
  getFormat(): OutputFormat {
    return OutputFormat.JSON;
  }

  /** Validate GeminiGem for JSON formatting */
  async validate(gem: GeminiGem): Promise<boolean> {
    try {
      // Test JSON serialization
      JSON.stringify(gem);
      return true;
    } catch {
      return false;
    }
  }

  /** Prepare data for JSON output */
  private prepareData(gem: GeminiGem): Record<string, any> {
    const baseData = {
      frontmatter: {
        ...gem.frontmatter,
        processed: gem.frontmatter.processed.toISOString()
      },
      content: gem.content
    };

    if (!this.options.includeMetadata) {
      // Remove processing metadata
      delete baseData.frontmatter.confidence;
      delete baseData.frontmatter.processingTime;
    }

    return baseData;
  }
}

// ============================================================================
// YAML FORMATTER
// ============================================================================

/** YAML output formatter */
export class YAMLFormatter implements IFormatter {
  private options: {
    /** YAML formatting options */
    yamlOptions: YAML.DocumentOptions;

    /** Include metadata */
    includeMetadata: boolean;
  };

  constructor(options: Partial<typeof YAMLFormatter.prototype.options> = {}) {
    this.options = {
      yamlOptions: {
        version: '1.2'
      } as YAML.DocumentOptions,
      includeMetadata: true,
      ...options
    };
  }

  /** Format GeminiGem as YAML */
  async format(gem: GeminiGem): Promise<string> {
    const data = this.prepareData(gem);
    return YAML.stringify(data, this.options.yamlOptions);
  }

  /** Get the output format */
  getFormat(): OutputFormat {
    return OutputFormat.YAML;
  }

  /** Validate GeminiGem for YAML formatting */
  async validate(gem: GeminiGem): Promise<boolean> {
    try {
      // Test YAML serialization
      YAML.stringify(gem);
      return true;
    } catch {
      return false;
    }
  }

  /** Prepare data for YAML output */
  private prepareData(gem: GeminiGem): Record<string, any> {
    const data = {
      frontmatter: {
        ...gem.frontmatter,
        processed: gem.frontmatter.processed.toISOString()
      },
      content: gem.content
    };

    if (!this.options.includeMetadata) {
      // Remove processing metadata
      delete data.frontmatter.confidence;
      delete data.frontmatter.processingTime;
    }

    return data;
  }
}

// ============================================================================
// FORMATTER FACTORY
// ============================================================================

/** Factory for creating formatters */
export class FormatterFactory {
  private static formatters = new Map<OutputFormat, () => IFormatter>([
    [OutputFormat.MARKDOWN, () => new MarkdownFormatter()],
    [OutputFormat.JSON, () => new JSONFormatter()],
    [OutputFormat.YAML, () => new YAMLFormatter()]
  ]);

  /** Create formatter for specified format */
  static create(format: OutputFormat, options?: unknown): IFormatter {
    const formatterFactory = this.formatters.get(format);

    if (!formatterFactory) {
      throw new Error(`Unsupported output format: ${format}`);
    }

    return formatterFactory();
  }

  /** Get available formats */
  static getAvailableFormats(): OutputFormat[] {
    return Array.from(this.formatters.keys());
  }

  /** Register custom formatter */
  static register(format: OutputFormat, factory: () => IFormatter): void {
    this.formatters.set(format, factory);
  }
}

// ============================================================================
// CONTENT STRUCTURE UTILITIES
// ============================================================================

/** Utilities for content structuring */
export class ContentStructureUtils {
  /** Create filename from GeminiGem */
  static createFilename(gem: GeminiGem, pattern?: string): string {
    const timestamp = gem.frontmatter.processed.toISOString().split('T')[0];
    const slug = this.slugify(gem.frontmatter.title);

    if (pattern) {
      return pattern
        .replace('{title}', slug)
        .replace('{date}', timestamp)
        .replace('{type}', gem.frontmatter.type)
        .replace('{id}', crypto.randomUUID().slice(0, 8));
    }

    return `${timestamp}-${slug}.md`;
  }

  /** Slugify text for filenames */
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50); // Limit length
  }

  /** Normalize and validate tags */
  static normalizeTags(tags: string[], options: {
    maxTags?: number;
    format?: 'lowercase' | 'uppercase' | 'camelCase' | 'original';
    exclude?: string[];
  } = {}): string[] {
    const {
      maxTags = 20,
      format = 'lowercase',
      exclude = []
    } = options;

    let normalized = tags
      .filter(tag => tag && typeof tag === 'string')
      .filter(tag => !exclude.includes(tag))
      .map(tag => this.formatTag(tag, format))
      .filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
      .slice(0, maxTags);

    return normalized;
  }

  /** Format single tag */
  private static formatTag(tag: string, format: string): string {
    switch (format) {
      case 'lowercase':
        return tag.toLowerCase();
      case 'uppercase':
        return tag.toUpperCase();
      case 'camelCase':
        return tag.charAt(0).toLowerCase() + tag.slice(1).replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
      case 'original':
      default:
        return tag;
    }
  }

  /** Extract key insights from analysis */
  static extractInsights(analysis: string, maxInsights: number = 5): string[] {
    // Simple insight extraction - in production, this would use AI
    const sentences = analysis.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, maxInsights).map(s => s.trim() + '.');
  }
}
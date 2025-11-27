import axios from 'axios';
import * as cheerio from 'cheerio';
// import pdfParse from 'pdf-parse';
import { URL } from 'url';
import { createLogger } from '../logging/index.js';

const logger = createLogger('content-analyzer');

export type ContentType = 'youtube' | 'article' | 'paper' | 'podcast' | 'unknown';

export interface ContentMetadata {
  title?: string;
  description?: string;
  author?: string;
  publishDate?: Date;
  duration?: string;
  thumbnail?: string;
  tags?: string[];
  language?: string;
}

export interface ExtractedContent {
  type: ContentType;
  url: string;
  metadata: ContentMetadata;
  content: string;
  wordCount: number;
  extractedAt: Date;
}

export interface ContentValidationError {
  field: string;
  message: string;
  code: string;
}

export class ContentAnalyzer {
  private static readonly CONTENT_LIMITS = {
    maxWordCount: 50000,
    minWordCount: 100,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxUrlLength: 2048
  };

  private static readonly YOUTUBE_PATTERNS = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/
  ];

  private static readonly ARTICLE_PATTERNS = [
    /\.(html|htm)(\?.*)?$/i,
    /\.(php|asp|jsp)(\?.*)?$/i
  ];

  private static readonly PDF_PATTERNS = [
    /\.pdf(\?.*)?$/i
  ];

  private static readonly PODCAST_PATTERNS = [
    /anchor\.fm\/([^\/]+)/,
    /spotify\.com\/episode\//,
    /podcasts\.apple\.com\/podcast\//,
    /stitcher\.com\/podcast\//,
    /soundcloud\.com\/([^\/]+)\/([^\/]+)/
  ];

  static async analyzeContent(url: string): Promise<ExtractedContent> {
    // Validate URL first
    this.validateUrl(url);

    // Detect content type
    const contentType = this.detectContentType(url);
    logger.debug('Detected content type', { contentType, url });

    // Extract content based on type
    switch (contentType) {
      case 'youtube':
        return await this.extractYouTubeContent(url);
      case 'article':
        return await this.extractArticleContent(url);
      case 'paper':
        return await this.extractPdfContent(url);
      case 'podcast':
        return await this.extractPodcastContent(url);
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }
  }

  static detectContentType(url: string): ContentType {
    const normalizedUrl = url.toLowerCase();

    // Check YouTube patterns
    for (const pattern of this.YOUTUBE_PATTERNS) {
      if (pattern.test(normalizedUrl)) {
        return 'youtube';
      }
    }

    // Check PDF patterns
    for (const pattern of this.PDF_PATTERNS) {
      if (pattern.test(normalizedUrl)) {
        return 'paper';
      }
    }

    // Check podcast patterns
    for (const pattern of this.PODCAST_PATTERNS) {
      if (pattern.test(normalizedUrl)) {
        return 'podcast';
      }
    }

    // Check article patterns
    for (const pattern of this.ARTICLE_PATTERNS) {
      if (pattern.test(normalizedUrl)) {
        return 'article';
      }
    }

    // Default to article for general web content
    if (url.startsWith('http')) {
      return 'article';
    }

    return 'unknown';
  }

  private static validateUrl(url: string): void {
    const errors: ContentValidationError[] = [];

    if (!url || typeof url !== 'string') {
      errors.push({
        field: 'url',
        message: 'URL is required and must be a string',
        code: 'MISSING_URL'
      });
    } else {
      if (url.length > this.CONTENT_LIMITS.maxUrlLength) {
        errors.push({
          field: 'url',
          message: `URL too long (max ${this.CONTENT_LIMITS.maxUrlLength} characters)`,
          code: 'URL_TOO_LONG'
        });
      }

      try {
        new URL(url);
      } catch {
        errors.push({
          field: 'url',
          message: 'Invalid URL format',
          code: 'INVALID_URL'
        });
      }
    }

    if (errors.length > 0) {
      throw new Error(`Content validation failed: ${errors.map(e => e.message).join(', ')}`);
    }
  }

  private static async extractYouTubeContent(url: string): Promise<ExtractedContent> {
    try {
      // Extract video ID from URL
      let videoId = '';
      for (const pattern of this.YOUTUBE_PATTERNS) {
        const match = url.match(pattern);
        if (match) {
          videoId = match[1];
          break;
        }
      }

      if (!videoId) {
        throw new Error('Could not extract YouTube video ID from URL');
      }

      // For YouTube, we would normally use YouTube Data API
      // For this implementation, we'll extract basic info from the page
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);

      // Extract metadata
      const title = $('title').text().replace(' - YouTube', '') || 'YouTube Video';
      const description = $('meta[name="description"]').attr('content') || '';

      // Try to extract video duration from page
      let duration = '';
      const durationText = $('.ytp-time-duration').text();
      if (durationText) {
        duration = durationText.trim();
      }

      // Extract content (description + any available transcript data)
      let content = description;

      // Try to extract additional content from the page
      const descriptionElement = $('#description').text();
      if (descriptionElement) {
        content += '\n\n' + descriptionElement;
      }

      // Add note about transcript extraction
      content += '\n\n[Note: Full transcript extraction requires YouTube Data API integration]';

      return {
        type: 'youtube',
        url,
        metadata: {
          title,
          description: description.substring(0, 500) + (description.length > 500 ? '...' : ''),
          duration,
          tags: this.extractTagsFromContent(title + ' ' + description)
        },
        content: content.trim(),
        wordCount: this.countWords(content),
        extractedAt: new Date()
      };

    } catch (error: any) {
      throw new Error(`Failed to extract YouTube content: ${error.message}`);
    }
  }

  private static async extractArticleContent(url: string): Promise<ExtractedContent> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);

      // Extract metadata
      const title =
        $('title').text() ||
        $('h1').first().text() ||
        $('[property="og:title"]').attr('content') ||
        'Article';

      const description =
        $('[name="description"]').attr('content') ||
        $('[property="og:description"]').attr('content') ||
        '';

      const author =
        $('[name="author"]').attr('content') ||
        $('.author').text() ||
        $('.byline').text() ||
        '';

      // Extract publish date
      let publishDate: Date | undefined;
      const dateStr =
        $('[name="date"]').attr('content') ||
        $('[property="article:published_time"]').attr('content') ||
        $('.date').text() ||
        $('.published').text();

      if (dateStr) {
        publishDate = new Date(dateStr);
      }

      // Extract main content
      let content = '';

      // Try different content selectors in order of preference
      const contentSelectors = [
        'article',
        '.content',
        '.post-content',
        '.entry-content',
        '.article-content',
        'main',
        '.main-content',
        '#content'
      ];

      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          if (content.length > 500) {
            break;
          }
        }
      }

      // If no content found, extract from body but filter out scripts and styles
      if (!content) {
        $('script, style, nav, header, footer, aside').remove();
        content = $('body').text().trim();
      }

      // Clean up content
      content = this.cleanTextContent(content);

      return {
        type: 'article',
        url,
        metadata: {
          title: title.trim(),
          description: description.substring(0, 500) + (description.length > 500 ? '...' : ''),
          author: author.trim(),
          publishDate,
          tags: this.extractTagsFromContent(title + ' ' + description)
        },
        content,
        wordCount: this.countWords(content),
        extractedAt: new Date()
      };

    } catch (error: any) {
      throw new Error(`Failed to extract article content: ${error.message}`);
    }
  }

  private static async extractPdfContent(url: string): Promise<ExtractedContent> {
    // PDF processing temporarily disabled - requires additional setup
    const urlPath = new URL(url).pathname;
    const filename = urlPath.split('/').pop() || 'PDF Document';
    const title = filename.replace('.pdf', '').replace(/[-_]/g, ' ') || 'PDF Document';

    return {
      type: 'paper',
      url,
      metadata: {
        title,
        tags: ['pdf', 'document']
      },
        content: `# PDF Document Analysis

**Note**: Full PDF text extraction requires additional library setup.

**File**: ${title}
**Source**: ${url}

## Available Information
- Document title extracted from filename
- PDF format detected
- Content analysis pending library setup

## Recommendations
1. Set up PDF processing library
2. Configure OCR for scanned documents
3. Implement text extraction pipeline

To enable full PDF analysis, install and configure pdf-parse library with proper Node.js compatibility.`,
      wordCount: 50,
      extractedAt: new Date()
    };
  }

  private static async extractPodcastContent(url: string): Promise<ExtractedContent> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);

      // Extract podcast metadata
      const title =
        $('title').text() ||
        $('h1').first().text() ||
        $('[property="og:title"]').attr('content') ||
        'Podcast Episode';

      const description =
        $('[name="description"]').attr('content') ||
        $('[property="og:description"]').attr('content') ||
        $('.description').text() ||
        '';

      // Extract episode number if available
      const episodeMatch = title.match(/episode\s*(\d+)/i);
      const episodeNumber = episodeMatch ? episodeMatch[1] : '';

      // Extract content
      let content = description;

      // Try to find transcript or show notes
      const transcriptElement = $('.transcript, .show-notes, .episode-notes').text();
      if (transcriptElement) {
        content += '\n\n' + transcriptElement;
      }

      // Add note about audio transcription
      content += '\n\n[Note: Audio transcription requires speech-to-text service integration]';

      return {
        type: 'podcast',
        url,
        metadata: {
          title: title.trim(),
          description: description.substring(0, 500) + (description.length > 500 ? '...' : ''),
          tags: this.extractTagsFromContent(title + ' ' + description)
        },
        content: content.trim(),
        wordCount: this.countWords(content),
        extractedAt: new Date()
      };

    } catch (error: any) {
      throw new Error(`Failed to extract podcast content: ${error.message}`);
    }
  }

  private static cleanTextContent(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
      .replace(/(\r\n|\r|\n)/g, '\n') // Normalize line endings
      .trim();
  }

  private static countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private static extractTagsFromContent(content: string): string[] {
    // Simple keyword extraction - in production, you'd use NLP libraries
    const words = content.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    // Count word frequency
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Return top 5 most frequent words as tags
    return Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private static isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'was', 'are', 'were', 'been', 'be', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
      'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i',
      'you', 'he', 'she', 'it', 'we', 'they', 'what', 'where', 'when', 'why',
      'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
      'too', 'very', 'just', 'now'
    ]);

    return stopWords.has(word);
  }

  static validateExtractedContent(content: ExtractedContent): ContentValidationError[] {
    const errors: ContentValidationError[] = [];

    if (content.wordCount < this.CONTENT_LIMITS.minWordCount) {
      errors.push({
        field: 'content',
        message: `Content too short (minimum ${this.CONTENT_LIMITS.minWordCount} words)`,
        code: 'CONTENT_TOO_SHORT'
      });
    }

    if (content.wordCount > this.CONTENT_LIMITS.maxWordCount) {
      errors.push({
        field: 'content',
        message: `Content too long (maximum ${this.CONTENT_LIMITS.maxWordCount} words)`,
        code: 'CONTENT_TOO_LONG'
      });
    }

    if (!content.content || content.content.trim().length === 0) {
      errors.push({
        field: 'content',
        message: 'No content extracted',
        code: 'NO_CONTENT'
      });
    }

    return errors;
  }
}
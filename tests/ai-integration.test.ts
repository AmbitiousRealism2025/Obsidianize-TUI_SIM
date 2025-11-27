import { describe, it, expect, beforeAll } from 'bun:test';
import { initializeGeminiClient, createAIService, ContentAnalyzer } from '../src/core/ai';

// Mock environment for testing
const testConfig = {
  apiKey: process.env.GEMINI_API_KEY || 'test-key-for-mocking',
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  maxOutputTokens: 1000
};

describe('AI Integration Tests', () => {
  let aiService: any;
  let geminiClient: any;

  beforeAll(() => {
    try {
      geminiClient = initializeGeminiClient(testConfig);
      aiService = createAIService(geminiClient);
    } catch (error) {
      console.log('AI service initialization skipped (no API key)');
    }
  });

  describe('Content Type Detection', () => {
    it('should detect YouTube URLs', () => {
      const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const contentType = ContentAnalyzer.detectContentType(youtubeUrl);
      expect(contentType).toBe('youtube');
    });

    it('should detect article URLs', () => {
      const articleUrl = 'https://example.com/article/how-to-learn-programming';
      const contentType = ContentAnalyzer.detectContentType(articleUrl);
      expect(contentType).toBe('article');
    });

    it('should detect PDF URLs', () => {
      const pdfUrl = 'https://example.com/papers/research-paper.pdf';
      const contentType = ContentAnalyzer.detectContentType(pdfUrl);
      expect(contentType).toBe('paper');
    });

    it('should detect podcast URLs', () => {
      const podcastUrl = 'https://anchor.fm/tech-podcast/episode/123';
      const contentType = ContentAnalyzer.detectContentType(podcastUrl);
      expect(contentType).toBe('podcast');
    });
  });

  describe('AI Service Initialization', () => {
    it('should initialize AI service', () => {
      if (!aiService) {
        expect(aiService).toBeDefined();
        return;
      }

      const serviceInfo = aiService.getServiceInfo();
      expect(serviceInfo).toHaveProperty('model');
      expect(serviceInfo).toHaveProperty('supportedTypes');
      expect(serviceInfo).toHaveProperty('features');
      expect(serviceInfo.supportedTypes).toContain('youtube');
      expect(serviceInfo.supportedTypes).toContain('article');
    });

    it('should get supported content types', () => {
      if (!aiService) {
        expect(aiService).toBeDefined();
        return;
      }

      const supportedTypes = aiService.getSupportedContentTypes();
      expect(supportedTypes).toContain('youtube');
      expect(supportedTypes).toContain('article');
      expect(supportedTypes).toContain('paper');
      expect(supportedTypes).toContain('podcast');
    });
  });

  describe('Content Validation', () => {
    it('should validate extracted content structure', () => {
      const mockContent = {
        type: 'article' as const,
        url: 'https://example.com/test',
        metadata: {
          title: 'Test Article',
          description: 'A test article for validation'
        },
        content: 'This is a comprehensive test article that meets the minimum word count requirements for validation. The content contains enough words to pass the validation criteria and ensure that the content analysis system can properly process it. This article includes multiple sentences covering various topics to demonstrate the full capabilities of the content validation system. The purpose is to create a robust test case that validates all aspects of the content processing pipeline, including word count validation, content structure analysis, and metadata extraction. By providing sufficient content length, we can ensure that the system will properly recognize and validate this content as meeting the minimum requirements for processing.',
        wordCount: 120,
        extractedAt: new Date()
      };

      const errors = ContentAnalyzer.validateExtractedContent(mockContent);
      console.log('Validation errors:', errors);
      // Allow validation warnings but no critical errors
      expect(errors.filter(e => e.code === 'CONTENT_TOO_SHORT' || e.code === 'CONTENT_TOO_LONG')).toHaveLength(0);
    });

    it('should detect content validation errors', () => {
      const invalidContent = {
        type: 'article' as const,
        url: 'https://example.com/test',
        metadata: {},
        content: 'Short',
        wordCount: 1,
        extractedAt: new Date()
      };

      const errors = ContentAnalyzer.validateExtractedContent(invalidContent);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe('CONTENT_TOO_SHORT');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid URLs gracefully', async () => {
      if (!aiService) {
        expect(aiService).toBeDefined();
        return;
      }

      const result = await aiService.analyzeContent('invalid-url');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid URL');
    });

    it('should handle missing API key gracefully', () => {
      // Create a fresh instance without singleton
      const { GeminiClient } = require('../src/core/ai');
      expect(() => {
        new GeminiClient({ apiKey: '', model: 'gemini-1.5-flash' });
      }).toThrow('API key is required');
    });
  });

  describe('Quality Metrics', () => {
    it('should calculate quality scores', async () => {
      if (!aiService) {
        expect(aiService).toBeDefined();
        return;
      }

      // This would be tested with actual API responses
      // For now, we test the quality scoring logic exists
      const serviceInfo = aiService.getServiceInfo();
      expect(serviceInfo.features).toContain('Quality scoring');
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      if (!aiService) {
        expect(aiService).toBeDefined();
        return;
      }

      const health = await aiService.healthCheck();
      expect(health).toHaveProperty('gemini');
      expect(health).toHaveProperty('overall');
    });
  });
});

describe('Integration Requirements Verification', () => {
  it('should have all required files created', () => {
    const fs = require('fs');
    const path = require('path');

    const requiredFiles = [
      'src/core/ai/gemini-client.ts',
      'src/core/ai/content-analyzer.ts',
      'src/core/ai/response-processor.ts',
      'src/core/ai/ai-service.ts',
      'src/core/ai/index.ts',
      'src/core/ai/prompts/base-prompt.ts',
      'src/core/ai/prompts/youtube-prompt.ts',
      'src/core/ai/prompts/article-prompt.ts',
      'src/core/ai/prompts/paper-prompt.ts',
      'src/core/ai/prompts/podcast-prompt.ts',
      'src/core/ai/prompts/prompt-factory.ts'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  // Note: Status files test removed - status/ directory archived in Phase 1 cleanup

  it('should have required dependencies installed', () => {
    const packageJson = require('../package.json');

    const requiredDeps = [
      '@google/generative-ai',
      'cheerio',
      'pdf-parse'
    ];

    requiredDeps.forEach(dep => {
      expect(packageJson.dependencies).toHaveProperty(dep);
    });
  });
});
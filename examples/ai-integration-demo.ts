#!/usr/bin/env bun

/**
 * Gemini AI Integration Demo
 *
 * This demo shows how to use the complete AI integration system
 * for content analysis and Gemini Gem generation.
 */

import { initializeGeminiClient, createAIService } from '../src/core/ai';

async function main() {
  console.log('🤖 Gemini AI Integration Demo');
  console.log('================================\n');

  // Check for API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY environment variable is required');
    console.log('Set it with: export GEMINI_API_KEY="your-api-key"');
    process.exit(1);
  }

  try {
    // Initialize AI service
    console.log('🔧 Initializing AI service...');
    const geminiClient = initializeGeminiClient({
      apiKey,
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxOutputTokens: 2048
    });

    const aiService = createAIService(geminiClient);
    console.log('✅ AI service initialized successfully\n');

    // Get service information
    const serviceInfo = aiService.getServiceInfo();
    console.log('📊 Service Information:');
    console.log(`   Model: ${serviceInfo.model}`);
    console.log(`   Supported Types: ${serviceInfo.supportedTypes.join(', ')}`);
    console.log(`   Features: ${serviceInfo.features.length} features enabled\n`);

    // Perform health check
    console.log('🏥 Performing health check...');
    const health = await aiService.healthCheck();
    if (health.overall) {
      console.log('✅ AI service is healthy\n');
    } else {
      console.log('❌ AI service health check failed');
      console.log(`   Gemini: ${health.gemini ? '✅' : '❌'}\n`);
    }

    // Test content type detection
    console.log('🔍 Testing content type detection...');
    const testUrls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://example.com/blog/article-about-technology',
      'https://arxiv.org/pdf/2301.07041.pdf',
      'https://anchor.fm/tech-podcast/episode/ai-future'
    ];

    testUrls.forEach(url => {
      const contentType = aiService.detectContentType(url);
      console.log(`   ${url} → ${contentType}`);
    });
    console.log();

    // Example of analyzing content (commented out as it requires real API calls)
    console.log('📝 Example Usage:');
    console.log(`
// Analyze a single URL
const result = await aiService.analyzeContent('https://example.com/article');

if (result.success) {
  console.log('✅ Analysis completed successfully');
  console.log('Quality Score:', result.metadata.qualityScore);
  console.log('Tokens Used:', result.metadata.tokensUsed);

  // Generate markdown output
  const markdown = aiService.generateMarkdown(result);
  console.log(markdown);
} else {
  console.error('❌ Analysis failed:', result.error);
}

// Batch analyze multiple URLs
const urls = [
  'https://youtube.com/watch?v=example1',
  'https://example.com/article1',
  'https://example.com/article2'
];

const batchResults = await aiService.analyzeBatch(urls);
const successCount = batchResults.filter(r => r.success).length;
console.log(\`\${successCount}/\${urls.length} analyses successful\`);
    `);

    // Demonstrate error handling
    console.log('🛡️  Testing error handling...');
    try {
      const errorResult = await aiService.analyzeContent('invalid-url');
      if (!errorResult.success) {
        console.log('✅ Error handling works correctly');
        console.log(`   Error: ${errorResult.error}`);
      }
    } catch (error) {
      console.log('❌ Unexpected error in error handling');
    }

    console.log('\n🎉 Demo completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set up your GEMINI_API_KEY environment variable');
    console.log('2. Integrate the AI service into your application');
    console.log('3. Add user interface for URL input');
    console.log('4. Implement file saving for generated gems');

  } catch (error: any) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
if (import.meta.main) {
  main().catch(console.error);
}
import { ContentType } from '../content-analyzer';
import { PromptTemplate, PromptContext } from './base-prompt';
import { YouTubePromptTemplate } from './youtube-prompt';
import { ArticlePromptTemplate } from './article-prompt';
import { PaperPromptTemplate } from './paper-prompt';
import { PodcastPromptTemplate } from './podcast-prompt';

export class PromptFactory {
  private static youtubeTemplate = new YouTubePromptTemplate();
  private static articleTemplate = new ArticlePromptTemplate();
  private static paperTemplate = new PaperPromptTemplate();
  private static podcastTemplate = new PodcastPromptTemplate();

  static getPrompt(contentType: ContentType, context: PromptContext): PromptTemplate {
    switch (contentType) {
      case 'youtube':
        return this.youtubeTemplate.getPrompt(context);
      case 'article':
        return this.articleTemplate.getPrompt(context);
      case 'paper':
        return this.paperTemplate.getPrompt(context);
      case 'podcast':
        return this.podcastTemplate.getPrompt(context);
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }
  }

  static getSupportedContentTypes(): ContentType[] {
    return ['youtube', 'article', 'paper', 'podcast'];
  }

  static validatePromptTemplate(template: PromptTemplate): boolean {
    return !!(template.systemInstruction && template.userPrompt && template.expectedFormat);
  }
}
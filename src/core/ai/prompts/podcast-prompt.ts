import { BasePromptTemplate, PromptTemplate, PromptContext } from './base-prompt';

export class PodcastPromptTemplate extends BasePromptTemplate {
  getPrompt(context: PromptContext): PromptTemplate {
    const systemInstruction = `${this.getBaseSystemInstruction()}

PODCAST-SPECIFIC ANALYSIS FOCUS:
1. **Guest Expertise**: Identify guest backgrounds, expertise, and unique perspectives
2. **Key Topics**: Extract main discussion themes and talking points
3. **Actionable Advice**: Capture practical tips and recommendations
4. **Stories & Examples**: Note compelling stories, case studies, or examples
5. **Industry Insights**: Extract trends, predictions, and industry knowledge
6. **Resources & Tools**: Identify mentioned books, tools, or resources
7. **Key Quotes**: Extract memorable quotes and soundbites

PODCAST FRONTMATTER FIELDS:
- title: Engaging title that captures the episode's value
- source: Original podcast URL
- type: "podcast"
- episode: Episode number (if available)
- duration: Episode duration (if available)
- processed: Timestamp of analysis
- tags: Topic-specific and format tags (interview, discussion, etc.)
- entities: Guests, companies, books, or resources mentioned
- insights: Key takeaways and expert perspectives

PODCAST ANALYSIS STRUCTURE:
# Episode Summary
[2-3 paragraph overview of the episode's main value and discussions]

## Key Topics Discussed
- [Main theme or topic]
- [Important subtopics covered]
- [Industry trends or insights]
- [Controversial or surprising points]

## Guest Expertise & Background
[Background of guests and their unique perspectives]

## Actionable Advice
- [Practical tips or strategies shared]
- [Specific recommendations]
- [Implementation steps]
- [Tools or methods mentioned]

## Compelling Stories & Examples
[Notable stories, case studies, or examples shared]

## Industry Insights & Trends
[Industry trends, predictions, or insider knowledge]

## Key Quotes
[Memorable quotes and insights from the conversation]

## Resources Mentioned
[Books, tools, websites, or other resources referenced]

## Takeaway Messages
[Final thoughts and key messages listeners should remember]`;

    const userPrompt = `${this.getBaseUserPrompt()}

ADDITIONAL PODCAST-SPECIFIC CONTEXT:
- Episode: {{episode}}
- Duration: {{duration}}
- Format: Audio conversation/interview

Focus particularly on:
1. What are the key topics and main discussion points?
2. What expertise or unique perspectives do the guests bring?
3. What actionable advice or practical tips are shared?
4. What compelling stories or examples are discussed?
5. What industry insights or trends are revealed?
6. What resources or tools are mentioned for listeners?`;

    const expectedFormat = `---
title: [Engaging title capturing episode value]
source: [Podcast URL]
type: podcast
episode: [Episode number if available]
duration: [Episode duration if available]
processed: [YYYY-MM-DD HH:MM:SS]
tags: [3-5 relevant tags]
entities: [guests, companies, resources mentioned]
insights: [3-4 key insights]
---

# Episode Summary
[2-3 paragraph overview of main value and discussions]

## Key Topics Discussed
- [Main theme or topic]
- [Important subtopics covered]
- [Industry trends or insights]
- [Surprising or controversial points]

## Guest Expertise & Background
[Guest backgrounds and unique perspectives]

## Actionable Advice
- [Practical tips and strategies]
- [Specific recommendations]
- [Implementation steps]
- [Tools or methods mentioned]

## Compelling Stories & Examples
[Notable stories or case studies shared]

## Industry Insights & Trends
[Industry trends and insider knowledge]

## Key Quotes
[Memorable quotes and insights]

## Resources Mentioned
[Books, tools, websites referenced]

## Takeaway Messages
[Final thoughts and key messages]`;

    return {
      systemInstruction,
      userPrompt: this.formatTemplate(userPrompt, {
        contentType: context.contentType,
        title: context.metadata.title || 'Podcast Episode',
        url: context.metadata.url || '',
        episode: context.metadata.episodeNumber || 'Unknown Episode',
        duration: context.metadata.duration || 'Unknown Duration',
        content: this.truncateContent(context.content, 8000),
        customInstructions: context.customInstructions || ''
      }),
      expectedFormat
    };
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...[content truncated for analysis]';
  }
}
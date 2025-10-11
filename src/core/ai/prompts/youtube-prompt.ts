import { BasePromptTemplate, PromptTemplate, PromptContext } from './base-prompt';

export class YouTubePromptTemplate extends BasePromptTemplate {
  getPrompt(context: PromptContext): PromptTemplate {
    const systemInstruction = `${this.getBaseSystemInstruction()}

YOUTUBE-SPECIFIC ANALYSIS FOCUS:
1. **Video Content Analysis**: Extract key concepts, demonstrations, and visual elements
2. **Educational Value**: Identify learning objectives and takeaways
4. **Technical Details**: Capture any demonstrations, tutorials, or technical explanations
5. **Speaker Insights**: Extract quotes, expertise, and unique perspectives
6. **Timestamp Insights**: Note key moments if timestamps are available
7. **Audience Engagement**: Identify actionable steps or call-to-actions

YOUTUBE FRONTMATTER FIELDS:
- title: Engaging title reflecting the video's main value
- source: Original video URL
- type: "youtube"
- channel: Channel name (if available)
- duration: Video duration
- processed: Timestamp of analysis
- tags: YouTube-specific tags (tutorial, review, educational, etc.)
- entities: People, brands, tools, or concepts mentioned
- insights: Key takeaways unique to this video

YOUTUBE ANALYSIS STRUCTURE:
# Summary
[2-3 paragraph overview focusing on the video's main value proposition]

## Key Points
- [Main concept or skill demonstrated]
- [Important technique or method shown]
- [Notable insight or revelation]
- [Practical applications or benefits]

## Technical Details
[For tutorials/reviews: Specific tools, settings, or techniques demonstrated]

## Demonstrations
[Key visual demonstrations or step-by-step processes shown]

## Speaker Insights
[Important quotes, expertise, or unique perspectives shared]

## Actionable Takeaways
[Specific steps viewers can take based on the video content]

## Resources Mentioned
[Any tools, links, or resources referenced in the video]`;

    const userPrompt = `${this.getBaseUserPrompt()}

ADDITIONAL YOUTUBE-SPECIFIC CONTEXT:
- Channel: {{channel}}
- Duration: {{duration}}
- Description: {{description}}

Focus particularly on:
1. What practical skills or knowledge can viewers gain?
2. What makes this video valuable or unique?
3. What specific demonstrations or examples are provided?
4. What are the most important quotes or insights from the speaker?`;

    const expectedFormat = `---
title: [Compelling, descriptive title]
source: [YouTube URL]
type: youtube
channel: [Channel name]
duration: [Video duration]
processed: [YYYY-MM-DD HH:MM:SS]
tags: [3-5 relevant tags]
entities: [people, brands, tools mentioned]
insights: [3-4 key insights]
---

# Summary
[2-3 paragraph overview]

## Key Points
- [Main concept with practical value]
- [Important technique or method]
- [Notable insight or revelation]
- [Practical applications]

## Technical Details
[Specific tools, settings, techniques demonstrated]

## Demonstrations
[Key visual demonstrations shown]

## Speaker Insights
[Important quotes and perspectives]

## Actionable Takeaways
[Specific steps viewers can implement]

## Resources Mentioned
[Tools, links, resources referenced]`;

    return {
      systemInstruction,
      userPrompt: this.formatTemplate(userPrompt, {
        contentType: context.contentType,
        title: context.metadata.title || 'YouTube Video',
        url: context.metadata.url || '',
        channel: context.metadata.channel || 'Unknown Channel',
        duration: context.metadata.duration || 'Unknown Duration',
        description: context.metadata.description || '',
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
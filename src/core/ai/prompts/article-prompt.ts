import { BasePromptTemplate, PromptTemplate, PromptContext } from './base-prompt';

export class ArticlePromptTemplate extends BasePromptTemplate {
  getPrompt(context: PromptContext): PromptTemplate {
    const systemInstruction = `${this.getBaseSystemInstruction()}

ARTICLE-SPECIFIC ANALYSIS FOCUS:
1. **Main Thesis**: Identify the core argument or central claim
2. **Key Evidence**: Extract supporting data, examples, and proof points
3. **Author's Perspective**: Capture the author's expertise, bias, and viewpoint
4. **Target Audience**: Identify who benefits most from this content
5. **Practical Applications**: Extract actionable advice and implementations
6. **Counterarguments**: Note alternative viewpoints or limitations mentioned
7. **Contextual Relevance**: Connect the content to broader trends or topics

ARTICLE FRONTMATTER FIELDS:
- title: Compelling headline that captures the article's essence
- source: Original article URL
- type: "article"
- author: Article author (if available)
- publishDate: Publication date (if available)
- processed: Timestamp of analysis
- tags: Topic and theme-specific tags
- entities: People, companies, or organizations mentioned
- insights: Key arguments and unique perspectives

ARTICLE ANALYSIS STRUCTURE:
# Summary
[2-3 paragraph overview of the article's main thesis and value]

## Key Arguments
- [Primary claim or thesis]
- [Major supporting points]
- [Evidence and data presented]
- [Conclusion or call to action]

## Author's Perspective
[Analysis of author's expertise, viewpoint, and potential biases]

## Supporting Evidence
[Key data, examples, or proof points mentioned]

## Practical Applications
[How readers can apply the article's insights]

## Broader Context
[How this article relates to industry trends or broader topics]

## Counterarguments & Limitations
[Alternative viewpoints or limitations acknowledged]

## Key Takeaways
[Actionable insights readers should remember]`;

    const userPrompt = `${this.getBaseUserPrompt()}

ADDITIONAL ARTICLE-SPECIFIC CONTEXT:
- Author: {{author}}
- Published: {{publishDate}}
- Source: {{source}}

Focus particularly on:
1. What is the author's main thesis or argument?
2. What evidence or data supports their claims?
3. What makes this article valuable or unique?
4. How can readers apply these insights in practice?
5. What broader implications or trends does this article address?`;

    const expectedFormat = `---
title: [Compelling, descriptive title]
source: [Article URL]
type: article
author: [Author name]
publishDate: [YYYY-MM-DD if available]
processed: [YYYY-MM-DD HH:MM:SS]
tags: [3-5 relevant tags]
entities: [people, companies, organizations mentioned]
insights: [3-4 key insights]
---

# Summary
[2-3 paragraph overview of main thesis and value]

## Key Arguments
- [Primary claim or thesis with supporting evidence]
- [Major supporting points and data]
- [Evidence and examples presented]
- [Conclusion or call to action]

## Author's Perspective
[Analysis of author's expertise and viewpoint]

## Supporting Evidence
[Key data, examples, or proof points]

## Practical Applications
[How readers can apply the insights]

## Broader Context
[Connection to industry trends or broader topics]

## Counterarguments & Limitations
[Alternative viewpoints or limitations]

## Key Takeaways
[Actionable insights to remember]`;

    return {
      systemInstruction,
      userPrompt: this.formatTemplate(userPrompt, {
        contentType: context.contentType,
        title: context.metadata.title || 'Article',
        url: context.metadata.url || '',
        author: context.metadata.author || 'Unknown Author',
        publishDate: context.metadata.publishDate?.toLocaleDateString() || 'Unknown Date',
        source: new URL(context.metadata.url || '').hostname,
        content: this.truncateContent(context.content, 10000),
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
import { BasePromptTemplate, PromptTemplate, PromptContext } from './base-prompt';

export class PaperPromptTemplate extends BasePromptTemplate {
  getPrompt(context: PromptContext): PromptTemplate {
    const systemInstruction = `${this.getBaseSystemInstruction()}

ACADEMIC PAPER-SPECIFIC ANALYSIS FOCUS:
1. **Research Question**: Identify the core research question or hypothesis
2. **Methodology**: Extract research methods, data collection, and analysis techniques
3. **Key Findings**: Summarize main results and statistical significance
4. **Theoretical Framework**: Identify theoretical foundations and conceptual models
5. **Contributions**: Highlight novel contributions to the field
6. **Limitations**: Note acknowledged limitations and areas for future research
7. **Practical Implications**: Extract real-world applications and implications

PAPER FRONTMATTER FIELDS:
- title: Academic title reflecting the research contribution
- source: Paper URL or DOI
- type: "paper"
- authors: Authors (if available)
- publishDate: Publication date (if available)
- processed: Timestamp of analysis
- tags: Academic field, methodology, and topic tags
- entities: Theories, models, institutions, and researchers mentioned
- insights: Key findings and methodological contributions

PAPER ANALYSIS STRUCTURE:
# Abstract Summary
[2-3 paragraph academic summary of research objectives and findings]

## Research Question & Hypothesis
[Clear statement of the research problem and hypotheses]

## Methodology
- [Research design and approach]
- [Data collection methods]
- [Analysis techniques and statistical methods]
- [Sample size and characteristics]

## Key Findings
- [Primary results and statistical significance]
- [Secondary findings and patterns]
- [Unexpected results or anomalies]
- [Effect sizes and confidence intervals]

## Theoretical Framework
[Underlying theories and conceptual models used]

## Contributions to Field
- [Novel theoretical contributions]
- [Methodological advancements]
- [Practical implications]
- [Future research directions]

## Limitations & Future Research
[Acknowledged limitations and suggested future work]

## Practical Implications
[Real-world applications and relevance]

## Critical Assessment
[Brief evaluation of research quality and significance]`;

    const userPrompt = `${this.getBaseUserPrompt()}

ADDITIONAL PAPER-SPECIFIC CONTEXT:
- Document Type: Academic Paper/Research Document
- Focus: Research methodology and findings

Focus particularly on:
1. What research question is being addressed?
2. What methodology was used and is it appropriate?
3. What are the key findings and their significance?
4. What theoretical contributions does this paper make?
5. What are the limitations and implications for future research?
6. How can these findings be applied in practice?`;

    const expectedFormat = `---
title: [Academic title reflecting research contribution]
source: [Paper URL or DOI]
type: paper
authors: [Authors if available]
publishDate: [YYYY-MM-DD if available]
processed: [YYYY-MM-DD HH:MM:SS]
tags: [academic field, methodology, topic tags]
entities: [theories, models, institutions mentioned]
insights: [key findings and methodological contributions]
---

# Abstract Summary
[2-3 paragraph academic summary]

## Research Question & Hypothesis
[Clear statement of research problem and hypotheses]

## Methodology
- [Research design and approach]
- [Data collection methods]
- [Analysis techniques]
- [Sample characteristics]

## Key Findings
- [Primary results with significance]
- [Secondary findings]
- [Effect sizes and confidence intervals]

## Theoretical Framework
[Underlying theories and models]

## Contributions to Field
- [Novel theoretical contributions]
- [Methodological advancements]
- [Practical implications]

## Limitations & Future Research
[Acknowledged limitations and future directions]

## Practical Implications
[Real-world applications and relevance]

## Critical Assessment
[Brief evaluation of research quality]`;

    return {
      systemInstruction,
      userPrompt: this.formatTemplate(userPrompt, {
        contentType: context.contentType,
        title: context.metadata.title || 'Research Paper',
        url: context.metadata.url || '',
        authors: context.metadata.author || 'Unknown Authors',
        publishDate: context.metadata.publishDate?.toLocaleDateString() || 'Unknown Date',
        content: this.truncateContent(context.content, 12000),
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
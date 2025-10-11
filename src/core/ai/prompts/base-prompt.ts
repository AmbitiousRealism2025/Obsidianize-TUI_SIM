import { ContentType } from '../content-analyzer';

export interface PromptTemplate {
  systemInstruction: string;
  userPrompt: string;
  expectedFormat: string;
}

export interface PromptContext {
  contentType: ContentType;
  content: string;
  metadata: any;
  customInstructions?: string;
}

export abstract class BasePromptTemplate {
  abstract getPrompt(context: PromptContext): PromptTemplate;

  protected getBaseSystemInstruction(): string {
    return `You are an expert content analyst and information curator. Your task is to analyze the provided content and extract the most valuable insights in a structured "Gemini Gem" format.

ANALYSIS PRINCIPLES:
1. **Accuracy**: Extract only information that is directly supported by the content
2. **Clarity**: Present insights in a clear, concise, and actionable manner
3. **Structure**: Follow the exact format specified in the template
4. **Value**: Focus on the most important takeaways and actionable insights
5. **Context**: Consider the content type and target audience

OUTPUT REQUIREMENTS:
- Use YAML frontmatter with the specified fields
- Generate a compelling, descriptive title
- Provide comprehensive yet concise summary
- Extract key actionable points
- Identify important entities and relationships
- Generate relevant tags for categorization
- Include insights that add value beyond basic summarization

STYLE GUIDELINES:
- Write in a professional but accessible tone
- Use bullet points for clarity and readability
- Include specific examples and quotes when relevant
- Maintain factual accuracy and avoid speculation
- Organize information hierarchically for easy scanning`;
  }

  protected getBaseUserPrompt(): string {
    return `Please analyze the following content and generate a comprehensive "Gemini Gem" analysis:

CONTENT TYPE: {{contentType}}
TITLE: {{title}}
SOURCE: {{url}}

CONTENT:
{{content}}

{{customInstructions}}

Please provide your analysis in the exact format specified in the system instructions.`;
  }

  protected formatTemplate(template: string, variables: Record<string, string>): string {
    let formatted = template;
    for (const [key, value] of Object.entries(variables)) {
      formatted = formatted.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return formatted;
  }
}
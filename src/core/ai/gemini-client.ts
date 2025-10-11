import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeout?: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface GenerationRequest {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerationResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  timestamp: Date;
}

export interface GeminiError {
  code: string;
  message: string;
  status: number;
  details?: any;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: GeminiConfig;
  private retryConfig: RetryConfig;

  constructor(config: GeminiConfig) {
    this.config = {
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxOutputTokens: 2048,
      timeout: 30000,
      ...config
    };

    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    };

    if (!config.apiKey) {
      throw new Error('API key is required for Gemini client initialization');
    }

    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: this.config.model!,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxOutputTokens,
      }
    });
  }

  async generateContent(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    let lastError: any;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`Gemini API attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}`);

        // Add timeout handling
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), this.config.timeout);
        });

        const generationPromise = this.model.generateContent(request.prompt);

        const result = await Promise.race([generationPromise, timeoutPromise]) as any;
        const response = result.response;
        const text = response.text();

        if (!text) {
          throw new Error('Empty response from Gemini API');
        }

        const duration = Date.now() - startTime;
        console.log(`Gemini API success in ${duration}ms`);

        return {
          text,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata?.totalTokenCount || 0,
          },
          model: this.config.model!,
          timestamp: new Date()
        };

      } catch (error: any) {
        lastError = this.processError(error);

        if (attempt === this.retryConfig.maxRetries) {
          console.error(`Gemini API failed after ${attempt + 1} attempts:`, lastError);
          throw lastError;
        }

        // Check if we should retry based on error type
        if (!this.shouldRetry(lastError)) {
          console.error('Gemini API error not retryable:', lastError);
          throw lastError;
        }

        const delay = this.calculateDelay(attempt);
        console.warn(`Gemini API attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  async generateContentStream(request: GenerationRequest): Promise<AsyncIterable<string>> {
    try {
      const result = await this.model.generateContentStream(request.prompt);

      return this.streamToAsyncIterable(result.stream);
    } catch (error: any) {
      throw this.processError(error);
    }
  }

  private async *streamToAsyncIterable(stream: any): AsyncIterable<string> {
    try {
      for await (const chunk of stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
    } catch (error: any) {
      throw this.processError(error);
    }
  }

  private processError(error: any): GeminiError {
    // Handle different types of errors
    if (error.status) {
      // HTTP errors
      return {
        code: `HTTP_${error.status}`,
        message: error.message || `HTTP ${error.status}`,
        status: error.status,
        details: error.details
      };
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return {
        code: 'RATE_LIMIT',
        message: 'Rate limit exceeded. Please try again later.',
        status: 429,
        details: error.message
      };
    }

    if (error.message?.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: 'Request timeout',
        status: 408,
        details: error.message
      };
    }

    if (error.message?.includes('content') || error.message?.includes('policy')) {
      return {
        code: 'CONTENT_POLICY',
        message: 'Content generation blocked by policy',
        status: 400,
        details: error.message
      };
    }

    if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      return {
        code: 'AUTHENTICATION',
        message: 'Authentication failed',
        status: 401,
        details: error.message
      };
    }

    // Default error handling
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      status: 500,
      details: error.stack
    };
  }

  private shouldRetry(error: GeminiError): boolean {
    // Retry on rate limits, timeouts, and server errors
    return (
      error.code === 'RATE_LIMIT' ||
      error.code === 'TIMEOUT' ||
      error.code === 'UNKNOWN_ERROR' ||
      (error.status >= 500 && error.status < 600) ||
      error.status === 429
    );
  }

  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
    return Math.min(delay + jitter, this.retryConfig.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Respond with "OK" only.');
      const response = result.response;
      return response.text().trim() === 'OK';
    } catch (error) {
      console.error('Gemini health check failed:', error);
      return false;
    }
  }

  // Get model info
  getModelInfo(): { model: string; temperature: number; maxOutputTokens: number } {
    return {
      model: this.config.model!,
      temperature: this.config.temperature!,
      maxOutputTokens: this.config.maxOutputTokens!
    };
  }
}

// Singleton instance for the application
let geminiClient: GeminiClient | null = null;

export function initializeGeminiClient(config: GeminiConfig): GeminiClient {
  if (geminiClient) {
    console.warn('Gemini client already initialized');
    return geminiClient;
  }

  geminiClient = new GeminiClient(config);
  return geminiClient;
}

export function getGeminiClient(): GeminiClient {
  if (!geminiClient) {
    throw new Error('Gemini client not initialized. Call initializeGeminiClient first.');
  }
  return geminiClient;
}
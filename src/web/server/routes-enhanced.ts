/**
 * Enhanced API Routes for Obsidianize Web TUI Interface
 * Phase 3: Advanced Features including batch processing, export formats, and dashboard
 *
 * Version: 2.0.0
 */

import { DataProcessor } from '../../core/processor.js';
import { URLValidator, ApiKeyValidator } from '../../core/validators/index.js';
import { createLogger } from '../../core/logging/index.js';
import { getErrorMessage, getErrorCode } from '../../core/errors/index.js';
import { HTTP_STATUS, TIME, SIZE } from '../../core/constants/index.js';
import { getConfig, isProduction } from '../../core/config/index.js';
import {
  createRequestContext,
  withRequestContext,
  generateRequestId
} from '../../core/request-context/index.js';
import type {
  ProcessingRequest,
  ProcessingResult,
  ProcessingOptions,
  AuthConfig,
  GeminiGem,
  ProcessingStatus,
  OutputFormat
} from '../../core/types/index.js';
import { AnalysisMode as AnalysisModeEnum, OutputFormat as OutputFormatEnum } from '../../core/types/index.js';
import { MarkdownFormatter } from '../../core/formatters/index.js';
import YAML from 'yaml';

const logger = createLogger('routes-enhanced');

// ============================================================================
// TYPES
// ============================================================================

/** Summarization level */
export type SummarizationLevel = 'brief' | 'standard' | 'detailed' | 'comprehensive';

/** Batch job status */
interface BatchJobStatus {
  id: string;
  status: ProcessingStatus;
  totalUrls: number;
  completedUrls: number;
  failedUrls: number;
  progress: number;
  message: string;
  results: Map<string, JobStatus>;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

/** Job status tracking */
interface JobStatus {
  id: string;
  status: ProcessingStatus;
  progress: number;
  message: string;
  result?: ProcessingResult;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
  url?: string;
}

/** Export request options */
interface ExportOptions {
  format: 'markdown' | 'json' | 'yaml';
  summarizationLevel?: SummarizationLevel;
  includeMetadata?: boolean;
  prettify?: boolean;
}

/** Batch processing request */
interface BatchRequest {
  urls: string[];
  apiKey: string;
  options?: {
    analysisMode?: string;
    summarizationLevel?: SummarizationLevel;
    outputFormat?: string;
    includeTimestamps?: boolean;
    includeTranscript?: boolean;
    extractEntities?: boolean;
    maxConcurrent?: number;
    customPrompts?: Record<string, string>;
  };
}

// ============================================================================
// JOB STORAGE
// ============================================================================

/** In-memory job storage */
const jobs = new Map<string, JobStatus>();
const batchJobs = new Map<string, BatchJobStatus>();

/** Generate unique job ID */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Clean up old jobs (older than 1 hour) */
function cleanupOldJobs(): void {
  const oneHourAgo = Date.now() - TIME.HOUR;

  for (const [id, job] of jobs.entries()) {
    if (job.createdAt.getTime() < oneHourAgo) {
      jobs.delete(id);
      logger.debug(`Cleaned up old job: ${id}`);
    }
  }

  for (const [id, batchJob] of batchJobs.entries()) {
    if (batchJob.createdAt.getTime() < oneHourAgo) {
      batchJobs.delete(id);
      logger.debug(`Cleaned up old batch job: ${id}`);
    }
  }
}

// Clean up old jobs every 10 minutes
setInterval(cleanupOldJobs, 10 * TIME.MINUTE);

// ============================================================================
// SUMMARIZATION MAPPING
// ============================================================================

const summarizationMapping: Record<SummarizationLevel, {
  analysisMode: typeof AnalysisModeEnum[keyof typeof AnalysisModeEnum];
  maxKeyPoints: number;
  summaryLength: 'short' | 'medium' | 'long';
}> = {
  brief: {
    analysisMode: AnalysisModeEnum.STANDARD,
    maxKeyPoints: 3,
    summaryLength: 'short'
  },
  standard: {
    analysisMode: AnalysisModeEnum.STANDARD,
    maxKeyPoints: 5,
    summaryLength: 'medium'
  },
  detailed: {
    analysisMode: AnalysisModeEnum.ENHANCED,
    maxKeyPoints: 10,
    summaryLength: 'long'
  },
  comprehensive: {
    analysisMode: AnalysisModeEnum.ACADEMIC,
    maxKeyPoints: 20,
    summaryLength: 'long'
  }
};

// ============================================================================
// FORMAT CONVERTERS
// ============================================================================

/**
 * Convert GeminiGem to JSON format
 */
function convertToJson(gem: GeminiGem, options: ExportOptions): string {
  const data: Record<string, unknown> = {
    frontmatter: {
      ...gem.frontmatter,
      processed: gem.frontmatter.processed.toISOString()
    },
    content: gem.content
  };

  if (options.includeMetadata !== false) {
    data.exportedAt = new Date().toISOString();
    data.format = 'json';
    data.version = '1.0.0';
  }

  return options.prettify !== false ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

/**
 * Convert GeminiGem to YAML format
 */
function convertToYaml(gem: GeminiGem, options: ExportOptions): string {
  const data: Record<string, unknown> = {
    frontmatter: {
      ...gem.frontmatter,
      processed: gem.frontmatter.processed.toISOString()
    },
    content: gem.content
  };

  if (options.includeMetadata !== false) {
    data.exportedAt = new Date().toISOString();
    data.format = 'yaml';
    data.version = '1.0.0';
  }

  return YAML.stringify(data);
}

/**
 * Get content type and filename extension for format
 */
function getFormatInfo(format: string): { contentType: string; extension: string } {
  switch (format) {
    case 'json':
      return { contentType: 'application/json; charset=utf-8', extension: '.json' };
    case 'yaml':
      return { contentType: 'text/yaml; charset=utf-8', extension: '.yaml' };
    default:
      return { contentType: 'text/markdown; charset=utf-8', extension: '.md' };
  }
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * POST /api/batch
 * Start batch content processing
 */
export async function handleBatchRequest(req: Request): Promise<Response> {
  const context = createRequestContext(req);

  return withRequestContext(context, async () => {
    try {
      const config = getConfig();

      // Check if batch processing is enabled
      if (!config.batch.enabled) {
        return new Response(
          JSON.stringify({
            error: 'Batch processing is disabled',
            code: 'BATCH_DISABLED'
          }),
          {
            status: HTTP_STATUS.FORBIDDEN,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Parse request body
      const body = await req.json() as BatchRequest;
      const { urls, apiKey, options = {} } = body;

      // Validate required fields
      if (!Array.isArray(urls) || urls.length === 0) {
        return new Response(
          JSON.stringify({
            error: 'URLs array is required and must not be empty',
            code: 'INVALID_INPUT'
          }),
          {
            status: HTTP_STATUS.BAD_REQUEST,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (urls.length > config.batch.maxUrls) {
        return new Response(
          JSON.stringify({
            error: `Maximum ${config.batch.maxUrls} URLs allowed per batch`,
            code: 'BATCH_LIMIT_EXCEEDED',
            maxUrls: config.batch.maxUrls,
            provided: urls.length
          }),
          {
            status: HTTP_STATUS.BAD_REQUEST,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (!apiKey || typeof apiKey !== 'string') {
        return new Response(
          JSON.stringify({
            error: 'API key is required',
            code: 'INVALID_API_KEY'
          }),
          {
            status: HTTP_STATUS.BAD_REQUEST,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Validate API key format
      const apiKeyValidation = ApiKeyValidator.validateGeminiKey(apiKey);
      if (!apiKeyValidation.valid) {
        return new Response(
          JSON.stringify({
            error: apiKeyValidation.error || 'Invalid API key',
            code: 'INVALID_API_KEY'
          }),
          {
            status: HTTP_STATUS.BAD_REQUEST,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Validate all URLs
      const urlErrors: { url: string; error: string }[] = [];
      for (const url of urls) {
        const validation = URLValidator.validateAndClassify(url);
        if (!validation.valid) {
          urlErrors.push({ url, error: validation.error || 'Invalid URL' });
        }
      }

      if (urlErrors.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'Some URLs are invalid',
            code: 'INVALID_URLS',
            invalidUrls: urlErrors
          }),
          {
            status: HTTP_STATUS.BAD_REQUEST,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Create batch job
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const batchJob: BatchJobStatus = {
        id: batchId,
        status: 'pending' as ProcessingStatus,
        totalUrls: urls.length,
        completedUrls: 0,
        failedUrls: 0,
        progress: 0,
        message: 'Batch job created, starting processing...',
        results: new Map(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      batchJobs.set(batchId, batchJob);

      logger.info(`Created batch job: ${batchId}`, {
        requestId: context.id,
        totalUrls: urls.length,
        maxConcurrent: options.maxConcurrent || config.batch.maxConcurrent
      });

      // Start batch processing asynchronously
      processBatch(batchId, urls, apiKey, options, config.batch.maxConcurrent).catch((error) => {
        logger.error(`Batch processing failed for ${batchId}`, error);
        const job = batchJobs.get(batchId);
        if (job) {
          job.status = 'failed' as ProcessingStatus;
          job.error = getErrorMessage(error);
          job.updatedAt = new Date();
        }
      });

      // Return batch ID immediately
      return new Response(
        JSON.stringify({
          batchId,
          status: 'pending',
          message: 'Batch processing started',
          totalUrls: urls.length,
          statusUrl: `/api/batch/${batchId}/status`,
          resultsUrl: `/api/batch/${batchId}/results`
        }),
        {
          status: HTTP_STATUS.CREATED,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error('Batch request error', error);
      return new Response(
        JSON.stringify({
          error: getErrorMessage(error),
          code: getErrorCode(error)
        }),
        {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  });
}

/**
 * Background batch processing function
 */
async function processBatch(
  batchId: string,
  urls: string[],
  apiKey: string,
  userOptions: BatchRequest['options'],
  maxConcurrent: number
): Promise<void> {
  const batchJob = batchJobs.get(batchId);
  if (!batchJob) {
    logger.error(`Batch job not found: ${batchId}`);
    return;
  }

  try {
    batchJob.status = 'processing' as ProcessingStatus;
    batchJob.message = 'Processing URLs...';
    batchJob.updatedAt = new Date();

    // Get summarization settings
    const summarization = userOptions?.summarizationLevel
      ? summarizationMapping[userOptions.summarizationLevel]
      : summarizationMapping.standard;

    // Process URLs with concurrency limit
    const concurrent = Math.min(maxConcurrent, userOptions?.maxConcurrent || maxConcurrent);
    const chunks: string[][] = [];

    for (let i = 0; i < urls.length; i += concurrent) {
      chunks.push(urls.slice(i, i + concurrent));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (url, index) => {
        const jobId = `${batchId}_${batchJob.results.size + index}`;
        const job: JobStatus = {
          id: jobId,
          status: 'processing' as ProcessingStatus,
          progress: 0,
          message: 'Processing...',
          url,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        batchJob.results.set(url, job);
        jobs.set(jobId, job);

        try {
          const processor = new DataProcessor();

          const processingOptions: ProcessingOptions = {
            analysisMode: summarization.analysisMode,
            includeTimestamps: userOptions?.includeTimestamps !== false,
            includeTranscript: userOptions?.includeTranscript !== false,
            customPrompts: userOptions?.customPrompts || undefined,
            outputFormat: (userOptions?.outputFormat as OutputFormat) || OutputFormatEnum.MARKDOWN,
            extractEntities: userOptions?.extractEntities !== false,
            timeoutMs: 120000,
            language: 'en'
          };

          const authConfig: AuthConfig = {
            apiKey,
            encrypted: false,
            source: 'user'
          };

          const request: ProcessingRequest = {
            input: url,
            options: processingOptions,
            auth: authConfig
          };

          const result = await processor.processRequest(request);

          job.result = result;
          job.status = result.success ? ('completed' as ProcessingStatus) : ('failed' as ProcessingStatus);
          job.progress = 100;
          job.message = result.success ? 'Completed' : 'Failed';
          job.error = result.error?.message;
          job.updatedAt = new Date();

          if (result.success) {
            batchJob.completedUrls++;
          } else {
            batchJob.failedUrls++;
          }
        } catch (error) {
          job.status = 'failed' as ProcessingStatus;
          job.error = getErrorMessage(error);
          job.progress = 0;
          job.message = 'Failed';
          job.updatedAt = new Date();
          batchJob.failedUrls++;
        }
      });

      await Promise.all(promises);

      // Update batch progress
      const completed = batchJob.completedUrls + batchJob.failedUrls;
      batchJob.progress = Math.round((completed / batchJob.totalUrls) * 100);
      batchJob.message = `Processed ${completed}/${batchJob.totalUrls} URLs`;
      batchJob.updatedAt = new Date();
    }

    // Mark batch as complete
    batchJob.status = batchJob.failedUrls === batchJob.totalUrls
      ? ('failed' as ProcessingStatus)
      : ('completed' as ProcessingStatus);
    batchJob.progress = 100;
    batchJob.message = `Completed: ${batchJob.completedUrls} successful, ${batchJob.failedUrls} failed`;
    batchJob.updatedAt = new Date();

    logger.info(`Batch job completed: ${batchId}`, {
      total: batchJob.totalUrls,
      completed: batchJob.completedUrls,
      failed: batchJob.failedUrls
    });
  } catch (error) {
    logger.error(`Batch processing error: ${batchId}`, error);
    batchJob.status = 'failed' as ProcessingStatus;
    batchJob.error = getErrorMessage(error);
    batchJob.updatedAt = new Date();
  }
}

/**
 * GET /api/batch/:id/status
 * Get batch job status
 */
export async function handleBatchStatusRequest(req: Request, batchId: string): Promise<Response> {
  try {
    const batchJob = batchJobs.get(batchId);

    if (!batchJob) {
      return new Response(
        JSON.stringify({
          error: 'Batch job not found',
          code: 'BATCH_NOT_FOUND'
        }),
        {
          status: HTTP_STATUS.NOT_FOUND,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const response = {
      batchId: batchJob.id,
      status: batchJob.status,
      totalUrls: batchJob.totalUrls,
      completedUrls: batchJob.completedUrls,
      failedUrls: batchJob.failedUrls,
      progress: batchJob.progress,
      message: batchJob.message,
      createdAt: batchJob.createdAt.toISOString(),
      updatedAt: batchJob.updatedAt.toISOString(),
      error: batchJob.error
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: HTTP_STATUS.OK,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Batch status request error', error);
    return new Response(
      JSON.stringify({
        error: getErrorMessage(error),
        code: getErrorCode(error)
      }),
      {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * GET /api/batch/:id/results
 * Get batch job results
 */
export async function handleBatchResultsRequest(req: Request, batchId: string): Promise<Response> {
  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'json';

    const batchJob = batchJobs.get(batchId);

    if (!batchJob) {
      return new Response(
        JSON.stringify({
          error: 'Batch job not found',
          code: 'BATCH_NOT_FOUND'
        }),
        {
          status: HTTP_STATUS.NOT_FOUND,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (batchJob.status !== 'completed' && batchJob.status !== 'failed') {
      return new Response(
        JSON.stringify({
          error: 'Batch job not completed yet',
          code: 'BATCH_NOT_READY',
          status: batchJob.status,
          progress: batchJob.progress
        }),
        {
          status: HTTP_STATUS.BAD_REQUEST,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Build results
    const results: Record<string, {
      status: string;
      data?: unknown;
      error?: string;
    }> = {};

    for (const [urlKey, job] of batchJob.results.entries()) {
      if (job.result?.success && job.result.data) {
        const exportOptions: ExportOptions = {
          format: format as 'markdown' | 'json' | 'yaml',
          prettify: true,
          includeMetadata: true
        };

        let formattedData: string;
        if (format === 'yaml') {
          formattedData = convertToYaml(job.result.data, exportOptions);
        } else if (format === 'json') {
          formattedData = convertToJson(job.result.data, exportOptions);
        } else {
          const formatter = new MarkdownFormatter();
          formattedData = await formatter.format(job.result.data);
        }

        results[urlKey] = {
          status: 'success',
          data: format === 'json' ? JSON.parse(formattedData) : formattedData
        };
      } else {
        results[urlKey] = {
          status: 'failed',
          error: job.error || 'Processing failed'
        };
      }
    }

    const response = {
      batchId: batchJob.id,
      status: batchJob.status,
      summary: {
        total: batchJob.totalUrls,
        completed: batchJob.completedUrls,
        failed: batchJob.failedUrls
      },
      results
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: HTTP_STATUS.OK,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Batch results request error', error);
    return new Response(
      JSON.stringify({
        error: getErrorMessage(error),
        code: getErrorCode(error)
      }),
      {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// ============================================================================
// ENHANCED HEALTH DASHBOARD
// ============================================================================

/** System metrics history */
const metricsHistory: {
  timestamp: number;
  memory: { heapUsed: number; heapTotal: number; rss: number };
  jobs: { pending: number; processing: number; completed: number; failed: number };
}[] = [];

// Collect metrics every 30 seconds
setInterval(() => {
  const memory = process.memoryUsage();
  metricsHistory.push({
    timestamp: Date.now(),
    memory: {
      heapUsed: Math.round(memory.heapUsed / SIZE.MB),
      heapTotal: Math.round(memory.heapTotal / SIZE.MB),
      rss: Math.round(memory.rss / SIZE.MB)
    },
    jobs: {
      pending: Array.from(jobs.values()).filter((j) => j.status === 'pending').length,
      processing: Array.from(jobs.values()).filter((j) => j.status === 'processing').length,
      completed: Array.from(jobs.values()).filter((j) => j.status === 'completed').length,
      failed: Array.from(jobs.values()).filter((j) => j.status === 'failed').length
    }
  });

  // Keep only last hour of metrics
  const oneHourAgo = Date.now() - TIME.HOUR;
  while (metricsHistory.length > 0 && metricsHistory[0].timestamp < oneHourAgo) {
    metricsHistory.shift();
  }
}, 30000);

/**
 * GET /api/dashboard
 * Enhanced health dashboard with metrics
 */
export async function handleDashboardRequest(req: Request): Promise<Response> {
  try {
    const config = getConfig();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Calculate job statistics
    const allJobs = Array.from(jobs.values());
    const jobStats = {
      total: jobs.size,
      pending: allJobs.filter((j) => j.status === 'pending').length,
      processing: allJobs.filter((j) => j.status === 'processing').length,
      completed: allJobs.filter((j) => j.status === 'completed').length,
      failed: allJobs.filter((j) => j.status === 'failed').length
    };

    // Calculate batch statistics
    const allBatchJobs = Array.from(batchJobs.values());
    const batchStats = {
      total: batchJobs.size,
      pending: allBatchJobs.filter((j) => j.status === 'pending').length,
      processing: allBatchJobs.filter((j) => j.status === 'processing').length,
      completed: allBatchJobs.filter((j) => j.status === 'completed').length,
      failed: allBatchJobs.filter((j) => j.status === 'failed').length
    };

    // Calculate success rate
    const completedJobs = allJobs.filter((j) => j.status === 'completed' || j.status === 'failed');
    const successRate = completedJobs.length > 0
      ? (allJobs.filter((j) => j.status === 'completed').length / completedJobs.length) * 100
      : 100;

    // Get recent metrics for sparkline data
    const recentMetrics = metricsHistory.slice(-20);

    const dashboard = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.environment,
      version: config.version,

      server: {
        uptime: Math.floor(uptime),
        uptimeFormatted: formatUptime(uptime),
        port: config.server.port,
        host: config.server.host
      },

      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / SIZE.MB),
        heapTotal: Math.round(memoryUsage.heapTotal / SIZE.MB),
        rss: Math.round(memoryUsage.rss / SIZE.MB),
        external: Math.round((memoryUsage.external || 0) / SIZE.MB),
        memoryThreshold: Math.round(config.performance.memoryThreshold / SIZE.MB),
        heapUsedPercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        history: recentMetrics.map(m => m.memory.heapUsed)
      },

      jobs: {
        ...jobStats,
        successRate: Math.round(successRate * 100) / 100,
        history: recentMetrics.map(m => m.jobs)
      },

      batch: batchStats,

      config: {
        cacheEnabled: config.cache.enabled,
        rateLimitEnabled: config.rateLimit.enabled,
        batchEnabled: config.batch.enabled,
        pwaEnabled: config.pwa.enabled,
        metricsEnabled: config.performance.enableMetrics,
        profilingEnabled: config.performance.enableProfiling
      },

      features: {
        batch: {
          enabled: config.batch.enabled,
          maxUrls: config.batch.maxUrls,
          maxConcurrent: config.batch.maxConcurrent
        },
        ai: {
          model: config.ai.model,
          maxTokens: config.ai.maxTokens,
          timeout: config.ai.timeout
        },
        rateLimit: {
          enabled: config.rateLimit.enabled,
          maxRequests: config.rateLimit.maxRequests,
          windowMs: config.rateLimit.windowMs
        }
      },

      endpoints: {
        health: '/api/health',
        dashboard: '/api/dashboard',
        process: '/api/process',
        status: '/api/status/:id',
        download: '/api/download/:id',
        export: '/api/export/:id',
        batch: '/api/batch',
        batchStatus: '/api/batch/:id/status',
        batchResults: '/api/batch/:id/results',
        prompts: '/api/prompts'
      }
    };

    return new Response(JSON.stringify(dashboard, null, 2), {
      status: HTTP_STATUS.OK,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Dashboard request error', error);
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: getErrorMessage(error)
      }),
      {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

// ============================================================================
// EXPORT FORMAT ENDPOINT
// ============================================================================

/**
 * GET /api/export/:id
 * Download processed content in specified format
 */
export async function handleExportRequest(req: Request, jobId: string): Promise<Response> {
  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'markdown';
    const prettify = url.searchParams.get('prettify') !== 'false';
    const includeMetadata = url.searchParams.get('metadata') !== 'false';

    const job = jobs.get(jobId);

    if (!job) {
      return new Response(
        JSON.stringify({
          error: 'Job not found',
          code: 'JOB_NOT_FOUND'
        }),
        {
          status: HTTP_STATUS.NOT_FOUND,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (job.status !== 'completed') {
      return new Response(
        JSON.stringify({
          error: 'Job not completed yet',
          code: 'JOB_NOT_READY',
          status: job.status,
          progress: job.progress
        }),
        {
          status: HTTP_STATUS.BAD_REQUEST,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!job.result || !job.result.success || !job.result.data) {
      return new Response(
        JSON.stringify({
          error: job.error || 'Processing failed',
          code: 'PROCESSING_FAILED'
        }),
        {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const exportOptions: ExportOptions = {
      format: format as 'markdown' | 'json' | 'yaml',
      prettify,
      includeMetadata
    };

    let output: string;
    const formatInfo = getFormatInfo(format);

    switch (format) {
      case 'json':
        output = convertToJson(job.result.data, exportOptions);
        break;
      case 'yaml':
        output = convertToYaml(job.result.data, exportOptions);
        break;
      default:
        const formatter = new MarkdownFormatter();
        output = await formatter.format(job.result.data);
    }

    // Generate filename
    const title = job.result.data.frontmatter.title
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 50);
    const filename = `${title}_${jobId}${formatInfo.extension}`;

    return new Response(output, {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': formatInfo.contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Job-Id': jobId,
        'X-Export-Format': format,
        'X-Processing-Duration': job.result.metadata.duration.toString()
      }
    });
  } catch (error) {
    logger.error('Export request error', error);
    return new Response(
      JSON.stringify({
        error: getErrorMessage(error),
        code: getErrorCode(error)
      }),
      {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// ============================================================================
// CUSTOM PROMPTS ENDPOINT
// ============================================================================

/** Default prompt templates */
const defaultPrompts: Record<string, string> = {
  summary: 'Provide a comprehensive summary of the content, highlighting the main themes and key information.',
  keyPoints: 'Extract the most important key points and takeaways from the content.',
  analysis: 'Provide an in-depth analysis of the content, including context, implications, and insights.',
  entities: 'Identify and extract key entities (people, organizations, concepts, technologies) mentioned.',
  tags: 'Generate relevant tags for categorizing this content.'
};

/**
 * GET /api/prompts
 * Get available prompt templates
 */
export async function handlePromptsGetRequest(req: Request): Promise<Response> {
  try {
    return new Response(
      JSON.stringify({
        prompts: defaultPrompts,
        usage: {
          description: 'Use these prompt keys in your processing request to customize AI behavior',
          example: {
            customPrompts: {
              summary: 'Your custom summary prompt...',
              keyPoints: 'Your custom key points prompt...'
            }
          }
        }
      }, null, 2),
      {
        status: HTTP_STATUS.OK,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('Prompts get request error', error);
    return new Response(
      JSON.stringify({
        error: getErrorMessage(error),
        code: getErrorCode(error)
      }),
      {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// ============================================================================
// ENHANCED ROUTE MATCHER
// ============================================================================

/**
 * Enhanced route matcher including new endpoints
 */
export async function handleEnhancedApiRequest(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // POST /api/batch
  if (method === 'POST' && path === '/api/batch') {
    return handleBatchRequest(req);
  }

  // GET /api/batch/:id/status
  const batchStatusMatch = path.match(/^\/api\/batch\/([a-zA-Z0-9_]+)\/status$/);
  if (method === 'GET' && batchStatusMatch) {
    return handleBatchStatusRequest(req, batchStatusMatch[1]);
  }

  // GET /api/batch/:id/results
  const batchResultsMatch = path.match(/^\/api\/batch\/([a-zA-Z0-9_]+)\/results$/);
  if (method === 'GET' && batchResultsMatch) {
    return handleBatchResultsRequest(req, batchResultsMatch[1]);
  }

  // GET /api/dashboard
  if (method === 'GET' && path === '/api/dashboard') {
    return handleDashboardRequest(req);
  }

  // GET /api/export/:id
  const exportMatch = path.match(/^\/api\/export\/([a-zA-Z0-9_]+)$/);
  if (method === 'GET' && exportMatch) {
    return handleExportRequest(req, exportMatch[1]);
  }

  // GET /api/prompts
  if (method === 'GET' && path === '/api/prompts') {
    return handlePromptsGetRequest(req);
  }

  // No matching enhanced route
  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  jobs,
  batchJobs,
  generateJobId,
  cleanupOldJobs,
  convertToJson,
  convertToYaml,
  getFormatInfo,
  summarizationMapping,
  defaultPrompts,
  metricsHistory
};

/**
 * API Routes for Obsidianize Web TUI Interface
 * Handles content processing, status tracking, and downloads
 *
 * Version: 1.0.0
 */

import { DataProcessor } from '../../core/processor.js';
import { URLValidator, ApiKeyValidator } from '../../core/validators/index.js';
import { createLogger } from '../../core/logging/index.js';
import {
  ValidationError,
  NetworkError,
  createError,
  getErrorMessage,
  getErrorCode
} from '../../core/errors/index.js';
import { HTTP_STATUS } from '../../core/constants/index.js';
import type {
  ProcessingRequest,
  ProcessingResult,
  ProcessingOptions,
  AuthConfig,
  AnalysisMode,
  OutputFormat,
  GeminiGem,
  ProcessingStatus
} from '../../core/types/index.js';
import { AnalysisMode as AnalysisModeEnum, OutputFormat as OutputFormatEnum } from '../../core/types/index.js';
import { MarkdownFormatter } from '../../core/formatters/index.js';

const logger = createLogger('routes');

// ============================================================================
// JOB MANAGEMENT
// ============================================================================

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
}

/** In-memory job storage (would use Redis/DB in production) */
const jobs = new Map<string, JobStatus>();

/** Generate unique job ID */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Clean up old jobs (older than 1 hour) */
function cleanupOldJobs(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt.getTime() < oneHourAgo) {
      jobs.delete(id);
      logger.debug(`Cleaned up old job: ${id}`);
    }
  }
}

// Clean up old jobs every 10 minutes
setInterval(cleanupOldJobs, 10 * 60 * 1000);

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/process
 * Start content processing
 */
export async function handleProcessRequest(req: Request): Promise<Response> {
  try {
    // Parse request body
    const body = await req.json() as { url?: string; apiKey?: string; options?: any };
    const { url, apiKey, options = {} } = body;

    // Validate required fields
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'URL is required',
          code: 'INVALID_INPUT'
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

    // Validate URL
    const urlValidation = URLValidator.validateAndClassify(url);
    if (!urlValidation.valid) {
      return new Response(
        JSON.stringify({
          error: urlValidation.error || 'Invalid URL',
          code: 'INVALID_URL'
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

    // Create job
    const jobId = generateJobId();
    const job: JobStatus = {
      id: jobId,
      status: 'pending' as ProcessingStatus,
      progress: 0,
      message: 'Job created, starting processing...',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    jobs.set(jobId, job);

    logger.info(`Created processing job: ${jobId}`, {
      url,
      contentType: urlValidation.type
    });

    // Start processing asynchronously
    processContent(jobId, url, apiKey, options).catch((error) => {
      logger.error(`Background processing failed for job ${jobId}`, error);
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'failed' as ProcessingStatus;
        job.error = getErrorMessage(error);
        job.updatedAt = new Date();
      }
    });

    // Return job ID immediately
    return new Response(
      JSON.stringify({
        jobId,
        status: 'pending',
        message: 'Processing started',
        statusUrl: `/api/status/${jobId}`,
        downloadUrl: `/api/download/${jobId}`
      }),
      {
        status: HTTP_STATUS.CREATED,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('Process request error', error);
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
 * Background processing function
 */
async function processContent(
  jobId: string,
  url: string,
  apiKey: string,
  userOptions: any
): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) {
    logger.error(`Job not found: ${jobId}`);
    return;
  }

  try {
    // Update job status
    job.status = 'processing' as ProcessingStatus;
    job.progress = 10;
    job.message = 'Initializing processor...';
    job.updatedAt = new Date();

    // Create processor
    const processor = new DataProcessor();

    // Build processing options
    const processingOptions: ProcessingOptions = {
      analysisMode: userOptions.analysisMode || AnalysisModeEnum.STANDARD,
      includeTimestamps: userOptions.includeTimestamps !== false,
      includeTranscript: userOptions.includeTranscript !== false,
      customPrompts: userOptions.customPrompts || undefined,
      outputFormat: userOptions.outputFormat || OutputFormatEnum.MARKDOWN,
      tagOverrides: userOptions.tagOverrides || undefined,
      extractEntities: userOptions.extractEntities !== false,
      timeoutMs: userOptions.timeoutMs || 120000,
      language: userOptions.language || 'en'
    };

    // Build auth config
    const authConfig: AuthConfig = {
      apiKey,
      encrypted: false,
      source: 'user'
    };

    // Build processing request
    const request: ProcessingRequest = {
      input: url,
      options: processingOptions,
      auth: authConfig
    };

    // Update progress
    job.progress = 20;
    job.message = 'Processing content...';
    job.updatedAt = new Date();

    // Process the content
    const result = await processor.processRequest(request);

    // Update progress
    job.progress = 90;
    job.message = 'Finalizing...';
    job.updatedAt = new Date();

    // Store result
    job.result = result;
    job.status = result.success ? ('completed' as ProcessingStatus) : ('failed' as ProcessingStatus);
    job.progress = 100;
    job.message = result.success ? 'Processing completed' : 'Processing failed';
    job.error = result.error ? result.error.message : undefined;
    job.updatedAt = new Date();

    logger.info(`Job completed: ${jobId}`, {
      success: result.success,
      duration: result.metadata.duration
    });
  } catch (error) {
    logger.error(`Job processing failed: ${jobId}`, error);
    job.status = 'failed' as ProcessingStatus;
    job.error = getErrorMessage(error);
    job.progress = 0;
    job.message = 'Processing failed';
    job.updatedAt = new Date();
  }
}

/**
 * GET /api/status/:id
 * Get job status
 */
export async function handleStatusRequest(req: Request, jobId: string): Promise<Response> {
  try {
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

    const response: any = {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      message: job.message,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString()
    };

    if (job.error) {
      response.error = job.error;
    }

    if (job.result && job.status === 'completed') {
      response.downloadUrl = `/api/download/${jobId}`;
      response.metadata = {
        duration: job.result.metadata.duration,
        contentType: job.result.metadata.contentType,
        tokensUsed: job.result.metadata.tokensUsed
      };
    }

    return new Response(JSON.stringify(response), {
      status: HTTP_STATUS.OK,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Status request error', error);
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
 * GET /api/download/:id
 * Download processed content
 */
export async function handleDownloadRequest(req: Request, jobId: string): Promise<Response> {
  try {
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

    // Format as markdown
    const formatter = new MarkdownFormatter();
    const markdown = await formatter.format(job.result.data);

    // Generate filename from title
    const title = job.result.data.frontmatter.title
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 50);
    const filename = `${title}_${jobId}.md`;

    // Return markdown file
    return new Response(markdown, {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Job-Id': jobId,
        'X-Processing-Duration': job.result.metadata.duration.toString()
      }
    });
  } catch (error) {
    logger.error('Download request error', error);
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
 * GET /api/health
 * Health check endpoint
 */
export async function handleHealthRequest(req: Request): Promise<Response> {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      version: '1.0.0',
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
      },
      jobs: {
        total: jobs.size,
        pending: Array.from(jobs.values()).filter((j) => j.status === 'pending').length,
        processing: Array.from(jobs.values()).filter((j) => j.status === 'processing').length,
        completed: Array.from(jobs.values()).filter((j) => j.status === 'completed').length,
        failed: Array.from(jobs.values()).filter((j) => j.status === 'failed').length
      }
    };

    return new Response(JSON.stringify(health, null, 2), {
      status: HTTP_STATUS.OK,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Health check error', error);
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
 * Route matcher and dispatcher
 */
export async function handleApiRequest(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // POST /api/process
  if (method === 'POST' && path === '/api/process') {
    return handleProcessRequest(req);
  }

  // GET /api/status/:id
  const statusMatch = path.match(/^\/api\/status\/([a-zA-Z0-9_]+)$/);
  if (method === 'GET' && statusMatch) {
    return handleStatusRequest(req, statusMatch[1]);
  }

  // GET /api/download/:id
  const downloadMatch = path.match(/^\/api\/download\/([a-zA-Z0-9_]+)$/);
  if (method === 'GET' && downloadMatch) {
    return handleDownloadRequest(req, downloadMatch[1]);
  }

  // GET /api/health
  if (method === 'GET' && path === '/api/health') {
    return handleHealthRequest(req);
  }

  // No matching route
  return null;
}

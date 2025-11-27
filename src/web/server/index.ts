/**
 * Web Server Module Exports
 * Central export point for all server components
 *
 * Phase 3 Enhanced - Version: 2.0.0
 */

// Route handlers
export {
  handleApiRequest,
  handleProcessRequest,
  handleStatusRequest,
  handleDownloadRequest,
  handleHealthRequest
} from './routes.js';

// Enhanced route handlers (Phase 3)
export {
  handleEnhancedApiRequest,
  handleBatchRequest,
  handleBatchStatusRequest,
  handleBatchResultsRequest,
  handleDashboardRequest,
  handleExportRequest,
  handlePromptsGetRequest,
  jobs,
  batchJobs,
  defaultPrompts,
  summarizationMapping,
  type SummarizationLevel
} from './routes-enhanced.js';

// Middleware
export {
  applyMiddleware,
  createCORSMiddleware,
  rateLimitMiddleware,
  createLoggingMiddleware,
  createErrorHandler,
  validateApiKeyMiddleware,
  type CORSConfig
} from './middleware.js';

// Cache middleware (Phase 3)
export {
  responseCacheMiddleware,
  getResponseCache,
  resetResponseCache,
  ResponseCache,
  type CachedResponse,
  type CacheStats
} from './cache-middleware.js';

// Compression middleware (Phase 3)
export {
  compressionMiddleware,
  getCompressionStats,
  resetCompressionStats,
  type CompressionEncoding,
  type CompressionStats
} from './compression.js';

// WebSocket handlers
export {
  websocketHandlers,
  handleWebSocketUpgrade,
  broadcastProgress,
  broadcastGlobal,
  getConnectionStats,
  closeAllConnections,
  type WSConnectionData,
  type ProgressUpdate
} from './websocket.js';

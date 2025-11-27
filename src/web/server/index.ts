/**
 * Web Server Module Exports
 * Central export point for all server components
 *
 * Version: 1.0.0
 */

// Route handlers
export {
  handleApiRequest,
  handleProcessRequest,
  handleStatusRequest,
  handleDownloadRequest,
  handleHealthRequest
} from './routes.js';

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

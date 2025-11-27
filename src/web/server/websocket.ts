/**
 * WebSocket Handler for Obsidianize Web TUI Interface
 * Provides real-time progress updates during content processing
 *
 * Version: 1.0.0
 */

import { createLogger } from '../../core/logging/index.js';
import type { ServerWebSocket } from 'bun';

const logger = createLogger('websocket');

// ============================================================================
// WEBSOCKET CONNECTION MANAGEMENT
// ============================================================================

/** WebSocket connection data */
interface WSConnectionData {
  jobId?: string;
  userId: string;
  connectedAt: Date;
}

/** Progress update message */
interface ProgressUpdate {
  type: 'progress' | 'status' | 'error' | 'complete';
  jobId: string;
  progress?: number;
  status?: string;
  message?: string;
  data?: any;
  timestamp: string;
}

/** Active WebSocket connections indexed by job ID */
const connections = new Map<string, Set<ServerWebSocket<WSConnectionData>>>();

/** Track all connections for cleanup */
const allConnections = new Set<ServerWebSocket<WSConnectionData>>();

// ============================================================================
// WEBSOCKET HANDLERS
// ============================================================================

/**
 * Handle new WebSocket connection
 */
export function handleWebSocketOpen(ws: ServerWebSocket<WSConnectionData>): void {
  const { jobId, userId } = ws.data;

  logger.info(`WebSocket connection opened`, {
    jobId,
    userId,
    totalConnections: allConnections.size + 1
  });

  // Add to all connections
  allConnections.add(ws);

  // If job ID specified, add to job-specific connections
  if (jobId) {
    if (!connections.has(jobId)) {
      connections.set(jobId, new Set());
    }
    connections.get(jobId)!.add(ws);

    // Send welcome message
    sendProgressUpdate(ws, {
      type: 'status',
      jobId,
      status: 'connected',
      message: 'WebSocket connection established',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle WebSocket message from client
 */
export function handleWebSocketMessage(
  ws: ServerWebSocket<WSConnectionData>,
  message: string | Buffer
): void {
  try {
    const data = typeof message === 'string' ? JSON.parse(message) : JSON.parse(message.toString());

    logger.debug('WebSocket message received', {
      jobId: ws.data.jobId,
      userId: ws.data.userId,
      messageType: data.type
    });

    // Handle different message types
    switch (data.type) {
      case 'ping':
        sendProgressUpdate(ws, {
          type: 'status',
          jobId: ws.data.jobId || 'unknown',
          status: 'pong',
          timestamp: new Date().toISOString()
        });
        break;

      case 'subscribe':
        // Subscribe to a different job
        if (data.jobId && data.jobId !== ws.data.jobId) {
          // Remove from old job
          if (ws.data.jobId) {
            const oldConnections = connections.get(ws.data.jobId);
            if (oldConnections) {
              oldConnections.delete(ws);
            }
          }

          // Add to new job
          ws.data.jobId = data.jobId;
          if (!connections.has(data.jobId)) {
            connections.set(data.jobId, new Set());
          }
          connections.get(data.jobId)!.add(ws);

          sendProgressUpdate(ws, {
            type: 'status',
            jobId: data.jobId,
            status: 'subscribed',
            message: `Subscribed to job ${data.jobId}`,
            timestamp: new Date().toISOString()
          });
        }
        break;

      default:
        logger.warn('Unknown WebSocket message type', { type: data.type });
    }
  } catch (error) {
    logger.error('WebSocket message error', error, {
      jobId: ws.data.jobId,
      userId: ws.data.userId
    });

    sendProgressUpdate(ws, {
      type: 'error',
      jobId: ws.data.jobId || 'unknown',
      message: 'Invalid message format',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle WebSocket connection close
 */
export function handleWebSocketClose(
  ws: ServerWebSocket<WSConnectionData>,
  code: number,
  reason: string
): void {
  const { jobId, userId } = ws.data;

  logger.info(`WebSocket connection closed`, {
    jobId,
    userId,
    code,
    reason,
    totalConnections: allConnections.size - 1
  });

  // Remove from job-specific connections
  if (jobId) {
    const jobConnections = connections.get(jobId);
    if (jobConnections) {
      jobConnections.delete(ws);

      // Clean up empty sets
      if (jobConnections.size === 0) {
        connections.delete(jobId);
      }
    }
  }

  // Remove from all connections
  allConnections.delete(ws);
}

/**
 * Handle WebSocket error
 */
export function handleWebSocketError(ws: ServerWebSocket<WSConnectionData>, error: Error): void {
  logger.error('WebSocket error', error, {
    jobId: ws.data.jobId,
    userId: ws.data.userId
  });
}

// ============================================================================
// PROGRESS BROADCASTING
// ============================================================================

/**
 * Send progress update to a specific WebSocket
 */
function sendProgressUpdate(ws: ServerWebSocket<WSConnectionData>, update: ProgressUpdate): void {
  try {
    ws.send(JSON.stringify(update));
  } catch (error) {
    logger.error('Failed to send progress update', error, {
      jobId: ws.data.jobId,
      userId: ws.data.userId
    });
  }
}

/**
 * Broadcast progress update to all connections for a job
 */
export function broadcastProgress(jobId: string, update: Omit<ProgressUpdate, 'jobId' | 'timestamp'>): void {
  const jobConnections = connections.get(jobId);
  if (!jobConnections || jobConnections.size === 0) {
    return;
  }

  const progressUpdate: ProgressUpdate = {
    ...update,
    jobId,
    timestamp: new Date().toISOString()
  };

  logger.debug(`Broadcasting progress to ${jobConnections.size} connections`, {
    jobId,
    type: update.type,
    progress: update.progress
  });

  // Send to all connections for this job
  for (const ws of jobConnections) {
    sendProgressUpdate(ws, progressUpdate);
  }
}

/**
 * Broadcast to all connections (global announcements)
 */
export function broadcastGlobal(message: Omit<ProgressUpdate, 'timestamp'>): void {
  const update: ProgressUpdate = {
    ...message,
    timestamp: new Date().toISOString()
  };

  logger.debug(`Broadcasting global message to ${allConnections.size} connections`, {
    type: message.type
  });

  for (const ws of allConnections) {
    sendProgressUpdate(ws, update);
  }
}

// ============================================================================
// WEBSOCKET SERVER CONFIGURATION
// ============================================================================

/**
 * WebSocket upgrade handler
 * Extracts job ID from URL and creates connection data
 */
export function handleWebSocketUpgrade(req: Request, server: any): boolean {
  const url = new URL(req.url);
  const path = url.pathname;

  // Match /ws/progress/:jobId
  const match = path.match(/^\/ws\/progress\/([a-zA-Z0-9_]+)$/);
  if (!match) {
    return false;
  }

  const jobId = match[1];
  const userId = extractUserId(req);

  // Upgrade to WebSocket
  const success = server.upgrade(req, {
    data: {
      jobId,
      userId,
      connectedAt: new Date()
    } as WSConnectionData
  });

  return success;
}

/**
 * Extract user ID from request (for tracking)
 */
function extractUserId(req: Request): string {
  // Try to get from headers
  const ip = req.headers.get('X-Forwarded-For')?.split(',')[0] ||
             req.headers.get('X-Real-IP') ||
             'unknown';
  return `user_${hashString(ip)}`;
}

/**
 * Simple hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

// ============================================================================
// CLEANUP AND MONITORING
// ============================================================================

/**
 * Get connection statistics
 */
export function getConnectionStats(): {
  total: number;
  byJob: Record<string, number>;
} {
  const byJob: Record<string, number> = {};

  for (const [jobId, jobConnections] of connections.entries()) {
    byJob[jobId] = jobConnections.size;
  }

  return {
    total: allConnections.size,
    byJob
  };
}

/**
 * Close all connections (for server shutdown)
 */
export function closeAllConnections(code: number = 1000, reason: string = 'Server shutting down'): void {
  logger.info(`Closing all WebSocket connections`, {
    total: allConnections.size,
    code,
    reason
  });

  for (const ws of allConnections) {
    try {
      ws.close(code, reason);
    } catch (error) {
      logger.error('Failed to close WebSocket', error);
    }
  }

  // Clear all connection maps
  connections.clear();
  allConnections.clear();
}

/**
 * Periodic cleanup of stale connections
 */
setInterval(() => {
  const staleTimeout = 30 * 60 * 1000; // 30 minutes
  const now = Date.now();
  let closedCount = 0;

  for (const ws of allConnections) {
    const connectedAt = ws.data.connectedAt.getTime();
    if (now - connectedAt > staleTimeout) {
      try {
        ws.close(1000, 'Connection timeout');
        closedCount++;
      } catch (error) {
        logger.error('Failed to close stale connection', error);
      }
    }
  }

  if (closedCount > 0) {
    logger.info(`Closed ${closedCount} stale connections`);
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// ============================================================================
// EXPORTS
// ============================================================================

export const websocketHandlers = {
  open: handleWebSocketOpen,
  message: handleWebSocketMessage,
  close: handleWebSocketClose,
  error: handleWebSocketError
};

export { WSConnectionData, ProgressUpdate };

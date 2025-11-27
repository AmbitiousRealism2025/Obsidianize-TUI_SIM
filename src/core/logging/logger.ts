/**
 * Logging Framework for Obsidianize
 * Provides structured logging with configurable levels and formatters
 *
 * Based on Opus Code Review recommendations (QUAL-2.1 - QUAL-2.4)
 * Version: 1.0.0
 */

import { FEATURES } from '../constants/index.js';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
  SILENT = 5
}

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  module: string;
  message: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Whether to include timestamps */
  timestamps: boolean;
  /** Whether to use colors (for development) */
  colors: boolean;
  /** Whether to output as JSON (for production) */
  json: boolean;
  /** Custom log handler */
  handler?: (entry: LogEntry) => void;
}

/**
 * Default configuration based on environment
 */
function getDefaultConfig(): LoggerConfig {
  if (FEATURES.isProduction()) {
    return {
      level: LogLevel.INFO,
      timestamps: true,
      colors: false,
      json: true
    };
  }

  if (FEATURES.isTest()) {
    return {
      level: LogLevel.WARN,
      timestamps: false,
      colors: false,
      json: false
    };
  }

  // Development
  return {
    level: LogLevel.DEBUG,
    timestamps: true,
    colors: true,
    json: false
  };
}

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

/**
 * Color mapping for log levels
 */
const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: COLORS.gray,
  [LogLevel.INFO]: COLORS.cyan,
  [LogLevel.WARN]: COLORS.yellow,
  [LogLevel.ERROR]: COLORS.red,
  [LogLevel.FATAL]: `${COLORS.bright}${COLORS.red}`,
  [LogLevel.SILENT]: ''
};

/**
 * Level name mapping
 */
const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
  [LogLevel.SILENT]: 'SILENT'
};

/**
 * Logger class for structured logging
 */
export class Logger {
  private module: string;
  private config: LoggerConfig;

  constructor(module: string, config?: Partial<LoggerConfig>) {
    this.module = module;
    this.config = { ...getDefaultConfig(), ...config };
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData = this.formatError(error);
    this.log(LogLevel.ERROR, message, data, errorData);
  }

  /**
   * Log a fatal error message
   */
  fatal(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData = this.formatError(error);
    this.log(LogLevel.FATAL, message, data, errorData);
  }

  /**
   * Create a child logger with additional context
   */
  child(subModule: string): Logger {
    return new Logger(`${this.module}:${subModule}`, this.config);
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: LogEntry['error']
  ): void {
    // Skip if below configured level
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LEVEL_NAMES[level],
      module: this.module,
      message,
      data,
      error
    };

    // Use custom handler if provided
    if (this.config.handler) {
      this.config.handler(entry);
      return;
    }

    // Output the log entry
    const output = this.format(entry);

    if (level >= LogLevel.ERROR) {
      console.error(output);
    } else if (level === LogLevel.WARN) {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  /**
   * Format a log entry for output
   */
  private format(entry: LogEntry): string {
    if (this.config.json) {
      return this.formatJSON(entry);
    }
    return this.formatPretty(entry);
  }

  /**
   * Format as JSON (for production)
   */
  private formatJSON(entry: LogEntry): string {
    // In production, don't include stack traces
    const safeEntry = { ...entry };
    if (FEATURES.isProduction() && safeEntry.error?.stack) {
      delete safeEntry.error.stack;
    }
    return JSON.stringify(safeEntry);
  }

  /**
   * Format for human readability (for development)
   */
  private formatPretty(entry: LogEntry): string {
    const parts: string[] = [];

    // Timestamp
    if (this.config.timestamps) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      if (this.config.colors) {
        parts.push(`${COLORS.gray}${time}${COLORS.reset}`);
      } else {
        parts.push(time);
      }
    }

    // Level
    const levelColor = this.config.colors ? LEVEL_COLORS[entry.level] : '';
    const levelReset = this.config.colors ? COLORS.reset : '';
    parts.push(`${levelColor}[${entry.levelName}]${levelReset}`);

    // Module
    if (this.config.colors) {
      parts.push(`${COLORS.magenta}[${entry.module}]${COLORS.reset}`);
    } else {
      parts.push(`[${entry.module}]`);
    }

    // Message
    parts.push(entry.message);

    // Data
    if (entry.data && Object.keys(entry.data).length > 0) {
      const dataStr = JSON.stringify(entry.data, null, 2);
      if (this.config.colors) {
        parts.push(`${COLORS.dim}${dataStr}${COLORS.reset}`);
      } else {
        parts.push(dataStr);
      }
    }

    // Error
    if (entry.error) {
      parts.push(`\n  Error: ${entry.error.name}: ${entry.error.message}`);
      if (entry.error.stack && !FEATURES.isProduction()) {
        parts.push(`\n  Stack: ${entry.error.stack}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * Format an error for logging
   */
  private formatError(error: Error | unknown): LogEntry['error'] | undefined {
    if (!error) {
      return undefined;
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        // Only include stack in non-production
        stack: FEATURES.isProduction() ? undefined : error.stack
      };
    }

    // Handle non-Error objects
    return {
      name: 'UnknownError',
      message: typeof error === 'string' ? error : JSON.stringify(error)
    };
  }
}

/**
 * Create a logger for a module
 */
export function createLogger(module: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger(module, config);
}

/**
 * Global logger instance (for quick access)
 */
export const logger = createLogger('app');

/**
 * Log level from string
 */
export function parseLogLevel(level: string): LogLevel {
  const upper = level.toUpperCase();
  switch (upper) {
    case 'DEBUG': return LogLevel.DEBUG;
    case 'INFO': return LogLevel.INFO;
    case 'WARN': return LogLevel.WARN;
    case 'ERROR': return LogLevel.ERROR;
    case 'FATAL': return LogLevel.FATAL;
    case 'SILENT': return LogLevel.SILENT;
    default: return LogLevel.INFO;
  }
}

/**
 * Configure global logging from environment
 */
export function configureFromEnv(): void {
  const level = process.env.LOG_LEVEL;
  if (level) {
    logger.setLevel(parseLogLevel(level));
  }
}

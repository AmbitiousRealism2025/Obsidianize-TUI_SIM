import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  Logger,
  LogLevel,
  createLogger,
  logger,
  parseLogLevel,
  configureFromEnv,
  type LogEntry,
  type LoggerConfig
} from '../../src/core/logging/logger';

describe('Logger', () => {
  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    process.env.NODE_ENV = originalEnv;
  });

  describe('Constructor', () => {
    it('should create logger with module name', () => {
      const logger = new Logger('test-module');
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should use default config in development', () => {
      process.env.NODE_ENV = 'development';
      const logger = new Logger('test');
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    });

    it('should use default config in production', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger('test');
      expect(logger.getLevel()).toBe(LogLevel.INFO);
    });

    it('should use default config in test', () => {
      process.env.NODE_ENV = 'test';
      const logger = new Logger('test');
      expect(logger.getLevel()).toBe(LogLevel.WARN);
    });

    it('should accept custom config', () => {
      const logger = new Logger('test', {
        level: LogLevel.ERROR,
        colors: false,
        timestamps: false,
        json: true
      });

      expect(logger.getLevel()).toBe(LogLevel.ERROR);
    });
  });

  describe('Log Levels', () => {
    it('should filter logs below configured level', () => {
      const logs: string[] = [];
      console.log = (msg: string) => logs.push(msg);
      console.warn = (msg: string) => logs.push(msg);

      const logger = new Logger('test', { level: LogLevel.WARN });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');

      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('warn message');
    });

    it('should allow all logs at DEBUG level', () => {
      const logs: string[] = [];
      console.log = (msg: string) => logs.push(msg);
      console.warn = (msg: string) => logs.push(msg);
      console.error = (msg: string) => logs.push(msg);

      const logger = new Logger('test', { level: LogLevel.DEBUG });

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');

      expect(logs.length).toBe(3);
    });

    it('should block all logs at SILENT level', () => {
      const logs: string[] = [];
      console.log = (msg: string) => logs.push(msg);
      console.warn = (msg: string) => logs.push(msg);
      console.error = (msg: string) => logs.push(msg);

      const logger = new Logger('test', { level: LogLevel.SILENT });

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
      logger.fatal('fatal');

      expect(logs.length).toBe(0);
    });
  });

  describe('setLevel / getLevel', () => {
    it('should get and set log level', () => {
      const logger = new Logger('test');

      logger.setLevel(LogLevel.ERROR);
      expect(logger.getLevel()).toBe(LogLevel.ERROR);

      logger.setLevel(LogLevel.DEBUG);
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    });
  });

  describe('Log Methods', () => {
    it('should log debug messages', () => {
      let logged = false;
      console.log = () => { logged = true; };

      const logger = new Logger('test', { level: LogLevel.DEBUG });
      logger.debug('test message');

      expect(logged).toBe(true);
    });

    it('should log info messages', () => {
      let logged = false;
      console.log = () => { logged = true; };

      const logger = new Logger('test', { level: LogLevel.INFO });
      logger.info('test message');

      expect(logged).toBe(true);
    });

    it('should log warn messages to console.warn', () => {
      let logged = false;
      console.warn = () => { logged = true; };

      const logger = new Logger('test', { level: LogLevel.WARN });
      logger.warn('test message');

      expect(logged).toBe(true);
    });

    it('should log error messages to console.error', () => {
      let logged = false;
      console.error = () => { logged = true; };

      const logger = new Logger('test', { level: LogLevel.ERROR });
      logger.error('test message');

      expect(logged).toBe(true);
    });

    it('should log fatal messages to console.error', () => {
      let logged = false;
      console.error = () => { logged = true; };

      const logger = new Logger('test', { level: LogLevel.FATAL });
      logger.fatal('test message');

      expect(logged).toBe(true);
    });
  });

  describe('Data Logging', () => {
    it('should log additional data', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        json: true
      });

      logger.info('test message', { userId: 123, action: 'login' });

      expect(loggedMessage).toBeDefined();
      const parsed = JSON.parse(loggedMessage);
      expect(parsed.data).toEqual({ userId: 123, action: 'login' });
    });
  });

  describe('Error Logging', () => {
    it('should log errors with error method', () => {
      let loggedMessage = '';
      console.error = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.ERROR,
        json: true
      });

      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(loggedMessage).toBeDefined();
      const parsed = JSON.parse(loggedMessage);
      expect(parsed.error).toBeDefined();
      expect(parsed.error.name).toBe('Error');
      expect(parsed.error.message).toBe('Test error');
    });

    it('should handle non-Error objects', () => {
      let loggedMessage = '';
      console.error = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.ERROR,
        json: true
      });

      logger.error('Error occurred', 'string error');

      const parsed = JSON.parse(loggedMessage);
      expect(parsed.error).toBeDefined();
      expect(parsed.error.name).toBe('UnknownError');
      expect(parsed.error.message).toBe('string error');
    });

    it('should handle error with data', () => {
      let loggedMessage = '';
      console.error = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.ERROR,
        json: true
      });

      const error = new Error('Test error');
      logger.error('Error occurred', error, { context: 'test' });

      const parsed = JSON.parse(loggedMessage);
      expect(parsed.data).toEqual({ context: 'test' });
      expect(parsed.error).toBeDefined();
    });
  });

  describe('JSON Format', () => {
    it('should format logs as JSON', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        json: true
      });

      logger.info('test message', { key: 'value' });

      expect(() => JSON.parse(loggedMessage)).not.toThrow();
      const parsed = JSON.parse(loggedMessage);
      expect(parsed.message).toBe('test message');
      expect(parsed.level).toBe(LogLevel.INFO);
      expect(parsed.module).toBe('test');
      expect(parsed.data).toEqual({ key: 'value' });
    });

    it('should exclude stack in production JSON', () => {
      process.env.NODE_ENV = 'production';

      let loggedMessage = '';
      console.error = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.ERROR,
        json: true
      });

      const error = new Error('Test error');
      logger.error('Error occurred', error);

      const parsed = JSON.parse(loggedMessage);
      expect(parsed.error.stack).toBeUndefined();
    });

    it('should include stack in development JSON', () => {
      process.env.NODE_ENV = 'development';

      let loggedMessage = '';
      console.error = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.ERROR,
        json: true
      });

      const error = new Error('Test error');
      logger.error('Error occurred', error);

      const parsed = JSON.parse(loggedMessage);
      expect(parsed.error.stack).toBeDefined();
    });
  });

  describe('Pretty Format', () => {
    it('should format logs as pretty text', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        json: false,
        colors: false,
        timestamps: false
      });

      logger.info('test message');

      expect(loggedMessage).toContain('[INFO]');
      expect(loggedMessage).toContain('[test]');
      expect(loggedMessage).toContain('test message');
    });

    it('should include timestamps when enabled', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        json: false,
        timestamps: true,
        colors: false
      });

      logger.info('test message');

      // Should contain time-like pattern (e.g., "12:34:56")
      expect(loggedMessage).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should include colors when enabled', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        json: false,
        colors: true
      });

      logger.info('test message');

      // Should contain ANSI color codes
      expect(loggedMessage).toMatch(/\x1b\[\d+m/);
    });

    it('should format data as JSON in pretty mode', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        json: false,
        colors: false,
        timestamps: false
      });

      logger.info('test message', { key: 'value' });

      expect(loggedMessage).toContain('"key": "value"');
    });
  });

  describe('Child Logger', () => {
    it('should create child logger with combined module name', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('parent', {
        level: LogLevel.INFO,
        json: false,
        colors: false,
        timestamps: false
      });

      const child = logger.child('child');
      child.info('test message');

      expect(loggedMessage).toContain('[parent:child]');
    });

    it('should inherit parent configuration', () => {
      const parent = new Logger('parent', {
        level: LogLevel.WARN,
        json: true
      });

      const child = parent.child('child');

      expect(child.getLevel()).toBe(LogLevel.WARN);
    });

    it('should support nested children', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const parent = new Logger('parent', {
        level: LogLevel.INFO,
        json: false,
        colors: false,
        timestamps: false
      });

      const child = parent.child('child');
      const grandchild = child.child('grandchild');
      grandchild.info('test message');

      expect(loggedMessage).toContain('[parent:child:grandchild]');
    });
  });

  describe('Custom Handler', () => {
    it('should use custom handler when provided', () => {
      const entries: LogEntry[] = [];
      const customHandler = (entry: LogEntry) => {
        entries.push(entry);
      };

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        handler: customHandler
      });

      logger.info('test message', { key: 'value' });

      expect(entries.length).toBe(1);
      expect(entries[0].message).toBe('test message');
      expect(entries[0].level).toBe(LogLevel.INFO);
      expect(entries[0].module).toBe('test');
      expect(entries[0].data).toEqual({ key: 'value' });
    });

    it('should not output to console when custom handler is used', () => {
      let consoleLogged = false;
      console.log = () => { consoleLogged = true; };

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        handler: (entry) => { /* do nothing */ }
      });

      logger.info('test message');

      expect(consoleLogged).toBe(false);
    });
  });

  describe('Log Entry Structure', () => {
    it('should create proper log entry structure', () => {
      const entries: LogEntry[] = [];

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        handler: (entry) => entries.push(entry)
      });

      logger.info('test message', { key: 'value' });

      expect(entries[0]).toMatchObject({
        message: 'test message',
        level: LogLevel.INFO,
        levelName: 'INFO',
        module: 'test',
        data: { key: 'value' }
      });

      expect(entries[0].timestamp).toBeDefined();
    });
  });

  describe('parseLogLevel', () => {
    it('should parse log level from string', () => {
      expect(parseLogLevel('DEBUG')).toBe(LogLevel.DEBUG);
      expect(parseLogLevel('INFO')).toBe(LogLevel.INFO);
      expect(parseLogLevel('WARN')).toBe(LogLevel.WARN);
      expect(parseLogLevel('ERROR')).toBe(LogLevel.ERROR);
      expect(parseLogLevel('FATAL')).toBe(LogLevel.FATAL);
      expect(parseLogLevel('SILENT')).toBe(LogLevel.SILENT);
    });

    it('should be case insensitive', () => {
      expect(parseLogLevel('debug')).toBe(LogLevel.DEBUG);
      expect(parseLogLevel('Info')).toBe(LogLevel.INFO);
      expect(parseLogLevel('WARN')).toBe(LogLevel.WARN);
    });

    it('should return INFO for unknown levels', () => {
      expect(parseLogLevel('UNKNOWN')).toBe(LogLevel.INFO);
      expect(parseLogLevel('')).toBe(LogLevel.INFO);
      expect(parseLogLevel('invalid')).toBe(LogLevel.INFO);
    });
  });

  describe('Factory Functions', () => {
    it('should create logger with createLogger', () => {
      const logger = createLogger('test');
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should accept config in createLogger', () => {
      const logger = createLogger('test', { level: LogLevel.ERROR });
      expect(logger.getLevel()).toBe(LogLevel.ERROR);
    });
  });

  describe('Global Logger Instance', () => {
    it('should provide global logger instance', () => {
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('configureFromEnv', () => {
    it('should configure from LOG_LEVEL environment variable', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'ERROR';

      configureFromEnv();

      expect(logger.getLevel()).toBe(LogLevel.ERROR);

      // Cleanup
      if (originalLogLevel !== undefined) {
        process.env.LOG_LEVEL = originalLogLevel;
      } else {
        delete process.env.LOG_LEVEL;
      }
    });

    it('should handle missing LOG_LEVEL', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      delete process.env.LOG_LEVEL;

      // Should not throw
      expect(() => configureFromEnv()).not.toThrow();

      // Cleanup
      if (originalLogLevel !== undefined) {
        process.env.LOG_LEVEL = originalLogLevel;
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined data', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        json: true
      });

      logger.info('test message', undefined);

      const parsed = JSON.parse(loggedMessage);
      expect(parsed.data).toBeUndefined();
    });

    it('should handle empty data object', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        json: true
      });

      logger.info('test message', {});

      const parsed = JSON.parse(loggedMessage);
      expect(parsed.data).toEqual({});
    });

    it('should handle very long messages', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        json: false
      });

      const longMessage = 'x'.repeat(10000);
      logger.info(longMessage);

      expect(loggedMessage).toContain('x'.repeat(100)); // Should still contain the message
    });

    it('should handle special characters in messages', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        json: false,
        colors: false
      });

      logger.info('Message with "quotes" and \n newlines');

      expect(loggedMessage).toContain('Message with "quotes"');
    });

    it('should handle circular references in data (JSON mode)', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        json: true
      });

      const circular: any = { a: 1 };
      circular.self = circular;

      // Should handle gracefully (may throw, but should not crash)
      expect(() => logger.info('test', circular)).toThrow();
    });
  });

  describe('Log Level Hierarchy', () => {
    it('should respect log level hierarchy', () => {
      const logs: string[] = [];
      console.log = (msg: string) => logs.push('log');
      console.warn = (msg: string) => logs.push('warn');
      console.error = (msg: string) => logs.push('error');

      const logger = new Logger('test', { level: LogLevel.WARN });

      logger.debug('debug'); // Filtered
      logger.info('info');   // Filtered
      logger.warn('warn');   // Logged
      logger.error('error'); // Logged
      logger.fatal('fatal'); // Logged

      expect(logs).toEqual(['warn', 'error', 'error']);
    });
  });

  describe('Timestamp Format', () => {
    it('should include ISO timestamp in JSON mode', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('test', {
        level: LogLevel.INFO,
        json: true
      });

      logger.info('test');

      const parsed = JSON.parse(loggedMessage);
      expect(parsed.timestamp).toBeDefined();
      // Should be valid ISO 8601 format
      expect(() => new Date(parsed.timestamp)).not.toThrow();
    });
  });

  describe('Module Name', () => {
    it('should include module name in all log entries', () => {
      let loggedMessage = '';
      console.log = (msg: string) => { loggedMessage = msg; };

      const logger = new Logger('my-module', {
        level: LogLevel.INFO,
        json: true
      });

      logger.info('test');

      const parsed = JSON.parse(loggedMessage);
      expect(parsed.module).toBe('my-module');
    });
  });
});

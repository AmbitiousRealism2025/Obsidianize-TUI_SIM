/**
 * Configuration System Tests
 * Tests for Phase 3 environment-based configuration
 *
 * Version: 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getConfig,
  buildConfig,
  resetConfig,
  setConfig,
  validateConfig,
  detectEnvironment,
  isProduction,
  isDevelopment,
  isStaging,
  isTest,
  getEnvironmentName,
  type ApplicationConfig
} from '../../src/core/config/index.js';

describe('Configuration System', () => {
  // Reset config before each test
  beforeEach(() => {
    resetConfig();
  });

  afterEach(() => {
    resetConfig();
  });

  describe('detectEnvironment', () => {
    it('should detect development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const env = detectEnvironment();
      expect(env).toBe('development');

      process.env.NODE_ENV = originalEnv;
    });

    it('should detect production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const env = detectEnvironment();
      expect(env).toBe('production');

      process.env.NODE_ENV = originalEnv;
    });

    it('should detect staging environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'staging';

      const env = detectEnvironment();
      expect(env).toBe('staging');

      process.env.NODE_ENV = originalEnv;
    });

    it('should detect test environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const env = detectEnvironment();
      expect(env).toBe('test');

      process.env.NODE_ENV = originalEnv;
    });

    it('should default to development for unknown environments', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'unknown';

      const env = detectEnvironment();
      expect(env).toBe('development');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('buildConfig', () => {
    it('should build config for development environment', () => {
      const config = buildConfig('development');

      expect(config.environment).toBe('development');
      // Note: Env vars may override these defaults
      expect(config.name).toBe('Obsidianize');
      expect(config.version).toBe('1.0.0');
    });

    it('should build config for production environment', () => {
      const config = buildConfig('production');

      expect(config.environment).toBe('production');
      // Note: Env vars may override logging, but pwa.enabled should be true in prod
      expect(config.name).toBe('Obsidianize');
    });

    it('should build config for staging environment', () => {
      const config = buildConfig('staging');

      expect(config.environment).toBe('staging');
      expect(config.name).toBe('Obsidianize');
    });

    it('should build config for test environment', () => {
      const config = buildConfig('test');

      expect(config.environment).toBe('test');
      expect(config.name).toBe('Obsidianize');
    });

    it('should include default values', () => {
      const config = buildConfig('development');

      expect(config.name).toBe('Obsidianize');
      expect(config.version).toBe('1.0.0');
      expect(config.server.port).toBe(3000);
      expect(config.ai.model).toBe('gemini-pro');
    });
  });

  describe('getConfig', () => {
    it('should return singleton config', () => {
      const config1 = getConfig();
      const config2 = getConfig();

      expect(config1).toBe(config2);
    });

    it('should create config if not exists', () => {
      const config = getConfig();

      expect(config).toBeDefined();
      expect(config.name).toBe('Obsidianize');
    });
  });

  describe('setConfig', () => {
    it('should allow setting custom config', () => {
      const customConfig = buildConfig('development');
      customConfig.server.port = 8080;

      setConfig(customConfig);
      const config = getConfig();

      expect(config.server.port).toBe(8080);
    });
  });

  describe('validateConfig', () => {
    it('should validate a correct config', () => {
      const config = buildConfig('development');
      const result = validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid port', () => {
      const config = buildConfig('development');
      config.server.port = -1;

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid port: -1');
    });

    it('should detect invalid AI temperature', () => {
      const config = buildConfig('development');
      config.ai.temperature = 5;

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('temperature'))).toBe(true);
    });

    it('should detect invalid batch settings', () => {
      const config = buildConfig('development');
      config.batch.maxUrls = 0;

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('batch max URLs'))).toBe(true);
    });
  });

  describe('environment helpers', () => {
    it('should correctly identify production', () => {
      const config = buildConfig('production');
      setConfig(config);

      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
      expect(isStaging()).toBe(false);
      expect(isTest()).toBe(false);
    });

    it('should correctly identify development', () => {
      const config = buildConfig('development');
      setConfig(config);

      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(true);
      expect(isStaging()).toBe(false);
      expect(isTest()).toBe(false);
    });

    it('should correctly identify staging', () => {
      const config = buildConfig('staging');
      setConfig(config);

      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(false);
      expect(isStaging()).toBe(true);
      expect(isTest()).toBe(false);
    });

    it('should correctly identify test', () => {
      const config = buildConfig('test');
      setConfig(config);

      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(false);
      expect(isStaging()).toBe(false);
      expect(isTest()).toBe(true);
    });
  });

  describe('getEnvironmentName', () => {
    it('should return capitalized environment name', () => {
      const config = buildConfig('development');
      setConfig(config);

      expect(getEnvironmentName()).toBe('Development');
    });

    it('should work for all environments', () => {
      const environments = ['development', 'staging', 'production', 'test'] as const;

      for (const env of environments) {
        const config = buildConfig(env);
        setConfig(config);

        const name = getEnvironmentName();
        expect(name).toBe(env.charAt(0).toUpperCase() + env.slice(1));
      }
    });
  });

  describe('environment variable overrides', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      // Restore original environment
      process.env = { ...originalEnv };
    });

    it('should override port from environment', () => {
      process.env.PORT = '8080';
      resetConfig();

      const config = buildConfig('development');
      expect(config.server.port).toBe(8080);
    });

    it('should override log level from environment', () => {
      process.env.LOG_LEVEL = 'error';
      resetConfig();

      const config = buildConfig('development');
      expect(config.logging.level).toBe('error');
    });

    it('should override cache settings from environment', () => {
      process.env.CACHE_ENABLED = 'false';
      resetConfig();

      const config = buildConfig('development');
      expect(config.cache.enabled).toBe(false);
    });
  });
});

describe('Configuration Module Integration', () => {
  beforeEach(() => {
    resetConfig();
  });

  afterEach(() => {
    resetConfig();
  });

  it('should have all required config sections', () => {
    const config = getConfig();

    expect(config.server).toBeDefined();
    expect(config.cache).toBeDefined();
    expect(config.rateLimit).toBeDefined();
    expect(config.ai).toBeDefined();
    expect(config.logging).toBeDefined();
    expect(config.security).toBeDefined();
    expect(config.performance).toBeDefined();
    expect(config.batch).toBeDefined();
    expect(config.pwa).toBeDefined();
  });

  it('should have valid default values for all settings', () => {
    const config = getConfig();
    const result = validateConfig(config);

    expect(result.valid).toBe(true);
  });

  it('should support batch processing configuration', () => {
    const config = getConfig();

    expect(config.batch.enabled).toBeDefined();
    expect(config.batch.maxUrls).toBeGreaterThan(0);
    expect(config.batch.maxConcurrent).toBeGreaterThan(0);
    expect(config.batch.timeout).toBeGreaterThan(0);
  });

  it('should support PWA configuration', () => {
    const config = getConfig();

    expect(config.pwa.enabled).toBeDefined();
    expect(config.pwa.name).toBe('Obsidianize');
    expect(config.pwa.themeColor).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

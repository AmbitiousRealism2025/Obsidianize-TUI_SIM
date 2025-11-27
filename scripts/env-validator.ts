#!/usr/bin/env bun

/**
 * Environment Validation Script
 * Validates that all required environment variables are set and properly formatted
 *
 * Note: Bun natively loads .env files automatically, so no dotenv dependency needed.
 * Throws errors instead of calling exit(1) to be test-runner friendly.
 */

import { existsSync } from 'node:fs';

/** Custom error class for environment validation failures */
export class EnvironmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

interface EnvConfig {
  required: string[];
  optional: string[];
  validators: Record<string, (value: string) => boolean>;
}

const ENV_CONFIG: EnvConfig = {
  required: [
    'NODE_ENV',
    'PORT',
    'HOST'
  ],
  optional: [
    'LOG_LEVEL',
    'LOG_FORMAT',
    'HOT_RELOAD',
    'DEBUG_MODE',
    'BUILD_TARGET',
    'MINIFY',
    'SOURCE_MAPS',
    'API_BASE_URL',
    'API_TIMEOUT',
    'CORS_ORIGIN',
    'RATE_LIMIT_WINDOW',
    'RATE_LIMIT_MAX',
    'STARTUP_TIMEOUT',
    'MAX_MEMORY_USAGE',
    'BUNDLE_SIZE_LIMIT',
    'ENABLE_METRICS',
    'ENABLE_PROFILING',
    'ENABLE_CACHING'
  ],
  validators: {
    NODE_ENV: (value: string) => ['development', 'production', 'test'].includes(value),
    PORT: (value: string) => {
      const port = parseInt(value, 10);
      return !isNaN(port) && port > 0 && port < 65536;
    },
    HOST: (value: string) => value.length > 0,
    LOG_LEVEL: (value: string) => ['error', 'warn', 'info', 'debug'].includes(value),
    LOG_FORMAT: (value: string) => ['pretty', 'json', 'simple'].includes(value),
    HOT_RELOAD: (value: string) => ['true', 'false'].includes(value),
    DEBUG_MODE: (value: string) => ['true', 'false'].includes(value),
    BUILD_TARGET: (value: string) => ['development', 'production'].includes(value),
    MINIFY: (value: string) => ['true', 'false'].includes(value),
    SOURCE_MAPS: (value: string) => ['true', 'false'].includes(value),
    API_TIMEOUT: (value: string) => {
      const timeout = parseInt(value, 10);
      return !isNaN(timeout) && timeout > 0;
    },
    RATE_LIMIT_WINDOW: (value: string) => {
      const window = parseInt(value, 10);
      return !isNaN(window) && window > 0;
    },
    RATE_LIMIT_MAX: (value: string) => {
      const max = parseInt(value, 10);
      return !isNaN(max) && max > 0;
    },
    STARTUP_TIMEOUT: (value: string) => {
      const timeout = parseInt(value, 10);
      return !isNaN(timeout) && timeout > 0 && timeout <= 1000;
    },
    MAX_MEMORY_USAGE: (value: string) => {
      const memory = parseInt(value, 10);
      return !isNaN(memory) && memory > 0;
    },
    BUNDLE_SIZE_LIMIT: (value: string) => {
      const limit = parseInt(value, 10);
      return !isNaN(limit) && limit > 0;
    },
    ENABLE_METRICS: (value: string) => ['true', 'false'].includes(value),
    ENABLE_PROFILING: (value: string) => ['true', 'false'].includes(value),
    ENABLE_CACHING: (value: string) => ['true', 'false'].includes(value)
  }
};

interface ValidatorOptions {
  /** Skip .env file existence check (useful for testing when env vars are already set) */
  skipFileCheck?: boolean;
  /** Suppress console output */
  quiet?: boolean;
}

function validateEnvironment(options: ValidatorOptions = {}): void {
  const { skipFileCheck = false, quiet = false } = options;

  const log = (msg: string) => { if (!quiet) console.log(msg); };
  const logError = (msg: string) => { if (!quiet) console.error(msg); };

  log('🔍 Validating environment configuration...\n');

  // Check if .env file exists (can be skipped for testing)
  // Note: Bun automatically loads .env files, but we check for existence to provide helpful error messages
  if (!skipFileCheck && !existsSync('.env')) {
    const errorMsg = '.env file not found! Please copy .env.example to .env and configure your values.';
    logError(`❌ Error: ${errorMsg}`);
    throw new EnvironmentValidationError(errorMsg);
  }

  // Bun natively loads .env files - no need for dotenv.config()
  if (!skipFileCheck) {
    log('✅ .env file loaded successfully (via Bun native support)\n');
  } else {
    log('✅ Using environment variables from process.env\n');
  }

  let hasErrors = false;
  const warnings: string[] = [];

  // Validate required variables
  log('📋 Checking required environment variables:');
  for (const varName of ENV_CONFIG.required) {
    const value = process.env[varName];

    if (!value) {
      logError(`  ❌ ${varName}: Missing required value`);
      hasErrors = true;
      continue;
    }

    const validator = ENV_CONFIG.validators[varName];
    if (validator && !validator(value)) {
      logError(`  ❌ ${varName}: Invalid value "${value}"`);
      hasErrors = true;
    } else {
      log(`  ✅ ${varName}: ${value}`);
    }
  }

  // Validate optional variables
  log('\n📝 Checking optional environment variables:');
  for (const varName of ENV_CONFIG.optional) {
    const value = process.env[varName];

    if (!value) {
      warnings.push(`  ⚠️  ${varName}: Not set (using default)`);
      continue;
    }

    const validator = ENV_CONFIG.validators[varName];
    if (validator && !validator(value)) {
      logError(`  ❌ ${varName}: Invalid value "${value}"`);
      hasErrors = true;
    } else {
      log(`  ✅ ${varName}: ${value}`);
    }
  }

  // Display warnings
  if (warnings.length > 0) {
    log('\n⚠️  Warnings:');
    warnings.forEach(warning => log(warning));
  }

  // Performance validation
  const startupTimeout = parseInt(process.env.STARTUP_TIMEOUT || '100', 10);
  const maxMemoryUsage = parseInt(process.env.MAX_MEMORY_USAGE || '512', 10);
  const bundleSizeLimit = parseInt(process.env.BUNDLE_SIZE_LIMIT || '5242880', 10);

  log('\n🚀 Performance Configuration:');
  log(`  ⏱️  Startup timeout: ${startupTimeout}ms`);
  log(`  💾 Max memory usage: ${maxMemoryUsage}MB`);
  log(`  📦 Bundle size limit: ${(bundleSizeLimit / 1024 / 1024).toFixed(1)}MB`);

  if (startupTimeout > 100) {
    log('  ⚠️  Startup timeout exceeds 100ms target');
  } else {
    log('  ✅ Startup timeout meets target');
  }

  if (hasErrors) {
    const errorMsg = 'Environment validation failed! See errors above.';
    log(`\n❌ ${errorMsg}`);
    throw new EnvironmentValidationError(errorMsg);
  }

  log('\n✅ Environment validation completed successfully!');
}

// Run validation if this script is executed directly
// When running as CLI, convert thrown errors to exit(1) for proper shell exit codes
if (import.meta.main) {
  try {
    validateEnvironment();
  } catch (error) {
    // Error message already logged, just exit with failure code
    process.exit(1);
  }
}

export { validateEnvironment };
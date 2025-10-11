#!/usr/bin/env bun

/**
 * Environment Validation Script
 * Validates that all required environment variables are set and properly formatted
 */

import { existsSync } from 'node:fs';
import { exit } from 'node:process';

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

function validateEnvironment(): void {
  console.log('🔍 Validating environment configuration...\n');

  // Check if .env file exists
  if (!existsSync('.env')) {
    console.error('❌ Error: .env file not found!');
    console.log('💡 Please copy .env.example to .env and configure your values.\n');
    exit(1);
  }

  // Load environment variables
  const { error } = require('dotenv').config();
  if (error) {
    console.error('❌ Error loading .env file:', error.message);
    exit(1);
  }

  console.log('✅ .env file loaded successfully\n');

  let hasErrors = false;
  const warnings: string[] = [];

  // Validate required variables
  console.log('📋 Checking required environment variables:');
  for (const varName of ENV_CONFIG.required) {
    const value = process.env[varName];

    if (!value) {
      console.error(`  ❌ ${varName}: Missing required value`);
      hasErrors = true;
      continue;
    }

    const validator = ENV_CONFIG.validators[varName];
    if (validator && !validator(value)) {
      console.error(`  ❌ ${varName}: Invalid value "${value}"`);
      hasErrors = true;
    } else {
      console.log(`  ✅ ${varName}: ${value}`);
    }
  }

  // Validate optional variables
  console.log('\n📝 Checking optional environment variables:');
  for (const varName of ENV_CONFIG.optional) {
    const value = process.env[varName];

    if (!value) {
      warnings.push(`  ⚠️  ${varName}: Not set (using default)`);
      continue;
    }

    const validator = ENV_CONFIG.validators[varName];
    if (validator && !validator(value)) {
      console.error(`  ❌ ${varName}: Invalid value "${value}"`);
      hasErrors = true;
    } else {
      console.log(`  ✅ ${varName}: ${value}`);
    }
  }

  // Display warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(warning));
  }

  // Performance validation
  const startupTimeout = parseInt(process.env.STARTUP_TIMEOUT || '100', 10);
  const maxMemoryUsage = parseInt(process.env.MAX_MEMORY_USAGE || '512', 10);
  const bundleSizeLimit = parseInt(process.env.BUNDLE_SIZE_LIMIT || '5242880', 10);

  console.log('\n🚀 Performance Configuration:');
  console.log(`  ⏱️  Startup timeout: ${startupTimeout}ms`);
  console.log(`  💾 Max memory usage: ${maxMemoryUsage}MB`);
  console.log(`  📦 Bundle size limit: ${(bundleSizeLimit / 1024 / 1024).toFixed(1)}MB`);

  if (startupTimeout > 100) {
    console.log('  ⚠️  Startup timeout exceeds 100ms target');
  } else {
    console.log('  ✅ Startup timeout meets target');
  }

  if (hasErrors) {
    console.log('\n❌ Environment validation failed!');
    exit(1);
  }

  console.log('\n✅ Environment validation completed successfully!');
}

// Run validation if this script is executed directly
if (import.meta.main) {
  validateEnvironment();
}

export { validateEnvironment };
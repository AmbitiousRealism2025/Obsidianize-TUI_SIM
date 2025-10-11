import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global test setup
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'build/',
        'dist/',
        'coverage/',
        'scripts/',
        '*.config.*',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },

    // Test file patterns
    include: [
      'tests/**/*.{test,spec}.{js,ts}',
      '**/*.{test,spec}.{js,ts}'
    ],

    // Exclude patterns
    exclude: [
      'node_modules/',
      'build/',
      'dist/',
      'coverage/'
    ],

    // Performance settings
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1
      }
    },

    // Test timeout
    testTimeout: 5000,

    // Hook timeout
    hookTimeout: 10000,

    // Isolate tests
    isolate: true,

    // Watch mode settings
    watch: false,

    // Reporter
    reporters: ['default', 'verbose'],

    // Output settings
    outputFile: {
      json: './test-results.json'
    }
  },

  // Define constants for tests
  define: {
    'process.env.NODE_ENV': '"test"'
  }
});
/**
 * Mock Factories - Barrel Export
 * Central export point for all mock factories
 *
 * Usage:
 *   import { GeminiMockFactory, NetworkMockFactory } from '../mocks';
 *   import { MockFactories } from '../mocks';
 *
 * Version: 1.0.0
 */

// Export all factories
export {
  GeminiMockFactory,
  NetworkMockFactory,
  FileSystemMockFactory,
  DatabaseMockFactory,
  ProcessingMockFactory,
  MockFactories,
} from './factories.js';

// Export types
export type {
  GeminiMockConfig,
  NetworkMockConfig,
  FileSystemMockConfig,
  DatabaseMockConfig,
} from './factories.js';

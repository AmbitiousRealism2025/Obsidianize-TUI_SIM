/**
 * Performance test suite for Agent D's implementation
 * Validates all performance targets and integration points
 */

import {
  ObsidianizeCore,
  cache,
  fileOps,
  rateLimiter,
  performanceMonitor,
  cacheUtils,
  fileUtils,
  rateLimitUtils
} from '../src/core/performance-system.ts';

// Test configuration
const TEST_CONFIG = {
  cacheTests: 100,
  fileOperations: 50,
  rateLimitChecks: 200,
  memoryThresholdMB: 100,
  startupTimeThresholdMS: 100,
  cacheHitRateTarget: 0.8,
  fileOperationTimeoutMS: 50,
  rateLimitCheckTimeMS: 1,
};

class PerformanceTestSuite {
  private results: Map<string, any> = new Map();
  private testDir = './test-data';

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Agent D Performance Test Suite...\n');

    try {
      // Initialize core components
      await this.testInitialization();

      // Test individual components
      await this.testCachingSystem();
      await this.testFileOperations();
      await this.testRateLimiting();
      await this.testPerformanceMonitoring();

      // Test integration scenarios
      await this.testIntegrationScenarios();

      // Validate performance targets
      await this.validatePerformanceTargets();

      // Generate final report
      this.generateFinalReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  private async testInitialization(): Promise<void> {
    console.log('🚀 Testing System Initialization...');
    const startTime = performance.now();

    await ObsidianizeCore.initialize();

    const initTime = performance.now() - startTime;
    this.results.set('initialization', {
      time: initTime,
      success: initTime < TEST_CONFIG.startupTimeThresholdMS,
    });

    console.log(`   ✅ Initialization completed in ${initTime.toFixed(2)}ms`);
    console.log(`   Target: <${TEST_CONFIG.startupTimeThresholdMS}ms ${initTime < TEST_CONFIG.startupTimeThresholdMS ? '✅' : '❌'}\n`);
  }

  private async testCachingSystem(): Promise<void> {
    console.log('🗄️  Testing Caching System...');
    const results = {
      readTimes: [] as number[],
      writeTimes: [] as number[],
      hitRate: 0,
      compressionRatio: 0,
    };

    // Test cache writes
    for (let i = 0; i < TEST_CONFIG.cacheTests; i++) {
      const startTime = performance.now();
      const testData = {
        id: i,
        data: 'x'.repeat(1000), // 1KB test data
        timestamp: Date.now(),
      };

      await cache.set('test', `item_${i}`, testData, 60000);
      const writeTime = performance.now() - startTime;
      results.writeTimes.push(writeTime);
    }

    // Test cache reads
    let hits = 0;
    for (let i = 0; i < TEST_CONFIG.cacheTests; i++) {
      const startTime = performance.now();
      const cached = await cache.get('test', `item_${i}`);
      const readTime = performance.now() - startTime;
      results.readTimes.push(readTime);

      if (cached) hits++;
    }

    results.hitRate = hits / TEST_CONFIG.cacheTests;

    // Calculate statistics
    const avgWriteTime = results.writeTimes.reduce((a, b) => a + b, 0) / results.writeTimes.length;
    const avgReadTime = results.readTimes.reduce((a, b) => a + b, 0) / results.readTimes.length;

    this.results.set('cache', {
      avgWriteTime,
      avgReadTime,
      hitRate: results.hitRate,
      targetHitRate: TEST_CONFIG.cacheHitRateTarget,
      success: avgWriteTime < 10 && avgReadTime < 10 && results.hitRate > TEST_CONFIG.cacheHitRateTarget,
    });

    console.log(`   ✅ Cache Performance:`);
    console.log(`      Write: ${avgWriteTime.toFixed(2)}ms (target: <10ms)`);
    console.log(`      Read: ${avgReadTime.toFixed(2)}ms (target: <10ms)`);
    console.log(`      Hit Rate: ${(results.hitRate * 100).toFixed(1)}% (target: >${TEST_CONFIG.cacheHitRateTarget * 100}%)`);
    console.log(`      Status: ${this.results.get('cache').success ? '✅' : '❌'}\n`);
  }

  private async testFileOperations(): Promise<void> {
    console.log('💾 Testing File Operations...');
    const results = {
      writeTimes: [] as number[],
      readTimes: [] as number[],
      atomicity: true,
      backupCount: 0,
    };

    // Create test directory
    await fileOps.writeFile(`${this.testDir}/test.txt`, 'test', { createDirs: true });

    // Test file writes
    for (let i = 0; i < TEST_CONFIG.fileOperations; i++) {
      const startTime = performance.now();
      const testData = `Test content ${i}\n${'x'.repeat(500)}`; // ~500 bytes

      await fileOps.writeFile(`${this.testDir}/file_${i}.txt`, testData, {
        backup: i % 10 === 0, // Backup every 10th file
        compression: i % 5 === 0, // Compress every 5th file
      });

      const writeTime = performance.now() - startTime;
      results.writeTimes.push(writeTime);
    }

    // Test file reads
    for (let i = 0; i < TEST_CONFIG.fileOperations; i++) {
      const startTime = performance.now();
      const content = await fileOps.readFile(`${this.testDir}/file_${i}.txt`);
      const readTime = performance.now() - startTime;
      results.readTimes.push(readTime);

      // Verify content integrity
      if (!content || !content.toString().includes(`Test content ${i}`)) {
        results.atomicity = false;
      }
    }

    // Count backups
    const backupDir = `${this.testDir}/.backups`;
    try {
      const backupFiles = await import('fs').then(fs => fs.promises.readdir(backupDir));
      results.backupCount = backupFiles.length;
    } catch {
      results.backupCount = 0;
    }

    // Calculate statistics
    const avgWriteTime = results.writeTimes.reduce((a, b) => a + b, 0) / results.writeTimes.length;
    const avgReadTime = results.readTimes.reduce((a, b) => a + b, 0) / results.readTimes.length;

    this.results.set('fileOps', {
      avgWriteTime,
      avgReadTime,
      atomicity: results.atomicity,
      backupCount: results.backupCount,
      success: avgWriteTime < TEST_CONFIG.fileOperationTimeoutMS && results.atomicity,
    });

    console.log(`   ✅ File Operations Performance:`);
    console.log(`      Write: ${avgWriteTime.toFixed(2)}ms (target: <${TEST_CONFIG.fileOperationTimeoutMS}ms)`);
    console.log(`      Read: ${avgReadTime.toFixed(2)}ms`);
    console.log(`      Atomicity: ${results.atomicity ? '✅' : '❌'}`);
    console.log(`      Backups Created: ${results.backupCount}`);
    console.log(`      Status: ${this.results.get('fileOps').success ? '✅' : '❌'}\n`);
  }

  private async testRateLimiting(): Promise<void> {
    console.log('🚦 Testing Rate Limiting...');
    const results = {
      checkTimes: [] as number[],
      allowedRequests: 0,
      blockedRequests: 0,
      tierChanges: 0,
    };

    // Setup test user tiers
    const testUsers = Array.from({ length: 10 }, (_, i) => `test_user_${i}`);
    testUsers.forEach((userId, index) => {
      const tier = index < 3 ? 'premium' : index < 7 ? 'user' : 'guest';
      rateLimiter.setUserTier(userId, tier);
    });

    // Test rate limit checks
    for (let i = 0; i < TEST_CONFIG.rateLimitChecks; i++) {
      const userId = testUsers[i % testUsers.length];
      const startTime = performance.now();

      const result = await rateLimiter.checkRateLimit(userId, 'test_action', 1);
      const checkTime = performance.now() - startTime;
      results.checkTimes.push(checkTime);

      if (result.allowed) {
        results.allowedRequests++;
      } else {
        results.blockedRequests++;
      }
    }

    // Test tier changes
    rateLimiter.setUserTier('test_user_0', 'admin');
    const adminResult = await rateLimiter.checkRateLimit('test_user_0', 'test_action', 1000);
    results.tierChanges = adminResult.allowed ? 1 : 0;

    // Calculate statistics
    const avgCheckTime = results.checkTimes.reduce((a, b) => a + b, 0) / results.checkTimes.length;

    this.results.set('rateLimit', {
      avgCheckTime,
      allowedRequests: results.allowedRequests,
      blockedRequests: results.blockedRequests,
      tierChangeSuccess: results.tierChanges > 0,
      success: avgCheckTime < TEST_CONFIG.rateLimitCheckTimeMS,
    });

    console.log(`   ✅ Rate Limiting Performance:`);
    console.log(`      Check Time: ${avgCheckTime.toFixed(3)}ms (target: <${TEST_CONFIG.rateLimitCheckTimeMS}ms)`);
    console.log(`      Allowed Requests: ${results.allowedRequests}`);
    console.log(`      Blocked Requests: ${results.blockedRequests}`);
    console.log(`      Tier Changes: ${results.tierChanges > 0 ? '✅' : '❌'}`);
    console.log(`      Status: ${this.results.get('rateLimit').success ? '✅' : '❌'}\n`);
  }

  private async testPerformanceMonitoring(): Promise<void> {
    console.log('📊 Testing Performance Monitoring...');

    // Record some test requests
    for (let i = 0; i < 50; i++) {
      const duration = Math.random() * 100; // 0-100ms
      performanceMonitor.recordRequest(duration);
    }

    // Record cache operations
    for (let i = 0; i < 30; i++) {
      performanceMonitor.recordCacheAccess(i % 10 !== 0, Math.random() * 5);
    }

    // Get metrics
    const metrics = performanceMonitor.getMetrics();
    const alerts = performanceMonitor.getAlerts();

    this.results.set('performanceMonitoring', {
      requestCount: metrics.requestMetrics.totalRequests,
      avgResponseTime: metrics.requestMetrics.averageResponseTime,
      cacheHitRate: metrics.cacheMetrics.hitRate,
      alertCount: alerts.length,
      success: metrics.requestMetrics.totalRequests > 0,
    });

    console.log(`   ✅ Performance Monitoring:`);
    console.log(`      Requests Tracked: ${metrics.requestMetrics.totalRequests}`);
    console.log(`      Avg Response Time: ${metrics.requestMetrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`      Cache Hit Rate: ${(metrics.cacheMetrics.hitRate * 100).toFixed(1)}%`);
    console.log(`      Active Alerts: ${alerts.length}`);
    console.log(`      Status: ${this.results.get('performanceMonitoring').success ? '✅' : '❌'}\n`);
  }

  private async testIntegrationScenarios(): Promise<void> {
    console.log('🔗 Testing Integration Scenarios...');

    // Scenario 1: Cache + File Operations
    const testData = { message: 'integration test', timestamp: Date.now() };
    await cache.set('integration', 'test_file', testData, 60000);
    const cachedData = await cache.get('integration', 'test_file');

    await fileOps.writeFile(`${this.testDir}/integration.json`, JSON.stringify(cachedData), {
      backup: true,
      compression: true,
    });
    const fileContent = await fileOps.readFile(`${this.testDir}/integration.json`);

    // Scenario 2: Rate Limiting + Performance Monitoring
    const userId = 'integration_user';
    await rateLimiter.setUserTier(userId, 'premium');

    for (let i = 0; i < 10; i++) {
      const result = await rateLimiter.checkRateLimit(userId, 'integration_test', 5);
      if (result.allowed) {
        performanceMonitor.recordRequest(Math.random() * 50);
      }
    }

    // Scenario 3: System Health Check
    const systemStatus = await ObsidianizeCore.getSystemStatus();
    const healthReport = ObsidianizeCore.generateHealthReport();
    const validationResults = ObsidianizeCore.validatePerformanceTargets();

    const integrationSuccess =
      cachedData &&
      fileContent &&
      systemStatus.timestamp > 0 &&
      healthReport.includes('System Health Report') &&
      validationResults.passed;

    this.results.set('integration', {
      cacheToFileOp: !!cachedData && !!fileContent,
      rateLimitToMonitoring: systemStatus.performance !== null,
      systemHealth: healthReport.length > 100,
      performanceValidation: validationResults.passed,
      success: integrationSuccess,
    });

    console.log(`   ✅ Integration Scenarios:`);
    console.log(`      Cache → File Ops: ${cachedData && fileContent ? '✅' : '❌'}`);
    console.log(`      Rate Limit → Monitoring: ${systemStatus.performance !== null ? '✅' : '❌'}`);
    console.log(`      System Health: ${healthReport.length > 100 ? '✅' : '❌'}`);
    console.log(`      Performance Validation: ${validationResults.passed ? '✅' : '❌'}`);
    console.log(`      Overall: ${integrationSuccess ? '✅' : '❌'}\n`);
  }

  private async validatePerformanceTargets(): Promise<void> {
    console.log('🎯 Validating Performance Targets...');

    const validation = ObsidianizeCore.validatePerformanceTargets();
    const currentMetrics = performanceMonitor.getMetrics();
    const cacheStats = cache.getStats();

    const targets = {
      startupTime: {
        current: currentMetrics.startupTime,
        target: 100,
        passed: currentMetrics.startupTime <= 100,
      },
      memoryUsage: {
        current: currentMetrics.memoryUsage.current / 1024 / 1024,
        target: 100,
        passed: currentMetrics.memoryUsage.current <= 100 * 1024 * 1024,
      },
      cacheHitRate: {
        current: cacheStats.hitRate * 100,
        target: 80,
        passed: cacheStats.hitRate >= 0.8,
      },
      responseTime: {
        current: currentMetrics.requestMetrics.averageResponseTime,
        target: 1000,
        passed: currentMetrics.requestMetrics.averageResponseTime <= 1000,
      },
    };

    this.results.set('performanceTargets', {
      validation,
      targets,
      overallPassed: validation.passed,
    });

    console.log(`   ✅ Performance Targets:`);
    Object.entries(targets).forEach(([name, data]) => {
      console.log(`      ${name}: ${data.current.toFixed(2)} (target: ${data.target}) ${data.passed ? '✅' : '❌'}`);
    });
    console.log(`      Overall: ${validation.passed ? '✅' : '❌'}\n`);
  }

  private generateFinalReport(): void {
    console.log('📋 Final Test Report');
    console.log('═══════════════════════════════════════════════════════════════');

    const allResults = Array.from(this.results.entries());
    const passedTests = allResults.filter(([, result]) => result.success).length;
    const totalTests = allResults.length;

    console.log(`Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    console.log('\nDetailed Results:');
    allResults.forEach(([testName, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${testName}: ${status}`);
    });

    // System health summary
    console.log('\nSystem Health Summary:');
    console.log(ObsidianizeCore.generateHealthReport());

    console.log('═══════════════════════════════════════════════════════════════');

    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Agent D implementation is ready for production.');
    } else {
      console.log('⚠️  Some tests failed. Please review the results above.');
    }
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test resources...');

    try {
      // Remove test directory
      await import('fs').then(fs => fs.promises.rm(this.testDir, { recursive: true, force: true }));

      // Clear test cache entries
      await cache.clear('test');
      await cache.clear('integration');

      // Shutdown core components
      await ObsidianizeCore.shutdown();

      console.log('✅ Cleanup completed.\n');
    } catch (error) {
      console.warn('⚠️  Cleanup failed:', error);
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  const testSuite = new PerformanceTestSuite();
  await testSuite.runAllTests();
}

export { PerformanceTestSuite };
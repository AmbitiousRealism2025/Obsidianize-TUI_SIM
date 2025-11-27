/**
 * Rate limiting system using token bucket algorithm
 * Features per-user and global rate limiting, usage analytics, and graceful degradation
 */

import { Database } from "bun:sqlite";
import { performanceMonitor } from "../performance.ts";

export interface RateLimitConfig {
  tokens: number;
  refillRate: number; // tokens per second
  windowSize: number; // time window in milliseconds
  maxBurst?: number; // maximum tokens that can be accumulated
}

export interface RateLimitTier {
  name: string;
  config: RateLimitConfig;
  priority: number; // higher number = higher priority
}

export interface RateLimitResult {
  allowed: boolean;
  tokensRemaining: number;
  resetTime: number;
  retryAfter?: number;
  tier: string;
  exceeded: boolean;
}

export interface UsageStats {
  userId: string;
  action: string;
  timestamp: number;
  tokensConsumed: number;
  tier: string;
  metadata?: Record<string, any>;
}

export interface RateLimitAnalytics {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  averageTokensPerRequest: number;
  topUsers: Array<{
    userId: string;
    requests: number;
    tokensConsumed: number;
  }>;
  topActions: Array<{
    action: string;
    requests: number;
    tokensConsumed: number;
  }>;
  tierDistribution: Record<string, number>;
}

export class RateLimiter {
  private db: Database;
  private globalLimits: Map<string, RateLimitConfig> = new Map();
  private tiers: Map<string, RateLimitTier> = new Map();
  private userTiers: Map<string, string> = new Map();
  private adminUsers: Set<string> = new Set();
  private analyticsEnabled: boolean;

  constructor(analyticsEnabled: boolean = true) {
    this.analyticsEnabled = analyticsEnabled;
    this.db = new Database(":memory:");
    this.setupDatabase();
    this.initializeDefaultTiers();
  }

  private setupDatabase(): void {
    // Create rate limits table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        identifier TEXT,
        action TEXT,
        tokens INTEGER,
        last_refill INTEGER,
        tier TEXT,
        PRIMARY KEY (identifier, action)
      )
    `);

    // Create usage analytics table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS usage_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        action TEXT,
        timestamp INTEGER,
        tokens_consumed INTEGER,
        tier TEXT,
        metadata TEXT
      )
    `);

    // Create indexes for performance
    this.db.run("CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier)");
    this.db.run("CREATE INDEX IF NOT EXISTS idx_usage_stats_user ON usage_stats(user_id)");
    this.db.run("CREATE INDEX IF NOT EXISTS idx_usage_stats_action ON usage_stats(action)");
    this.db.run("CREATE INDEX IF NOT EXISTS idx_usage_stats_timestamp ON usage_stats(timestamp)");
  }

  private initializeDefaultTiers(): void {
    // Define default rate limit tiers
    this.addTier({
      name: 'guest',
      config: {
        tokens: 100,
        refillRate: 10, // 10 tokens per second
        windowSize: 60000, // 1 minute
        maxBurst: 150,
      },
      priority: 1,
    });

    this.addTier({
      name: 'user',
      config: {
        tokens: 1000,
        refillRate: 50, // 50 tokens per second
        windowSize: 60000, // 1 minute
        maxBurst: 1500,
      },
      priority: 10,
    });

    this.addTier({
      name: 'premium',
      config: {
        tokens: 5000,
        refillRate: 100, // 100 tokens per second
        windowSize: 60000, // 1 minute
        maxBurst: 7500,
      },
      priority: 50,
    });

    this.addTier({
      name: 'admin',
      config: {
        tokens: 50000,
        refillRate: 1000, // 1000 tokens per second
        windowSize: 60000, // 1 minute
        maxBurst: 100000,
      },
      priority: 100,
    });

    // Set global limits
    this.setGlobalLimit('ai_requests', {
      tokens: 10000,
      refillRate: 100,
      windowSize: 60000,
      maxBurst: 15000,
    });

    this.setGlobalLimit('file_operations', {
      tokens: 5000,
      refillRate: 50,
      windowSize: 60000,
      maxBurst: 7500,
    });
  }

  /**
   * Add or update a rate limit tier
   */
  addTier(tier: RateLimitTier): void {
    this.tiers.set(tier.name, tier);
  }

  /**
   * Set global rate limit for an action
   */
  setGlobalLimit(action: string, config: RateLimitConfig): void {
    this.globalLimits.set(action, config);
  }

  /**
   * Set user tier
   */
  setUserTier(userId: string, tierName: string): void {
    this.userTiers.set(userId, tierName);
  }

  /**
   * Add admin user (bypasses rate limits)
   */
  addAdminUser(userId: string): void {
    this.adminUsers.add(userId);
  }

  /**
   * Remove admin user
   */
  removeAdminUser(userId: string): void {
    this.adminUsers.delete(userId);
  }

  /**
   * Get user tier configuration
   */
  private getUserTierConfig(userId: string): RateLimitTier {
    // Check if user is admin
    if (this.adminUsers.has(userId)) {
      return this.tiers.get('admin')!;
    }

    // Get user's assigned tier
    const tierName = this.userTiers.get(userId) || 'guest';
    const tier = this.tiers.get(tierName);

    if (!tier) {
      // Fallback to guest tier
      return this.tiers.get('guest')!;
    }

    return tier;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(
    currentTokens: number,
    lastRefill: number,
    refillRate: number,
    maxBurst: number
  ): { tokens: number; lastRefill: number } {
    const now = Date.now();
    const elapsed = (now - lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = Math.floor(elapsed * refillRate);

    let newTokens = Math.min(currentTokens + tokensToAdd, maxBurst);
    const newLastRefill = tokensToAdd > 0 ? now : lastRefill;

    return { tokens: newTokens, lastRefill: newLastRefill };
  }

  /**
   * Check rate limit for a user and action
   */
  async checkRateLimit(
    userId: string,
    action: string,
    tokensRequested: number = 1
  ): Promise<RateLimitResult> {
    const startTime = performance.now();

    try {
      // Get user tier
      const userTier = this.getUserTierConfig(userId);

      // Check if user has admin bypass
      if (this.adminUsers.has(userId)) {
        const result: RateLimitResult = {
          allowed: true,
          tokensRemaining: Infinity,
          resetTime: Date.now() + userTier.config.windowSize,
          tier: userTier.name,
          exceeded: false,
        };

        this.recordUsage(userId, action, tokensRequested, userTier.name);
        performanceMonitor.recordRequest(performance.now() - startTime);
        return result;
      }

      // Get current rate limit state
      const query = this.db.query(`
        SELECT * FROM rate_limits
        WHERE identifier = ? AND action = ?
      `);

      let current = query.get(userId, action) as any;

      if (!current) {
        // Initialize new rate limit entry
        current = {
          identifier: userId,
          action,
          tokens: userTier.config.tokens,
          last_refill: Date.now(),
          tier: userTier.name,
        };

        const insert = this.db.prepare(`
          INSERT INTO rate_limits
          (identifier, action, tokens, last_refill, tier)
          VALUES (?, ?, ?, ?, ?)
        `);

        insert.run(userId, action, current.tokens, current.last_refill, current.tier);
      }

      // Refill tokens based on elapsed time
      const refillResult = this.refillTokens(
        current.tokens,
        current.last_refill,
        userTier.config.refillRate,
        userTier.config.maxBurst || userTier.config.tokens * 1.5
      );

      current.tokens = refillResult.tokens;
      current.last_refill = refillResult.lastRefill;

      // Check if request is allowed
      const allowed = current.tokens >= tokensRequested;
      const tokensRemaining = Math.max(0, current.tokens - (allowed ? tokensRequested : 0));

      // Update database
      const update = this.db.prepare(`
        UPDATE rate_limits
        SET tokens = ?, last_refill = ?
        WHERE identifier = ? AND action = ?
      `);

      update.run(tokensRemaining, current.last_refill, userId, action);

      // Calculate reset time
      const resetTime = current.last_refill + userTier.config.windowSize;
      const retryAfter = allowed ? undefined : Math.ceil((resetTime - Date.now()) / 1000);

      const result: RateLimitResult = {
        allowed,
        tokensRemaining,
        resetTime,
        retryAfter,
        tier: userTier.name,
        exceeded: !allowed,
      };

      // Record usage if allowed
      if (allowed) {
        this.recordUsage(userId, action, tokensRequested, userTier.name);
      }

      performanceMonitor.recordRequest(performance.now() - startTime);
      return result;
    } catch (error) {
      console.error('Rate limit check error:', error);

      // Fail open - allow request on error
      return {
        allowed: true,
        tokensRemaining: 0,
        resetTime: Date.now() + 60000,
        tier: 'unknown',
        exceeded: false,
      };
    }
  }

  /**
   * Check global rate limit
   */
  async checkGlobalRateLimit(
    action: string,
    tokensRequested: number = 1
  ): Promise<RateLimitResult> {
    const startTime = performance.now();
    const globalConfig = this.globalLimits.get(action);

    if (!globalConfig) {
      // No global limit configured
      const result: RateLimitResult = {
        allowed: true,
        tokensRemaining: Infinity,
        resetTime: Date.now() + 60000,
        tier: 'global',
        exceeded: false,
      };

      performanceMonitor.recordRequest(performance.now() - startTime);
      return result;
    }

    try {
      const identifier = `global:${action}`;

      // Get current global rate limit state
      const query = this.db.query(`
        SELECT * FROM rate_limits
        WHERE identifier = ? AND action = ?
      `);

      let current = query.get(identifier, action) as any;

      if (!current) {
        // Initialize new global rate limit entry
        current = {
          identifier,
          action,
          tokens: globalConfig.tokens,
          last_refill: Date.now(),
          tier: 'global',
        };

        const insert = this.db.prepare(`
          INSERT INTO rate_limits
          (identifier, action, tokens, last_refill, tier)
          VALUES (?, ?, ?, ?, ?)
        `);

        insert.run(identifier, action, current.tokens, current.last_refill, current.tier);
      }

      // Refill tokens based on elapsed time
      const refillResult = this.refillTokens(
        current.tokens,
        current.last_refill,
        globalConfig.refillRate,
        globalConfig.maxBurst || globalConfig.tokens * 1.5
      );

      current.tokens = refillResult.tokens;
      current.last_refill = refillResult.lastRefill;

      // Check if request is allowed
      const allowed = current.tokens >= tokensRequested;
      const tokensRemaining = Math.max(0, current.tokens - (allowed ? tokensRequested : 0));

      // Update database
      const update = this.db.prepare(`
        UPDATE rate_limits
        SET tokens = ?, last_refill = ?
        WHERE identifier = ? AND action = ?
      `);

      update.run(tokensRemaining, current.last_refill, identifier, action);

      // Calculate reset time
      const resetTime = current.last_refill + globalConfig.windowSize;
      const retryAfter = allowed ? undefined : Math.ceil((resetTime - Date.now()) / 1000);

      const result: RateLimitResult = {
        allowed,
        tokensRemaining,
        resetTime,
        retryAfter,
        tier: 'global',
        exceeded: !allowed,
      };

      performanceMonitor.recordRequest(performance.now() - startTime);
      return result;
    } catch (error) {
      console.error('Global rate limit check error:', error);

      // Fail open - allow request on error
      return {
        allowed: true,
        tokensRemaining: 0,
        resetTime: Date.now() + 60000,
        tier: 'global',
        exceeded: false,
      };
    }
  }

  /**
   * Check both user and global rate limits
   */
  async checkBothLimits(
    userId: string,
    action: string,
    tokensRequested: number = 1
  ): Promise<{ user: RateLimitResult; global: RateLimitResult; allowed: boolean }> {
    const [userResult, globalResult] = await Promise.all([
      this.checkRateLimit(userId, action, tokensRequested),
      this.checkGlobalRateLimit(action, tokensRequested),
    ]);

    return {
      user: userResult,
      global: globalResult,
      allowed: userResult.allowed && globalResult.allowed,
    };
  }

  /**
   * Record usage for analytics
   */
  private recordUsage(userId: string, action: string, tokensConsumed: number, tier: string): void {
    if (!this.analyticsEnabled) return;

    try {
      const insert = this.db.prepare(`
        INSERT INTO usage_stats
        (user_id, action, timestamp, tokens_consumed, tier)
        VALUES (?, ?, ?, ?, ?)
      `);

      insert.run(userId, action, Date.now(), tokensConsumed, tier);

      // Cleanup old analytics data (keep last 30 days)
      this.cleanupAnalytics();
    } catch (error) {
      console.warn('Failed to record usage:', error);
    }
  }

  /**
   * Cleanup old analytics data
   */
  private cleanupAnalytics(): void {
    try {
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      const cleanup = this.db.prepare("DELETE FROM usage_stats WHERE timestamp < ?");
      cleanup.run(cutoffTime);
    } catch (error) {
      console.warn('Failed to cleanup analytics:', error);
    }
  }

  /**
   * Get usage analytics
   */
  async getAnalytics(days: number = 7): Promise<RateLimitAnalytics> {
    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    try {
      // Total requests
      const totalQuery = this.db.query(`
        SELECT COUNT(*) as count, SUM(tokens_consumed) as tokens
        FROM usage_stats
        WHERE timestamp >= ?
      `);
      const totalResult = totalQuery.get(startTime) as any;

      // Allowed vs blocked requests (approximate based on rate limit table)
      const allowedQuery = this.db.query(`
        SELECT COUNT(*) as count
        FROM rate_limits
        WHERE last_refill >= ?
      `);
      const allowedResult = allowedQuery.get(startTime) as any;

      // Top users
      const topUsersQuery = this.db.query(`
        SELECT user_id, COUNT(*) as requests, SUM(tokens_consumed) as tokens
        FROM usage_stats
        WHERE timestamp >= ?
        GROUP BY user_id
        ORDER BY requests DESC
        LIMIT 10
      `);
      const topUsers = topUsersQuery.all(startTime) as any[];

      // Top actions
      const topActionsQuery = this.db.query(`
        SELECT action, COUNT(*) as requests, SUM(tokens_consumed) as tokens
        FROM usage_stats
        WHERE timestamp >= ?
        GROUP BY action
        ORDER BY requests DESC
        LIMIT 10
      `);
      const topActions = topActionsQuery.all(startTime) as any[];

      // Tier distribution
      const tierQuery = this.db.query(`
        SELECT tier, COUNT(*) as count
        FROM usage_stats
        WHERE timestamp >= ?
        GROUP BY tier
      `);
      const tierResults = tierQuery.all(startTime) as any[];

      const tierDistribution: Record<string, number> = {};
      tierResults.forEach((row: any) => {
        tierDistribution[row.tier] = row.count;
      });

      return {
        totalRequests: totalResult.count || 0,
        allowedRequests: allowedResult.count || 0,
        blockedRequests: Math.max(0, (totalResult.count || 0) - (allowedResult.count || 0)),
        averageTokensPerRequest: totalResult.count > 0 ? (totalResult.tokens || 0) / totalResult.count : 0,
        topUsers: topUsers.map((row: any) => ({
          userId: row.user_id,
          requests: row.requests,
          tokensConsumed: row.tokens || 0,
        })),
        topActions: topActions.map((row: any) => ({
          action: row.action,
          requests: row.requests,
          tokensConsumed: row.tokens || 0,
        })),
        tierDistribution,
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        totalRequests: 0,
        allowedRequests: 0,
        blockedRequests: 0,
        averageTokensPerRequest: 0,
        topUsers: [],
        topActions: [],
        tierDistribution: {},
      };
    }
  }

  /**
   * Reset user's rate limits
   */
  async resetUserLimits(userId: string): Promise<void> {
    try {
      const query = this.db.query("DELETE FROM rate_limits WHERE identifier = ?");
      query.run(userId);
    } catch (error) {
      console.error('Failed to reset user limits:', error);
    }
  }

  /**
   * Reset all rate limits
   */
  async resetAllLimits(): Promise<void> {
    try {
      this.db.run("DELETE FROM rate_limits");
    } catch (error) {
      console.error('Failed to reset all limits:', error);
    }
  }

  /**
   * Get current rate limit status for user
   */
  async getUserStatus(userId: string): Promise<Record<string, any>> {
    try {
      const query = this.db.query(`
        SELECT action, tokens, last_refill, tier
        FROM rate_limits
        WHERE identifier = ?
      `);
      const results = query.all(userId) as any[];

      const status: Record<string, any> = {
        userId,
        tier: this.getUserTierConfig(userId).name,
        isAdmin: this.adminUsers.has(userId),
        limits: {},
      };

      results.forEach((row: any) => {
        const tierConfig = this.getUserTierConfig(userId);
        const maxBurst = tierConfig.config.maxBurst || tierConfig.config.tokens * 1.5;

        status.limits[row.action] = {
          tokensRemaining: row.tokens,
          maxTokens: maxBurst,
          lastRefill: row.last_refill,
          refillRate: tierConfig.config.refillRate,
        };
      });

      return status;
    } catch (error) {
      console.error('Failed to get user status:', error);
      return { userId, error: 'Failed to retrieve status' };
    }
  }

  /**
   * Close rate limiter and cleanup resources
   */
  close(): void {
    this.db.close();
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Export rate limiting utilities
export const rateLimitUtils = {
  // Express/HTTP middleware style rate limit checker
  createRateLimitMiddleware: (
    action: string,
    options: {
      getUserId: (req: any) => string;
      tokens?: number;
      checkGlobal?: boolean;
    }
  ) => {
    return async (req: any, res: any, next: any) => {
      try {
        const userId = options.getUserId(req);
        const tokens = options.tokens || 1;

        if (options.checkGlobal) {
          const results = await rateLimiter.checkBothLimits(userId, action, tokens);

          if (!results.allowed) {
            const limitedBy = results.user.exceeded ? 'user' : 'global';
            const result = limitedBy === 'user' ? results.user : results.global;

            return res.status(429).json({
              error: 'Rate limit exceeded',
              limitedBy,
              retryAfter: result.retryAfter,
              resetTime: result.resetTime,
              tier: result.tier,
            });
          }
        } else {
          const result = await rateLimiter.checkRateLimit(userId, action, tokens);

          if (!result.allowed) {
            return res.status(429).json({
              error: 'Rate limit exceeded',
              retryAfter: result.retryAfter,
              resetTime: result.resetTime,
              tier: result.tier,
            });
          }
        }

        next();
      } catch (error) {
        console.error('Rate limit middleware error:', error);
        next(); // Continue on error to avoid breaking functionality
      }
    };
  },

  // Common actions
  ACTIONS: {
    AI_REQUEST: 'ai_request',
    FILE_READ: 'file_read',
    FILE_WRITE: 'file_write',
    CACHE_ACCESS: 'cache_access',
    API_CALL: 'api_call',
    WEB_SCRAPE: 'web_scrape',
  },

  // Common token costs
  TOKEN_COSTS: {
    AI_REQUEST: 10,
    FILE_READ: 1,
    FILE_WRITE: 2,
    CACHE_ACCESS: 0.5,
    API_CALL: 3,
    WEB_SCRAPE: 5,
  },
};
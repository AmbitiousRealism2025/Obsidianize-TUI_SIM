# Obsidianize Code Quality Action Plan

**Based on:** Claude Opus 4 Code Review (November 27, 2025)
**Overall Assessment:** B+ → Target: A
**Estimated Total Effort:** ~300 hours (8-10 weeks with parallelization)
**Target Completion:** Phase 2 Start-Ready

---

## Executive Summary

This action plan addresses all recommendations from the Opus code review across five specialized domains. The plan is structured into **4 implementation phases** with **5 parallel work streams** that can be executed by specialized subagents.

### Key Metrics

| Category | Issues Found | Critical | High | Medium | Low |
|----------|-------------|----------|------|--------|-----|
| Security | 5 | 1 | 1 | 2 | 1 |
| Architecture | 4 | 2 | 2 | 0 | 0 |
| Testing | 8 | 4 | 2 | 2 | 0 |
| Code Quality | 6 | 1 | 3 | 2 | 0 |
| Performance | 5 | 0 | 2 | 2 | 1 |

### Work Streams Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        IMPLEMENTATION PHASES                             │
├─────────────────────────────────────────────────────────────────────────┤
│  Phase 1 (Week 1-2): Foundation & Critical Fixes                        │
│  ├─ [SECURITY]     SSRF Protection (P0-Critical)                        │
│  ├─ [ARCHITECTURE] Error Hierarchy & Type Guards                        │
│  ├─ [TESTING]      Test Infrastructure Setup                            │
│  ├─ [QUALITY]      Constants & Magic Numbers                            │
│  └─ [PERFORMANCE]  Circular Buffer Implementation                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Phase 2 (Week 3-4): Core Improvements                                  │
│  ├─ [SECURITY]     API Key Validation & User-Agent                      │
│  ├─ [ARCHITECTURE] Dependency Injection Container                       │
│  ├─ [TESTING]      Core Component Unit Tests                            │
│  ├─ [QUALITY]      Logging Framework & Console Replacement              │
│  └─ [PERFORMANCE]  Async Compression & Throttled Cleanup                │
├─────────────────────────────────────────────────────────────────────────┤
│  Phase 3 (Week 5-6): Integration & Testing                              │
│  ├─ [SECURITY]     Stack Trace Sanitization                             │
│  ├─ [ARCHITECTURE] Service Migration to DI                              │
│  ├─ [TESTING]      Integration & E2E Tests                              │
│  ├─ [QUALITY]      Error Handling Standardization                       │
│  └─ [PERFORMANCE]  Dependency Cleanup & Benchmarks                      │
├─────────────────────────────────────────────────────────────────────────┤
│  Phase 4 (Week 7-8): Polish & Documentation                             │
│  ├─ [SECURITY]     Lock File Improvements (Optional)                    │
│  ├─ [ARCHITECTURE] Documentation & Migration Guides                     │
│  ├─ [TESTING]      CI/CD Integration & Coverage Enforcement             │
│  ├─ [QUALITY]      JSDoc Documentation                                  │
│  └─ [PERFORMANCE]  Memory Profiling & Validation                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation & Critical Fixes (Week 1-2)

**Goal:** Establish critical infrastructure and address P0 issues

### 1.1 Security Stream (AGENT-SECURITY)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| SEC-1.1 | Implement SSRF Protection in URL Validator | P0-Critical | 6h | None |
| SEC-1.2 | Create SSRFProtection utility class | P0-Critical | 3h | None |
| SEC-1.3 | Add SSRF unit tests | P0-Critical | 3h | SEC-1.1 |

**Files to Create:**
- `src/core/validators/ssrf-protection.ts`

**Files to Modify:**
- `src/core/validators/index.ts` (lines 538-570)

**Implementation Notes:**
```typescript
// Block these IP ranges:
// - 127.0.0.0/8 (loopback)
// - 10.0.0.0/8 (private class A)
// - 172.16.0.0/12 (private class B)
// - 192.168.0.0/16 (private class C)
// - 169.254.0.0/16 (link-local/AWS metadata)
```

### 1.2 Architecture Stream (AGENT-ARCHITECTURE)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| ARCH-1.1 | Create error hierarchy classes | P1-High | 4h | None |
| ARCH-1.2 | Create type guard utilities | P1-High | 2h | None |
| ARCH-1.3 | Fix require() to ES imports | P0-Critical | 2h | None |

**Files to Create:**
- `src/core/errors/error-hierarchy.ts`
- `src/core/errors/index.ts`
- `src/core/utils/type-guards.ts`

**Files to Modify:**
- `src/core/processor.ts` (line 12: require → import)
- `src/core/index.ts` (lines 216-217, 227-228, 238-239)

### 1.3 Testing Stream (AGENT-TESTING)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| TEST-1.1 | Create mock factory infrastructure | P0-Critical | 6h | None |
| TEST-1.2 | Implement GeminiMockFactory | P0-Critical | 3h | TEST-1.1 |
| TEST-1.3 | Implement NetworkMockFactory | P0-Critical | 2h | TEST-1.1 |
| TEST-1.4 | Implement FileSystemMockFactory | P1-High | 2h | TEST-1.1 |
| TEST-1.5 | Implement DatabaseMockFactory | P1-High | 2h | TEST-1.1 |
| TEST-1.6 | Migrate existing tests to bun:test | P1-High | 3h | None |

**Files to Create:**
- `tests/mocks/gemini-mock.ts`
- `tests/mocks/network-mock.ts`
- `tests/mocks/filesystem-mock.ts`
- `tests/mocks/database-mock.ts`
- `tests/utils/test-helpers.ts`
- `tests/utils/assertion-helpers.ts`

### 1.4 Code Quality Stream (AGENT-QUALITY)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| QUAL-1.1 | Create constants file | P1-High | 3h | None |
| QUAL-1.2 | Replace magic numbers (cache.ts) | P1-High | 2h | QUAL-1.1 |
| QUAL-1.3 | Replace magic numbers (rate-limiter.ts) | P1-High | 2h | QUAL-1.1 |
| QUAL-1.4 | Replace magic numbers (processor.ts) | P1-High | 2h | QUAL-1.1 |

**Files to Create:**
- `src/core/constants/index.ts`

**Key Constants to Define:**
```typescript
TIME_CONSTANTS.CACHE_CLEANUP_INTERVAL = 300000  // 5 min
TIME_CONSTANTS.MAX_PROCESSING_TIME = 600000     // 10 min
RATE_LIMIT_CONSTANTS.GUEST_MAX_BURST = 150
SIZE_LIMITS.MAX_CONTENT_LENGTH = 10485760       // 10MB
```

### 1.5 Performance Stream (AGENT-PERFORMANCE)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| PERF-1.1 | Create CircularBuffer class | P1-High | 3h | None |
| PERF-1.2 | Update performance.ts to use CircularBuffer | P1-High | 2h | PERF-1.1 |
| PERF-1.3 | Add CircularBuffer unit tests | P1-High | 2h | PERF-1.1 |

**Files to Create:**
- `src/core/utils/circular-buffer.ts`

**Performance Impact:**
- Before: O(n) shift operations → ~1ms per shift at 1000 items
- After: O(1) push operations → ~0.001ms per push
- **1000x speedup** for metric recording

---

## Phase 2: Core Improvements (Week 3-4)

**Goal:** Implement DI, logging, and comprehensive testing

### 2.1 Security Stream (AGENT-SECURITY)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| SEC-2.1 | Implement API key format validation | P1-High | 3h | None |
| SEC-2.2 | Add rate limiting to key validation | P1-High | 2h | SEC-2.1 |
| SEC-2.3 | Replace User-Agent with transparent bot ID | P2-Medium | 2h | None |
| SEC-2.4 | Create UserAgentConfig utility | P2-Medium | 1h | SEC-2.3 |

**Files to Modify:**
- `src/core/validators/index.ts` (lines 605-627)
- `src/core/ai/content-analyzer.ts` (lines 179-184, 232-236)

### 2.2 Architecture Stream (AGENT-ARCHITECTURE)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| ARCH-2.1 | Create AppContext interface | P0-Critical | 4h | ARCH-1.1 |
| ARCH-2.2 | Implement AppContext container | P0-Critical | 8h | ARCH-2.1 |
| ARCH-2.3 | Create factory functions | P0-Critical | 4h | ARCH-2.1 |
| ARCH-2.4 | Update PerformanceMonitor (add DI support) | P1-High | 2h | ARCH-2.2 |

**Files to Create:**
- `src/core/app-context.ts`
- `src/core/factories/index.ts`
- `src/core/factories/performance-factory.ts`
- `src/core/factories/cache-factory.ts`
- `src/core/factories/rate-limiter-factory.ts`
- `src/core/factories/file-ops-factory.ts`

### 2.3 Testing Stream (AGENT-TESTING)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| TEST-2.1 | DataProcessor unit tests (15 cases) | P0-Critical | 6h | TEST-1.* |
| TEST-2.2 | HighPerformanceCache tests (20 cases) | P0-Critical | 6h | TEST-1.* |
| TEST-2.3 | RateLimiter tests (15 cases) | P0-Critical | 5h | TEST-1.* |
| TEST-2.4 | AtomicFileOperations tests (18 cases) | P1-High | 5h | TEST-1.* |
| TEST-2.5 | AIProcessor tests (12 cases) | P0-Critical | 5h | TEST-1.* |

**Target:** 80%+ coverage for core components

### 2.4 Code Quality Stream (AGENT-QUALITY)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| QUAL-2.1 | Implement logging framework | P1-High | 3h | None |
| QUAL-2.2 | Replace console.log (ai-service.ts) | P1-High | 2h | QUAL-2.1 |
| QUAL-2.3 | Replace console.log (processor.ts) | P1-High | 2h | QUAL-2.1 |
| QUAL-2.4 | Replace console.log (all remaining) | P1-High | 4h | QUAL-2.1 |

**Files to Create:**
- `src/core/logging/logger.ts`
- `src/core/logging/index.ts`

**Logging Configuration:**
```typescript
// Development: DEBUG level, pretty printing
// Production: INFO level, JSON structured
```

### 2.5 Performance Stream (AGENT-PERFORMANCE)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| PERF-2.1 | Implement async compression strategy | P1-High | 3h | None |
| PERF-2.2 | Add size-based compression thresholds | P1-High | 2h | PERF-2.1 |
| PERF-2.3 | Implement throttled cleanup for rate-limiter | P1-High | 2h | None |
| PERF-2.4 | Update rate-limiter.ts analytics cleanup | P1-High | 2h | PERF-2.3 |

**Performance Impact:**
- Cleanup queries: 100/sec → 1/hour (360,000x reduction)
- Event loop blocking: 50-100ms → <1ms

---

## Phase 3: Integration & Testing (Week 5-6)

**Goal:** Complete testing coverage and integrate changes

### 3.1 Security Stream (AGENT-SECURITY)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| SEC-3.1 | Implement environment-aware error handling | P2-Medium | 3h | ARCH-1.1 |
| SEC-3.2 | Sanitize stack traces in production | P2-Medium | 2h | SEC-3.1 |
| SEC-3.3 | Add error ID generation for support | P2-Medium | 1h | SEC-3.1 |

**Files to Modify:**
- `src/core/ai/gemini-client.ts` (lines 211-216)

### 3.2 Architecture Stream (AGENT-ARCHITECTURE)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| ARCH-3.1 | Update HighPerformanceCache with DI | P1-High | 4h | ARCH-2.* |
| ARCH-3.2 | Update RateLimiter with DI | P1-High | 4h | ARCH-2.* |
| ARCH-3.3 | Update AtomicFileOperations with DI | P1-High | 4h | ARCH-2.* |
| ARCH-3.4 | Add deprecation warnings to singletons | P1-High | 2h | ARCH-3.1-3 |

### 3.3 Testing Stream (AGENT-TESTING)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| TEST-3.1 | Processing pipeline integration tests | P1-High | 5h | TEST-2.* |
| TEST-3.2 | Cache + FileOps integration tests | P1-High | 4h | TEST-2.* |
| TEST-3.3 | AI service integration tests | P1-High | 6h | TEST-2.* |
| TEST-3.4 | Error handling E2E tests | P2-Medium | 4h | TEST-3.* |

### 3.4 Code Quality Stream (AGENT-QUALITY)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| QUAL-3.1 | Replace `any` types in ai-service.ts | P1-High | 3h | ARCH-1.2 |
| QUAL-3.2 | Replace `any` types in processor.ts | P1-High | 3h | ARCH-1.2 |
| QUAL-3.3 | Replace `any` types in validators | P1-High | 2h | ARCH-1.2 |
| QUAL-3.4 | Standardize error handling patterns | P1-High | 4h | ARCH-1.1 |

### 3.5 Performance Stream (AGENT-PERFORMANCE)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| PERF-3.1 | Remove unused dependencies | P1-High | 2h | None |
| PERF-3.2 | Replace axios with native fetch | P1-High | 3h | None |
| PERF-3.3 | Remove PDF support (defer to Phase 3) | P2-Medium | 2h | None |
| PERF-3.4 | Create performance benchmark suite | P2-Medium | 4h | None |

**Dependencies to Remove:**
```bash
bun remove dotenv dompurify pdf-parse pdf2pic
# Estimated bundle size reduction: 1.35MB
```

---

## Phase 4: Polish & Documentation (Week 7-8)

**Goal:** Complete documentation and establish maintenance processes

### 4.1 Security Stream (AGENT-SECURITY)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| SEC-4.1 | Implement improved file locking (optional) | P3-Low | 6h | None |
| SEC-4.2 | Add security monitoring utilities | P3-Low | 3h | None |
| SEC-4.3 | Create SECURITY.md documentation | P2-Medium | 2h | SEC-1-3.* |

### 4.2 Architecture Stream (AGENT-ARCHITECTURE)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| ARCH-4.1 | Update performance-system.ts with DI | P1-High | 4h | ARCH-3.* |
| ARCH-4.2 | Update core/index.ts with DI | P1-High | 4h | ARCH-3.* |
| ARCH-4.3 | Create migration guide documentation | P2-Medium | 4h | ARCH-4.1-2 |
| ARCH-4.4 | Create DI best practices guide | P2-Medium | 2h | ARCH-4.1-2 |

### 4.3 Testing Stream (AGENT-TESTING)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| TEST-4.1 | Configure GitHub Actions workflow | P1-High | 3h | TEST-3.* |
| TEST-4.2 | Add pre-commit hooks for tests | P2-Medium | 2h | TEST-4.1 |
| TEST-4.3 | Create coverage enforcement script | P2-Medium | 2h | TEST-4.1 |
| TEST-4.4 | Write test maintenance guidelines | P2-Medium | 2h | TEST-4.* |

### 4.4 Code Quality Stream (AGENT-QUALITY)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| QUAL-4.1 | Add JSDoc to ai-service.ts | P2-Medium | 3h | None |
| QUAL-4.2 | Add JSDoc to processor.ts | P2-Medium | 3h | None |
| QUAL-4.3 | Add JSDoc to validators | P2-Medium | 3h | None |
| QUAL-4.4 | Add JSDoc to types/index.ts | P2-Medium | 4h | None |
| QUAL-4.5 | Create REFACTORING_GUIDE.md | P2-Medium | 2h | QUAL-4.* |

### 4.5 Performance Stream (AGENT-PERFORMANCE)

| Task ID | Task | Priority | Effort | Dependencies |
|---------|------|----------|--------|--------------|
| PERF-4.1 | Create memory profiling script | P2-Medium | 4h | None |
| PERF-4.2 | Add memory leak tests | P2-Medium | 3h | PERF-4.1 |
| PERF-4.3 | Create performance validation tests | P2-Medium | 3h | PERF-3.4 |
| PERF-4.4 | Document performance baselines | P2-Medium | 2h | PERF-4.* |

---

## Orchestrator Agent Implementation Guide

### Role Description

The **Orchestrator Agent** coordinates the 5 specialized work streams, manages dependencies, and ensures parallel execution efficiency.

### Execution Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. INITIALIZATION                                                      │
│     ├─ Parse this action plan                                          │
│     ├─ Create task queue for each phase                                │
│     └─ Identify parallelizable tasks                                   │
│                                                                         │
│  2. PHASE EXECUTION                                                     │
│     ├─ Spawn specialized agents in parallel:                           │
│     │   ├─ AGENT-SECURITY                                              │
│     │   ├─ AGENT-ARCHITECTURE                                          │
│     │   ├─ AGENT-TESTING                                               │
│     │   ├─ AGENT-QUALITY                                               │
│     │   └─ AGENT-PERFORMANCE                                           │
│     ├─ Monitor task completion                                         │
│     └─ Manage cross-stream dependencies                                │
│                                                                         │
│  3. DEPENDENCY MANAGEMENT                                               │
│     ├─ Block tasks until dependencies complete                         │
│     ├─ Re-prioritize based on blockers                                 │
│     └─ Aggregate results for next phase                                │
│                                                                         │
│  4. VALIDATION                                                          │
│     ├─ Run tests after each phase                                      │
│     ├─ Verify coverage thresholds                                      │
│     └─ Confirm phase exit criteria                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Agent Specialization Matrix

| Agent | Primary Focus | Key Skills | Files Owned |
|-------|---------------|------------|-------------|
| AGENT-SECURITY | SSRF, API key, auth | Security patterns, validation | `validators/*`, `gemini-client.ts` |
| AGENT-ARCHITECTURE | DI, error handling | Design patterns, TypeScript | `app-context.ts`, `errors/*`, `factories/*` |
| AGENT-TESTING | Unit/Integration tests | Testing patterns, mocking | `tests/*` |
| AGENT-QUALITY | Logging, constants, docs | Refactoring, documentation | `logging/*`, `constants/*` |
| AGENT-PERFORMANCE | Optimization, profiling | Algorithms, benchmarking | `utils/*`, `performance.ts` |

### Parallel Execution Opportunities

**Phase 1 - Maximum Parallelism:**
```
PARALLEL: [SEC-1.1] [ARCH-1.1] [TEST-1.1] [QUAL-1.1] [PERF-1.1]
PARALLEL: [SEC-1.2] [ARCH-1.2] [TEST-1.2] [QUAL-1.2] [PERF-1.2]
SERIAL:   [SEC-1.3] → depends on SEC-1.1
SERIAL:   [PERF-1.3] → depends on PERF-1.1
```

**Phase 2 - Cross-Stream Dependencies:**
```
ARCH-2.2 (AppContext) → blocks ARCH-3.* (Service Migration)
TEST-1.* (Mocks) → blocks TEST-2.* (Unit Tests)
QUAL-2.1 (Logger) → blocks QUAL-2.2-4 (Console Replacement)
```

### Task Execution Template

For each task, the orchestrator should:

```markdown
## Executing Task: [TASK-ID]

### Pre-Conditions
- [ ] All dependencies completed: [LIST]
- [ ] Required files exist: [LIST]
- [ ] Tests passing: `bun test`

### Execution
1. Spawn appropriate agent: `AGENT-[TYPE]`
2. Provide task-specific prompt with:
   - File locations from this plan
   - Implementation notes
   - Expected deliverables
3. Monitor for completion

### Post-Conditions
- [ ] New files created: [LIST]
- [ ] Modified files updated: [LIST]
- [ ] Tests added/updated: [LIST]
- [ ] All tests passing: `bun test`

### Handoff
- Update task status: COMPLETED
- Unblock dependent tasks: [LIST]
```

### Phase Exit Criteria

| Phase | Exit Criteria |
|-------|---------------|
| Phase 1 | SSRF protection active, error hierarchy implemented, mocks created, constants defined, CircularBuffer working |
| Phase 2 | DI container functional, 80% test coverage, logging operational, performance optimizations deployed |
| Phase 3 | All services migrated to DI, integration tests passing, `any` types eliminated, dependencies cleaned |
| Phase 4 | Documentation complete, CI/CD configured, coverage enforced, performance baselines established |

### Error Recovery Strategy

```typescript
if (task.failed) {
  // 1. Capture failure details
  const failure = {
    taskId: task.id,
    error: task.error,
    attempt: task.attempt,
    files: task.affectedFiles
  };

  // 2. Determine recovery action
  if (failure.attempt < 3) {
    // Retry with more context
    retryTask(task, { includeFullContext: true });
  } else if (task.priority === 'P0-Critical') {
    // Escalate to orchestrator
    escalate(failure, { blockPhase: true });
  } else {
    // Defer non-critical tasks
    deferTask(task, { reason: failure.error });
  }
}
```

---

## Success Metrics

### Code Quality Targets

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Test Coverage | ~20% | 80% | `bun test --coverage` |
| TypeScript `any` | 25+ | 0 | `grep "any" src/` |
| Console statements | 27 | 0 | `grep "console\." src/` |
| JSDoc Coverage | ~30% | 100% | Public API methods |
| Magic Numbers | 15+ | 0 | Defined in constants |

### Performance Targets

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Startup Time | 15ms | <100ms | ✅ Already Exceeds |
| Metric Recording | O(n) | O(1) | CircularBuffer |
| Cleanup Queries | 100/sec | 1/hour | Throttled cleanup |
| Bundle Size | ~3.5MB | <2.5MB | Dependency cleanup |
| Event Loop Block | 50-100ms | <10ms | Async compression |

### Security Targets

| Control | Status | Target |
|---------|--------|--------|
| SSRF Protection | Missing | Implemented |
| API Key Validation | Consumes quota | Format-only |
| Stack Trace Exposure | All environments | Production-safe |
| User-Agent | Spoofed | Transparent |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking existing code | Medium | High | Backwards-compatible approach, comprehensive testing |
| Performance regression | Low | Medium | Benchmark before/after, validate with tests |
| Test gaps | Medium | Medium | Code review, coverage enforcement |
| DI adoption friction | Medium | Low | Clear documentation, migration guide |
| Scope creep | Medium | Medium | Stick to review recommendations only |

---

## File Manifest

### New Files to Create (34 files)

**Core Infrastructure:**
- `src/core/app-context.ts`
- `src/core/errors/error-hierarchy.ts`
- `src/core/errors/index.ts`
- `src/core/utils/type-guards.ts`
- `src/core/utils/circular-buffer.ts`
- `src/core/constants/index.ts`
- `src/core/logging/logger.ts`
- `src/core/logging/index.ts`
- `src/core/validators/ssrf-protection.ts`
- `src/core/factories/index.ts`
- `src/core/factories/performance-factory.ts`
- `src/core/factories/cache-factory.ts`
- `src/core/factories/rate-limiter-factory.ts`
- `src/core/factories/file-ops-factory.ts`

**Testing Infrastructure:**
- `tests/mocks/gemini-mock.ts`
- `tests/mocks/network-mock.ts`
- `tests/mocks/filesystem-mock.ts`
- `tests/mocks/database-mock.ts`
- `tests/utils/test-helpers.ts`
- `tests/utils/assertion-helpers.ts`
- `tests/unit/core/processor.test.ts`
- `tests/unit/core/cache.test.ts`
- `tests/unit/core/rate-limiter.test.ts`
- `tests/unit/core/file-operations.test.ts`
- `tests/integration/processing-pipeline.test.ts`
- `tests/integration/ai-pipeline.test.ts`
- `tests/memory-leak.test.ts`
- `tests/performance.bench.ts`
- `tests/performance-validation.test.ts`

**Documentation:**
- `docs/REFACTORING_GUIDE.md`
- `docs/DI_MIGRATION.md`
- `SECURITY.md`

**Scripts:**
- `scripts/memory-profile.ts`
- `scripts/dependency-cleanup.sh`

### Files to Modify (18 files)

- `src/core/validators/index.ts`
- `src/core/ai/content-analyzer.ts`
- `src/core/ai/gemini-client.ts`
- `src/core/ai/ai-service.ts`
- `src/core/processor.ts`
- `src/core/index.ts`
- `src/core/cache/cache.ts`
- `src/core/rate-limit/rate-limiter.ts`
- `src/core/storage/file-operations.ts`
- `src/core/performance.ts`
- `src/core/performance-system.ts`
- `src/core/formatters/index.ts`
- `src/core/types/index.ts`
- `tests/ai-integration.test.ts`
- `tests/environment.test.ts`
- `tests/setup.ts`
- `package.json`
- `.github/workflows/test.yml` (create if not exists)

---

## Quick Reference Commands

```bash
# Run tests
bun test

# Check coverage
bun test --coverage

# Type check
bun run tsc --noEmit

# Find any types
grep -rn "any" src/ --include="*.ts" | grep -v node_modules

# Find console statements
grep -rn "console\." src/ --include="*.ts"

# Find magic numbers (simplified)
grep -rE "[^a-zA-Z0-9_][0-9]{4,}[^a-zA-Z0-9_]" src/ --include="*.ts"

# Run benchmarks
bun test tests/performance.bench.ts

# Memory profiling
bun run scripts/memory-profile.ts

# Dependency cleanup
bash scripts/dependency-cleanup.sh
```

---

## Timeline Summary

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1-2 | Foundation | SSRF protection, error hierarchy, mocks, constants, CircularBuffer |
| 3-4 | Core | DI container, 80% coverage, logging, async compression |
| 5-6 | Integration | Service migration, integration tests, type safety, dependency cleanup |
| 7-8 | Polish | Documentation, CI/CD, JSDoc, performance baselines |

**Total Estimated Effort:** ~300 hours
**Parallel Efficiency Gain:** ~40% (with 5 agents)
**Effective Timeline:** 8 weeks sequential → 5 weeks parallel

---

*This action plan was generated by analyzing the Claude Opus 4 Code Review and synthesizing recommendations from 5 specialized domain agents.*

*Document Version: 1.0*
*Created: November 27, 2025*
*Status: Ready for Implementation*

# Architecture Decision Records (ADRs)

This document tracks key architectural decisions made during the development of Obsidianize TUI.

---

## ADR-001: In-Memory Job Storage for MVP

**Date:** November 2025
**Status:** Accepted
**Context:** Processing jobs need to be tracked for status polling and result retrieval.

### Decision

Use in-memory `Map<string, Job>` storage for the MVP phase instead of persistent storage (Redis, PostgreSQL, SQLite).

### Rationale

1. **Simplicity**: No external dependencies or infrastructure required
2. **Performance**: Sub-millisecond access times for job lookups
3. **MVP Scope**: Single-instance deployment is acceptable for initial release
4. **Development Speed**: Faster iteration without database schema management

### Consequences

**Positive:**
- Zero configuration required for job storage
- No database connection management
- Instant startup without migration steps

**Negative:**
- Jobs lost on server restart
- Not suitable for horizontal scaling (multiple instances)
- Memory growth if jobs not cleaned up

### Mitigations

1. **Automatic Cleanup**: Jobs older than 1 hour are automatically purged every 10 minutes
2. **Graceful Shutdown**: SIGINT/SIGTERM handlers in `performance-system.ts` ensure clean shutdown
3. **Memory Monitoring**: Job count included in `/api/health` endpoint

### Future Considerations

For production horizontal scaling, migrate to:
- **Redis**: For distributed caching with TTL support
- **PostgreSQL**: For persistent job history and analytics
- **SQLite**: For single-instance persistence without external deps

### Implementation

```typescript
// Current: src/web/server/routes.ts (line 51)
const jobs = new Map<string, JobStatus>();

// Cleanup function (lines 58-67)
function cleanupOldJobs(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt.getTime() < oneHourAgo) {
      jobs.delete(id);
      logger.debug(`Cleaned up old job: ${id}`);
    }
  }
}

// Cleanup interval: 10 minutes (line 70)
setInterval(cleanupOldJobs, 10 * 60 * 1000);
```

---

## ADR-002: Native Fetch Over Axios

**Date:** November 2025
**Status:** Accepted
**Context:** HTTP client selection for external API calls.

### Decision

Use Bun's native `fetch()` API instead of axios or node-fetch.

### Rationale

1. **Agent Constitution Compliance**: "No need for axios or node-fetch"
2. **Zero Dependencies**: Native API requires no additional packages
3. **Performance**: Bun's fetch is highly optimized
4. **Standards Compliance**: Uses Web Fetch API standard

### Implementation

```typescript
// Timeout handling with AbortController
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);

try {
  const response = await fetch(url, { signal: controller.signal });
  const text = await response.text(); // Read body within timeout
  return { ok: response.ok, status: response.status, text };
} finally {
  clearTimeout(timeoutId);
}
```

---

## ADR-003: Native .env Support Over Dotenv

**Date:** November 2025
**Status:** Accepted
**Context:** Environment variable loading mechanism.

### Decision

Use Bun's native `.env` file loading instead of the dotenv package.

### Rationale

1. **Built-in Feature**: Bun automatically loads `.env` files at startup
2. **Zero Dependencies**: No additional package required
3. **Consistency**: Aligns with Bun-native approach

### Notes

- Bun loads `.env` files automatically without any configuration
- Environment validator updated to work without dotenv dependency
- Test harness uses `skipFileCheck` option for CI environments

---

## ADR-004: Vitest for Testing

**Date:** October 2024
**Status:** Accepted
**Context:** Test framework selection.

### Decision

Use Vitest as the primary test framework alongside Bun's built-in test runner.

### Rationale

1. **Compatibility**: Works seamlessly with Bun runtime
2. **Features**: Rich assertion library, mocking, coverage
3. **Speed**: Fast execution with hot module replacement
4. **TypeScript**: First-class TypeScript support

### Current Stats

- **375+ tests** passing
- **850+ assertions**
- **11 test files** across unit and integration suites

---

## Template for New ADRs

```markdown
## ADR-XXX: [Title]

**Date:** [YYYY-MM]
**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Context:** [Brief description of the problem]

### Decision

[What was decided]

### Rationale

[Why this decision was made]

### Consequences

**Positive:**
- [Benefit 1]

**Negative:**
- [Drawback 1]

### Mitigations

[How negative consequences are addressed]
```

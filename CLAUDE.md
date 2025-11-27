# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Obsidianize** is a dual-target application that transforms web content (YouTube videos, articles, papers) into structured Markdown notes using Google Gemini AI. The project delivers both a Web TUI interface and a native CLI interface that share the same AI-powered processing engine.

**Current Status**: Opus Review Complete ✅ | Ready for Phase 2 - Web TUI Interface
**Main Branch**: `phase-1-core-infrastructure`
**Performance**: 15ms startup (vs <100ms target) 🚀
**Testing Gate**: PASSED - 257+ unit tests, comprehensive test infrastructure
**Code Quality**: Opus Review Phases 1-4 COMPLETE

## Development Commands

### Core Development Workflow
```bash
# Development server with hot reloading
bun dev

# Production server
bun start

# Run tests
bun test

# Build for production
bun build
```

### Bun-Specific Commands
```bash
# Install dependencies (Bun package manager)
bun install

# Run with hot module replacement
bun --hot index.ts

# Built-in test runner
bun test --watch

# Performance benchmarking
bun test --bench
```

## Architecture Overview

### Dual-Target System Design
This project implements a **shared-core, dual-interface** architecture:

1. **Web TUI Interface** - Browser-based terminal simulation (Primary MVP)
2. **Native CLI Interface** - True command-line tool (Secondary target)

Both interfaces share identical AI processing capabilities through a common core library.

### Planned Structure (Implementation Phase)
```
src/
├── core/                     # Shared AI processing engine
│   ├── ai/                   # Gemini API integration
│   ├── auth/                 # API key management
│   ├── content/              # Content processing pipeline
│   └── types/                # Shared TypeScript types
├── web/                      # Web TUI interface
│   ├── server/               # Bun server endpoints
│   ├── ui/                   # Web UI components
│   └── security/             # Client-side encryption
└── cli/                      # CLI interface (future phase)
    ├── config/               # CLI configuration
    ├── commands/             # CLI commands
    └── setup/                # CLI setup workflows
```

### ✅ Phase 1 Implementation (COMPLETED)
- **Entry Point**: `index.ts` - Bun server with ASCII art header and core integration
- **Core Infrastructure**: Complete AI processing engine with Gemini integration
- **Dependencies**: Full stack with AI, validation, caching, and performance monitoring
- **Styling**: Terminal-first CSS with authentic TUI aesthetics preserved
- **ASCII Art**: "OBSIDIANIZE" with "ANSI Shadow" font (non-negotiable, preserved)
- **Performance System**: SQLite caching, rate limiting, atomic file operations
- **Testing**: Comprehensive test suite with 100% pass rate

## Technology Stack

### Core Runtime
- **Runtime**: Bun.js (NOT Node.js) - Ultra-fast TypeScript execution
- **Language**: TypeScript with ES2022+ target and strict types
- **Module System**: ESM-first, native ES modules
- **Build System**: Bun's native bundling and TypeScript execution

### Key Dependencies (Current - Phase 1 Complete)
```json
{
  "@google/generative-ai": "^0.24.1",        // Gemini API client ✅
  "axios": "^1.12.2",                         // HTTP client ✅
  "marked": "^16.4.0",                        // Markdown processing ✅
  "yaml": "^2.8.1",                           // YAML frontmatter ✅
  "zod": "^4.1.12",                           // Runtime validation ✅
  "figlet": "^1.7.0",                         // ASCII art generation ✅
  "chalk": "^5.6.2",                          // Terminal colors ✅
  "dompurify": "^3.2.7",                      // HTML sanitization ✅
  "dotenv": "^17.2.3",                        // Environment variables ✅
  "gray-matter": "^4.0.3",                    // Frontmatter parsing ✅
  "cheerio": "^1.1.2",                        // Web scraping ✅
  "pdf-parse": "^2.2.9",                      // PDF processing ✅
  "vitest": "^3.2.4"                          // Test runner ✅
}
```

## Development Guidelines

### Bun-Specific Optimizations
- Use Bun's native `fetch()` instead of axios/node-fetch
- Leverage Bun's built-in SQLite for caching
- Use Bun's WebSockets for real-time progress updates
- Take advantage of Bun's fast bundling for CLI distribution

### Performance Targets
- **Web server startup**: <100ms
- **CLI cold start**: <100ms
- **Build time**: <1s for production
- **Memory baseline**: <50MB
- **Hot reload**: <50ms

### Code Organization Standards
- One component per file
- Export interfaces alongside implementations
- Use barrel exports (`index.ts`) for clean imports
- Follow ESM module patterns exclusively
- Keep side effects minimal and explicit

## AI Integration Strategy

### Google Gemini API
- **Primary Tool**: Google Gemini API with extended YouTube capabilities
- **Content Analysis**: Deep understanding of video content, transcripts, and metadata
- **Output Format**: "Gemini Gem" format with YAML frontmatter and structured sections

### API Key Management
- **Development Phase**: Environment variables (`GEMINI_API_KEY`)
- **Production Phase**: User-provided keys with client-side encryption
- **Security**: No server-side key storage, encrypted local storage only

### Rate Limiting
- Intelligent rate limiting with graceful degradation
- Usage monitoring and cost estimation
- Fallback processing when API unavailable

## Implementation Phases

### ✅ Phase 1: Core Infrastructure & AI Engine (COMPLETED)
**Goal**: Complete foundation with AI-powered processing and performance systems

**✅ Week 1**: Gemini AI integration setup (Agent B)
- ✅ Gemini API client with retry logic and error handling
- ✅ Content analysis pipeline for YouTube, articles, PDFs, podcasts
- ✅ Prompt engineering system with "Gemini Gem" format templates

**✅ Week 2**: Core AI processing engine (Agents B, C, D)
- ✅ Complete TypeScript type system with strict validation
- ✅ Content formatting engine with YAML frontmatter generation
- ✅ High-performance SQLite caching and atomic file operations
- ✅ Token bucket rate limiting and performance monitoring

**✅ Week 3**: Environment & build setup (Agent A)
- ✅ Bun.js runtime optimization and build configuration
- ✅ Comprehensive testing infrastructure with Vitest
- ✅ Environment validation and dependency management
- ✅ Performance targets exceeded (15ms startup vs <100ms target)

### 🔄 Phase 2: Web TUI Interface (Ready to Begin)
**Goal**: Complete functional web interface with terminal aesthetics

- Week 4: Terminal UI components and authentic styling
- Week 5: Web server with API endpoints and WebSocket support
- Week 6: Client application with security and file downloads

### ⏳ Phase 3: Enhanced Features & Mobile (Planned)
- Advanced AI features and production readiness
- Responsive design and mobile optimization
- Performance optimization and deployment preparation

### ⏳ Phase 4: CLI Implementation & Polish (Planned)
- Native terminal interface with full AI capabilities
- Documentation, examples, and distribution setup
- Performance optimization and production release

## Security Considerations

### API Key Security
- API keys never stored on server
- Client-side encryption for web interface
- Encrypted config files for CLI
- File permissions restricted (600) for CLI config

### Data Protection
- HTTPS enforced for all web traffic
- Input validation on all user-provided data
- Memory cleared after processing sensitive data
- Error messages don't leak sensitive information

## Testing Strategy

### Test Structure
```
tests/
├── unit/                    # Isolated component tests
├── integration/             # Component interaction tests
├── e2e/                    # End-to-end workflow tests
├── performance/            # Performance benchmarks
└── fixtures/               # Test data and mocks
```

### Mock Strategy for AI Testing
- Mock Gemini responses for consistent testing
- Pre-generated responses from fixtures
- Simulate processing time for realistic testing
- Real API tests in separate integration suite

## Documentation References

### Planning Documents (Complete)
- **[High-Level Plan](./warp_planning/HIGH_LEVEL_PLAN.md)**: Complete architecture & development strategy
- **[Design Document](./warp_planning/DESIGN_DOCUMENT.md)**: Detailed technical specifications
- **[API Specifications](./warp_planning/API_SPECIFICATIONS.md)**: Complete API definitions
- **[Security Architecture](./warp_planning/SECURITY_ARCHITECTURE.md)**: Enterprise-grade security
- **[Development Setup](./warp_planning/DEVELOPMENT_SETUP.md)**: Developer environment guide

### Key Design Decisions
- **Bun.js over Node.js**: For performance and developer experience
- **Dual-target approach**: Web interface first, CLI second
- **Shared core architecture**: Maximum code reuse between targets
- **AI-powered processing**: Gemini integration for intelligent content analysis
- **Terminal aesthetic**: Authentic TUI look and feel

## Success Metrics

### Technical Requirements
- **Performance**: Sub-100ms startup, <10s AI processing
- **Reliability**: <1% failure rate for valid inputs
- **Security**: Zero API key exposure incidents
- **Quality**: AI output >85% accuracy vs human evaluation
- **Compatibility**: Works across macOS, Linux, Windows

### Current Implementation Status
✅ Complete core infrastructure with AI integration
✅ Gemini API integration with multi-content support
✅ High-performance caching and rate limiting
✅ Comprehensive testing infrastructure
✅ Performance targets exceeded (15ms startup)
✅ TypeScript compilation and validation
✅ All Phase 1 deliverables completed

---

## Opus Review Implementation Status

The Opus-4.5 code review identified areas for improvement. Implementation is organized into phases:

### ✅ Opus Review Phase 1: Foundation & Critical Fixes (COMPLETED)
Based on `ACTION_PLAN_OPUS_REVIEW.md` recommendations:

**Security (SEC-1.x):**
- ✅ SSRF Protection: `src/core/validators/ssrf-protection.ts` - Comprehensive IP range blocking, internal network protection
- ✅ SSRF integrated into URLValidator with automatic validation

**Architecture (ARCH-1.x):**
- ✅ Error Hierarchy: `src/core/errors/error-hierarchy.ts` - Base ObsidianizeError with specialized error types (NetworkError, ValidationError, AuthError, AIProcessingError, etc.)
- ✅ Error exports with type guards and utility functions: `src/core/errors/index.ts`
- ✅ Fixed require() to ES imports in `processor.ts` and `index.ts`

**Quality (QUAL-1.x):**
- ✅ Constants file: `src/core/constants/index.ts` - Centralized TIME, SIZE, RATE_LIMIT, PERFORMANCE, RETRY, AI, VALIDATION, HTTP_STATUS constants
- ✅ Magic numbers replaced with named constants in `performance.ts`

**Performance (PERF-1.x):**
- ✅ CircularBuffer: `src/core/utils/circular-buffer.ts` - O(1) push operations with NumericCircularBuffer for statistics
- ✅ Performance.ts updated to use CircularBuffer instead of O(n) array shifts

### ✅ Opus Review Phase 2: Core Improvements (COMPLETED)
**Quality (QUAL-2.x):**
- ✅ Logging Framework: `src/core/logging/logger.ts` - Structured logging with levels, colors, JSON output for production
- ✅ Logging exports: `src/core/logging/index.ts`

**Architecture (ARCH-2.x):**
- ✅ DI Container: `src/core/app-context.ts` - Application context with lazy service initialization
- ✅ Exported classes for DI: HighPerformanceCache, RateLimiter, AtomicFileOperations, PerformanceMonitor

### ✅ Opus Review Phase 3: Testing & Integration (COMPLETED)
**Testing Infrastructure:**
- ✅ Unit tests for all new modules: 257 tests, 597 assertions
  - `tests/unit/ssrf-protection.test.ts` - 56 tests for SSRF protection
  - `tests/unit/error-hierarchy.test.ts` - 37 tests for error classes
  - `tests/unit/circular-buffer.test.ts` - 67 tests for CircularBuffer
  - `tests/unit/logger.test.ts` - 47 tests for logging framework
  - `tests/unit/api-key-validator.test.ts` - 50 tests for API key validation
- ✅ Mock factories: `tests/mocks/factories.ts`
  - GeminiMockFactory, NetworkMockFactory, FileSystemMockFactory, DatabaseMockFactory, ProcessingMockFactory
- ✅ Test helpers: `tests/utils/test-helpers.ts`
  - createTestContext, withTimeout, expectError, mockEnv, cleanupAfterTest
- ✅ Test documentation: `tests/README.md`, `tests/QUICK_REFERENCE.md`

### ✅ Opus Review Phase 4: Polish & Production (COMPLETED)
**Security:**
- ✅ API Key format validation (SEC-2.1): `src/core/validators/api-key-validator.ts`
  - Format-only validation without API quota consumption
  - Rate limiting for validation attempts
  - Placeholder detection and sanitization

**Quality:**
- ✅ Logging framework integrated throughout codebase (11 files updated)
  - All console.log/error/warn replaced with structured logger
  - Module-specific loggers for filtering
  - JSON output for production, pretty output for development

**Files Created in Phase 3 & 4:**
```
src/core/validators/
└── api-key-validator.ts      # API key format validation (SEC-2.1)

tests/
├── unit/
│   ├── ssrf-protection.test.ts
│   ├── error-hierarchy.test.ts
│   ├── circular-buffer.test.ts
│   ├── logger.test.ts
│   └── api-key-validator.test.ts
├── mocks/
│   ├── factories.ts          # Mock factories
│   └── index.ts
├── utils/
│   ├── test-helpers.ts       # Test utilities
│   └── index.ts
├── README.md                 # Test documentation
├── QUICK_REFERENCE.md        # Developer cheat sheet
└── example-usage.test.ts     # Usage examples
```

**Files Modified for Logging Integration:**
- `src/core/ai/ai-service.ts`
- `src/core/ai/gemini-client.ts`
- `src/core/ai/content-analyzer.ts`
- `src/core/ai/response-processor.ts`
- `src/core/cache/cache.ts`
- `src/core/rate-limit/rate-limiter.ts`
- `src/core/storage/file-operations.ts`
- `src/core/performance.ts`
- `src/core/performance-system.ts`
- `src/core/processor.ts`
- `src/core/validators/index.ts`

---

## 📋 Next Agent Instructions - Phase 2: Web TUI Interface

**Prerequisites:**
```bash
# Install dependencies (use npm if bun has proxy issues)
npm install
# or
bun install

# Run tests to verify everything works
bun test
```

**Phase 2: Web TUI Interface Development**
Reference: Main project Phase 2 in Implementation Phases section

**Week 4: Terminal UI Components**
- [ ] Create terminal-style UI components in `src/web/ui/`
- [ ] Implement ASCII art header display (preserve "ANSI Shadow" font)
- [ ] Build input form with terminal aesthetics
- [ ] Add progress indicators and status displays
- [ ] Create output display with markdown rendering

**Week 5: Web Server & API Endpoints**
- [ ] Expand `index.ts` with full API routes
- [ ] Implement `/api/process` endpoint for content processing
- [ ] Add WebSocket support for real-time progress updates
- [ ] Create `/api/health` and `/api/status` endpoints
- [ ] Implement CORS and security middleware

**Week 6: Client Application & Security**
- [ ] Build client-side API key encryption
- [ ] Implement file download functionality
- [ ] Add local storage for user preferences
- [ ] Create responsive terminal layout
- [ ] Add error handling and user feedback

**Key Files to Create:**
```
src/web/
├── server/
│   ├── routes.ts             # API route definitions
│   ├── middleware.ts         # CORS, auth, rate limiting
│   └── websocket.ts          # WebSocket handler
├── ui/
│   ├── components/           # Terminal UI components
│   ├── styles/               # Terminal CSS
│   └── index.html            # Main HTML template
└── security/
    └── encryption.ts         # Client-side key encryption
```

**Design Requirements:**
- Preserve authentic terminal/TUI aesthetic
- ASCII art header is NON-NEGOTIABLE
- Dark theme with terminal colors (green on black style)
- Monospace fonts throughout
- Keyboard navigation support

---

**Key Achievement**: All Opus Review phases complete (1-4). The codebase now has:
- Comprehensive error handling with typed error hierarchy
- SSRF protection and security validations
- O(1) performance for metric recording
- Structured logging throughout
- 257+ unit tests with mock infrastructure
- API key format validation without quota consumption

**Test Results**: 257 pass, 0 fail, 597 assertions

**Next Phase**: Begin Web TUI Interface Development (Phase 2)
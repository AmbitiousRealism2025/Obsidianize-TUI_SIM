# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Obsidianize** is a dual-target application that transforms web content (YouTube videos, articles, papers) into structured Markdown notes using Google Gemini AI. The project delivers both a Web TUI interface and a native CLI interface that share the same AI-powered processing engine.

**Current Status**: Phase 1 - Core Infrastructure & AI Engine ✅ COMPLETED
**Main Branch**: `phase-1-core-infrastructure`
**Performance**: 15ms startup (vs <100ms target) 🚀
**Testing Gate**: PASSED with comprehensive fixes applied

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

**Key Achievement**: Phase 1 complete with exceptional performance - 15ms startup vs <100ms target, comprehensive AI integration, and robust infrastructure foundation. The system successfully transforms from concept to production-ready core with Google Gemini AI integration.

**Next Phase**: Begin Phase 2 - Web TUI Interface Development (Ready to start)
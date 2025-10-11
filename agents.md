# Obsidianize TUI - Agent Context Document

## 🚨 MANDATORY FIRST READ: AGENT CONSTITUTION

**BEFORE READING THIS DOCUMENT OR BEGINNING ANY WORK:**

1. **READ** the [Agent Constitution](./AGENT_CONSTITUTION.md) in its entirety
2. **ACKNOWLEDGE** understanding and agreement to follow all constitution principles
3. **REFERENCE** the constitution whenever conflicts or questions arise

**The Agent Constitution establishes fundamental rules that ALL agents must follow. It takes precedence over individual project requirements when conflicts arise.**

---

## Overview

This document contains all essential context for agents working on the **Obsidianize TUI** project. Read this document AFTER reviewing the Agent Constitution.

## Project Identity

**Name**: Obsidianize  
**Tagline**: "✨ Your Knowledge, Crystallized ✨"  
**Purpose**: AI-powered content processor that transforms web content into structured Markdown notes  
**Format**: "Gemini Gem" format with YAML frontmatter and structured sections

## Current Project Status

**Phase**: Phase 1 - Core Infrastructure & AI Engine ✅
**Location**: `/Users/ambrealismwork/Desktop/Coding-Projects/Obsidianize-TUI_SIM`
**Status**: COMPLETED - All 4 development agents successfully delivered core infrastructure
**Performance**: Exceeds all targets (15ms startup vs <100ms target)
**Testing Gate**: PASSED with comprehensive fixes applied
**Next Phase**: Phase 2 - Web TUI Interface (Ready to begin)

### ✅ Phase 1 Agent Results
- **Agent A (Environment)**: ✅ Complete - Environment, build setup, testing infrastructure
- **Agent B (AI Integration)**: ✅ Complete - Gemini API, content analysis, prompt engineering
- **Agent C (Data Models)**: ✅ Complete - TypeScript types, formatters, validation framework
- **Agent D (Storage/Performance)**: ✅ Complete - Caching, file operations, rate limiting
- **Jules Test Agent**: ✅ Complete - Testing gate execution and validation

## Dual-Target Architecture

### Target 1: Web TUI Interface (Primary - MVP)
- **Browser-based terminal simulation** with authentic terminal aesthetics
- Real-time AI processing with visual progress indicators  
- Interactive markdown preview and one-click downloads
- Secure client-side API key management
- Mobile-responsive while maintaining terminal feel

### Target 2: Native Terminal CLI (Secondary)
- **True command-line interface** for power users
- Sub-100ms cold start performance
- Batch processing and shell integration
- Single-file executable distribution
- Advanced automation support

**Development Strategy**: Build Web TUI MVP first (Weeks 1-5), then extract shared core (Week 6), then implement CLI (Weeks 7-9).

## Core Technology Stack

### Runtime & Language
- **Runtime**: Bun.js (NOT Node.js - this is critical)
- **Language**: TypeScript with ES2022+ target
- **Module System**: ESM-first, native ES modules
- **Configuration**: Uses Bun's native bundling and TypeScript execution

### Key Dependencies (Current)
```json
{
  "figlet": "^1.7.0",           // ASCII art generation - ALREADY INTEGRATED
  "chalk": "^5.6.2",            // Terminal colors
  "@types/figlet": "^1.5.8"     // TypeScript support
}
```

### Additional Dependencies (Planned)
```json
{
  "@google-ai/generativelanguage": "^latest", // Gemini API client
  "marked": "^latest",          // Markdown processing
  "yaml": "^latest",            // YAML frontmatter
  "dompurify": "^latest",       // HTML sanitization
  "dotenv": "^latest",          // Environment variables
  "bcrypt": "^latest",          // API key encryption
  "zod": "^latest"             // Type validation
}
```

## AI Integration Strategy

### Primary AI Engine
**Google Gemini API** with extended YouTube capabilities
- Content analysis with deep understanding of video/audio/text
- Structured output generation (summaries, key points, insights)
- Multi-format support (YouTube, articles, papers, talks, podcasts)
- Context preservation across long-form content

### API Key Management
**Development Phase**: Use developer's personal Gemini API key via `.env`
```bash
GEMINI_API_KEY=your_key_here
```

**Production Phase**: Two-tier approach:
1. **User-provided keys** (primary recommendation)
2. **Service-provided keys** (optional premium tier)

### Security Requirements
- **Web Interface**: Client-side encryption, no server storage of keys
- **CLI Interface**: Encrypted config files, environment variable support
- **Rate Limiting**: Intelligent usage monitoring and graceful degradation

## Current Project Foundation

### Existing ASCII Art Implementation
The project already has a beautiful ASCII art header using figlet:

**Font**: "ANSI Shadow"  
**Implementation**: In `index.ts` using figlet library  
**Current Styling**: Purple terminal theme with box-drawing characters

```
 ██████╗ ██████╗ ███████╗██╗██████╗ ██╗ █████╗ ███╗   ██╗██╗███████╗███████╗
██╔═══██╗██╔══██╗██╔════╝██║██╔══██╗██║██╔══██╗████╗  ██║██║╚══███╔╝██╔════╝
██║   ██║██████╔╝███████╗██║██║  ██║██║███████║██╔██╗ ██║██║  ███╔╝ █████╗  
██║   ██║██╔══██╗╚════██║██║██║  ██║██║██╔══██║██║╚██╗██║██║ ███╔╝  ██╔══╝  
╚██████╔╝██████╔╝███████║██║██████╔╝██║██║  ██║██║ ╚████║╄
```

**IMPORTANT**: This ASCII header MUST be preserved and used as the primary branding element.

### Existing Color Palette
```css
:root {
  --bg-primary: #0f0f23;      /* Dark background */
  --terminal-border: #c084fc;  /* Purple border */
  --ascii-art: #9b59d0;       /* Purple ASCII art */
  --tagline: #d8b4fe;         /* Light purple tagline */
}
```

### Current File Structure
```
Obsidianize-TUI_SIM/
├── index.ts                 # Current Bun server with ASCII art
├── package.json             # Bun + TypeScript setup
├── tsconfig.json           # TypeScript configuration
├── ASCII_ART_STYLE_GUIDE.md # Terminal aesthetic guidelines
├── warp_planning/           # 📋 COMPLETE planning documentation
│   ├── README.md           # Planning documentation index
│   ├── HIGH_LEVEL_PLAN.md  # Complete architecture document
│   ├── DESIGN_DOCUMENT.md  # Detailed system design
│   ├── API_SPECIFICATIONS.md # Complete API definitions
│   ├── DEVELOPMENT_SETUP.md # Developer environment setup
│   └── SECURITY_ARCHITECTURE.md # Security implementation
├── Kiro_planning/           # Original requirements (reference)
│   ├── requirements.md      # Original detailed requirements
│   ├── design.md           # Original technical design
│   └── tasks.md            # Original implementation plan
├── README.md               # Updated project overview
└── agents.md               # This document (updated)
```

## Bun-Specific Performance Requirements

### Critical Bun Advantages to Leverage
- **Sub-100ms startup times** (both web server and CLI)
- **Native TypeScript execution** (no compilation step needed)
- **Built-in bundling** for single-file executables
- **4x faster HTTP server** compared to Node.js
- **Memory efficiency** for large content processing

### Bun-Native Features to Use
1. **Built-in SQLite**: For AI response caching and rate limiting
2. **Native fetch()**: No need for axios or node-fetch
3. **Web Streams**: Efficient processing of large content
4. **Built-in WebSockets**: Real-time progress updates
5. **File System APIs**: Fast file operations for CLI
6. **Crypto APIs**: Built-in encryption for API key storage

### Performance Targets
- **Web server startup**: <100ms
- **CLI cold start**: <100ms  
- **Build time**: <1s for production
- **Memory baseline**: <50MB
- **Hot reload**: <50ms

## Content Processing Requirements

### Supported Content Types
1. **YouTube Videos** (primary focus)
2. **Web Articles** and blog posts
3. **Academic Papers** (PDFs and web-based)
4. **Talks/Presentations** (video or text-based)
5. **Podcasts** (audio with transcripts)

### Output Format: "Gemini Gem" Structure

#### YAML Frontmatter (Required Fields)
```yaml
---
schema: "gemini-gem-v1"
id: "yt:dQw4w9WgXcQ"
title: "Video Title Here"
source_url: "https://youtube.com/watch?v=dQw4w9WgXcQ"
canonical_url: "https://youtube.com/watch?v=dQw4w9WgXcQ"
capture_date: "2024-01-15"
source_type: "youtube"
channel_name: "Channel Name"
publication_date: "2024-01-10"
language: "en"
duration: "PT3M42S"
duration_seconds: 222
tags: ["source/youtube", "channel/channel-name", "topic/example"]
keywords: ["keyword1", "keyword2"]
entities:
  people: ["Person Name"]
  orgs: ["Organization"]
  products: ["Product Name"]
---
```

#### Markdown Body Structure (Canonical Order)
1. **TL;DR** (4-8 bullet points with bold lead phrases)
2. **Executive Summary** (1-3 paragraphs)
3. **Key Topics** (bulleted list)
4. **Timeline/Structure** ([HH:MM:SS] format for videos)
5. **Quotes** (verbatim with timestamps)
6. **Glossary** (**Term**: Definition format)
7. **Claims & Evidence** (factual claims with timestamps)
8. **Actionable Insights** (checklist format)
9. **Open Questions** (questions for further investigation)
10. **Source Notes** (processing metadata)
11. **References** (additional resources)

### Filename Generation Rules
**Format**: `<prefix>_<source-token>_<slug>--<rid>.md`

**Prefix Mapping**:
- YouTube → `yt_`
- Webpage/Article → `web_`  
- Podcast → `pod_`
- Paper → `paper_`
- Talk → `talk_`

**Example**: `yt_rick-astley_never-gonna-give-you-up--dQw4w9WgXcQ.md`

## User Interface Requirements

### Terminal Aesthetics (Critical)
- **Monospace fonts**: 'JetBrains Mono', 'Fira Code', 'Courier New', etc.
- **Box-drawing characters**: Unicode characters (╔═══╗, ║, ╚═══╝)
- **Terminal color schemes**: Current purple theme or classic green-on-black
- **ASCII art integration**: Existing OBSIDIANIZE header is non-negotiable
- **Cursor effects**: Blinking cursors, typing animations

### Web TUI Interface Specs
- **Terminal window simulation**: Complete with title bar and borders
- **Command prompt styling**: `obsidianize@web:~$ _`
- **Real-time progress**: ASCII progress bars during AI processing
- **Status messages**: Terminal-style output with timestamps
- **Error handling**: Terminal-style error messages with color coding

### CLI Interface Specs
- **Interactive mode**: Similar to web experience in terminal
- **Non-interactive mode**: Pipe-friendly for scripting
- **Configuration**: `~/.obsidianize/config.json` with secure permissions
- **Command structure**: `obsidianize [URL] [options]`

## Development Environment Setup

### Required Tools
- **Bun**: Latest version (v1.x)
- **TypeScript**: Via Bun (no separate installation needed)
- **Git**: For version control
- **VS Code**: Recommended editor with TypeScript support

### Environment Variables
```bash
# Required for development
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development

# Optional
DEBUG=obsidianize:*
```

### Development Commands
```bash
# Start development server
bun dev                    # Hot reloading enabled

# Test the application
bun test                   # Built-in test runner

# Build for production  
bun build                  # Creates optimized bundle

# Install new dependencies
bun add package-name       # Faster than npm
```

## Architecture Decisions Made

### 1. Shared Core Strategy
- **Extract common logic** into `src/core/` modules
- **Interface-specific code** in `src/web/` and `src/cli/`
- **Single source of truth** for AI processing logic

### 2. API Key Security
- **No server-side storage** of user API keys
- **Client-side encryption** for web interface
- **File-based encryption** for CLI interface
- **Environment variable support** for both

### 3. Performance Priorities
- **Bun-native** implementation (not Node.js compatibility)
- **Streaming processing** for large content
- **Lazy loading** of heavy dependencies
- **Caching strategies** for AI responses

## Critical Requirements from Original Planning

### From Kiro Planning (Reference Implementation)
The `Kiro_planning/` folder contains the original detailed requirements. Key points:

1. **Exact filename conventions** must be followed
2. **YAML frontmatter** has specific required fields
3. **Tag normalization** rules are strictly defined
4. **Section ordering** in markdown body is canonical
5. **Content structuring** algorithms are specified

**Note**: Original planning assumed traditional web scraping. Current implementation uses Gemini AI but must maintain the same output format for compatibility.

## Testing Strategy

### Unit Tests
- **Core processing engine**: AI integration, content parsing
- **Filename generation**: All edge cases and formats
- **Tag normalization**: Alias resolution and validation
- **Content structuring**: Section generation accuracy

### Integration Tests
- **End-to-end workflows**: URL to final markdown
- **AI integration**: Mock responses and error handling
- **Cross-platform**: CLI testing on macOS, Linux, Windows

### Performance Tests
- **Startup time**: Web server and CLI cold start
- **Processing speed**: Large content handling
- **Memory usage**: Long-running processes
- **Concurrent processing**: Multiple simultaneous requests

## Common Pitfalls to Avoid

### 1. Node.js Assumptions
- **Don't use Node.js-specific APIs** - use Bun equivalents
- **Don't install Node.js packages** if Bun has built-in alternatives
- **Don't assume npm/yarn** - use `bun install` and `bun add`

### 2. ASCII Art Handling
- **Don't modify the existing header** - it's already perfect
- **Don't break monospace layout** - test with various terminal widths
- **Don't forget box-drawing characters** - they're part of the aesthetic

### 3. Performance Regressions
- **Don't add heavy dependencies** without justification
- **Don't block the event loop** - use streaming for large content
- **Don't ignore Bun-specific optimizations**

### 4. Security Issues
- **Don't log API keys** - ever, even in development
- **Don't store keys on server** - client-side only for web
- **Don't ignore rate limiting** - implement from day one

## Documentation References

### 📋 Planning Documents (All Complete)
1. **[Planning Index](./warp_planning/README.md)**: Overview of all documentation
2. **[HIGH_LEVEL_PLAN.md](./warp_planning/HIGH_LEVEL_PLAN.md)**: Complete architecture
3. **[DESIGN_DOCUMENT.md](./warp_planning/DESIGN_DOCUMENT.md)**: Detailed system design
4. **[API_SPECIFICATIONS.md](./warp_planning/API_SPECIFICATIONS.md)**: Complete API definitions
5. **[SECURITY_ARCHITECTURE.md](./warp_planning/SECURITY_ARCHITECTURE.md)**: Security implementation
6. **[DEVELOPMENT_SETUP.md](./warp_planning/DEVELOPMENT_SETUP.md)**: Developer setup guide

### 🔧 Development Resources
- **[ASCII_ART_STYLE_GUIDE.md](./ASCII_ART_STYLE_GUIDE.md)**: Terminal aesthetics
- **[requirements.md](./Kiro_planning/requirements.md)**: Original detailed requirements

### 🔗 External Resources
- **[Bun Documentation](https://bun.sh/docs)**: Runtime-specific features
- **[Gemini API Docs](https://ai.google.dev/docs)**: AI integration
- **[Figlet Documentation](https://github.com/patorjk/figlet.js)**: ASCII art generation

## Success Criteria

### Technical Success
- **Performance**: Sub-100ms startup, <10s processing
- **Quality**: AI-generated content >85% accuracy vs human evaluation
- **Reliability**: <1% failure rate for valid inputs
- **Security**: Zero API key exposure or security incidents

### User Experience Success
- **Usability**: Non-technical users successful in <60 seconds
- **Visual Appeal**: Screenshot-worthy terminal aesthetic
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile**: Fully functional on mobile devices

## Current Development Phase

**Status**: Phase 1 Complete ✅ - Core Infrastructure Ready
**Completed Achievements**:
1. ✅ Environment & build setup (Agent A)
2. ✅ Gemini API integration (Agent B)
3. ✅ Core AI processing engine (Agents B, C, D)
4. ✅ Performance system & caching (Agent D)
5. ✅ Comprehensive testing & validation (Jules Agent)

**Next Phase Tasks**:
1. 🔄 Implement terminal UI components (Agent E)
2. 🔄 Build web server & API endpoints (Agent F)
3. 🔄 Create client application & security (Agent G)
4. 🔄 Responsive design & mobile optimization (Agent H)

**Current Phase**: Phase 1 Complete ✅ - Moving to Phase 2 Web Interface
**Timeline**: 12 weeks total (3 weeks Phase 1 ✅ + 3 weeks Phase 2 + 3 weeks Phase 3 + 3 weeks Phase 4)

---

**Last Updated**: October 11, 2024  
**Agent Context Version**: 2.0  
**Planning Status**: ✅ COMPLETE  
**Implementation Status**: 🔄 READY TO BEGIN

**For Questions**: Reference the [Agent Constitution](./AGENT_CONSTITUTION.md) first, then this document, then consult the comprehensive planning documents in `warp_planning/`

**Remember**: 
- **CONSTITUTION COMPLIANCE**: All work must adhere to the Agent Constitution principles
- **TECHNOLOGY STACK**: This is a Bun + TypeScript project with terminal aesthetics and AI-powered content processing
- **DESIGN ELEMENTS**: The existing ASCII art header and purple color scheme are non-negotiable design elements
- **STATUS**: All planning is complete - ready for Week 1 implementation

## 📋 AGENT CONSTITUTION COMPLIANCE CHECKLIST

Before beginning any work, confirm:

- [ ] ✅ Read and understood the [Agent Constitution](./AGENT_CONSTITUTION.md)
- [ ] ✅ Reviewed existing codebase and architecture decisions
- [ ] ✅ Confirmed technology stack requirements (Bun, not Node.js)
- [ ] ✅ Understood performance targets (sub-100ms startup)
- [ ] ✅ Reviewed security protocols for API key handling
- [ ] ✅ Acknowledged preservation of existing ASCII art and aesthetics
- [ ] ✅ Prepared to follow exact task requirements without additions

**Any violations of the Agent Constitution may result in work rejection or revision requests.**

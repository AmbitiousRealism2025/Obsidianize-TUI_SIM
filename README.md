# Obsidianize TUI

[![CI](https://github.com/AmbitiousRealism2025/Obsidianize-TUI_SIM/actions/workflows/ci.yml/badge.svg)](https://github.com/AmbitiousRealism2025/Obsidianize-TUI_SIM/actions/workflows/ci.yml)

**✨ Your Knowledge, Crystallized ✨**

A dual-target application powered by Google Gemini AI that transforms web content (YouTube videos, articles, papers) into structured Markdown notes following the "Gemini Gem" format. Built with Bun + TypeScript for blazing-fast performance and authentic terminal aesthetics.

## Project Vision

Obsidianize delivers two complementary interfaces:

1. **Web TUI Interface**: Browser-based terminal simulation with modern web features
2. **Native Terminal CLI**: Lightning-fast command-line interface for power users

Both versions share the same AI-powered processing engine built around Gemini's advanced content analysis capabilities.

## Current Status

**Phase**: Phase 1 - Core Infrastructure & AI Engine ✅
**Status**: COMPLETED - All 4 development agents successfully delivered
**Performance**: Exceeds all targets (15ms startup vs <100ms target)
**Testing Gate**: PASSED with comprehensive fixes applied
**Next**: Phase 2 - Web TUI Interface (Ready to begin)

```
 ██████╗ ██████╗ ███████╗██╗██████╗ ██╗ █████╗ ███╗   ██╗██╗███████╗███████╗
██╔═══██╗██╔══██╗██╔════╝██║██╔══██╗██║██╔══██╗████╗  ██║██║╚══███╔╝██╔════╝
██║   ██║██████╔╝███████╗██║██║  ██║██║███████║██╔██╗ ██║██║  ███╔╝ █████╗  
██║   ██║██╔══██╗╚════██║██║██║  ██║██║██╔══██║██║╚██╗██║██║ ███╔╝  ██╔══╝  
╚██████╔╝██████╔╝███████║██║██████╔╝██║██║  ██║██║ ╚████║██║███████╗███████╗
 ╚═════╝ ╚═════╝ ╚══════╝╚═╝╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╚══════╝╚══════╝
```

## Features (Planned)

### Web TUI Interface
- Beautiful terminal simulation in browser
- Real-time AI processing with progress indicators
- Interactive markdown preview with syntax highlighting
- Secure API key management (client-side encrypted storage)
- Mobile-responsive terminal aesthetic
- One-click file downloads

### CLI Interface
- Sub-100ms cold start performance
- Batch processing capabilities
- Shell integration and automation support
- Encrypted configuration management
- Single-file executable distribution
- Advanced AI analysis modes

### AI-Powered Processing
- Google Gemini API with extended YouTube tools
- Multi-modal content analysis (video + audio + text)
- Intelligent content structuring and summarization
- Auto-generated tags, metadata, and insights
- "Gemini Gem" format output with YAML frontmatter

## Tech Stack

- **Runtime**: Bun.js (ultra-fast TypeScript execution)
- **Language**: TypeScript (ES2022+ with strict types)
- **AI Engine**: Google Gemini API
- **Styling**: Terminal-first CSS with authentic TUI aesthetics
- **ASCII Art**: Figlet with "ANSI Shadow" font
- **Architecture**: Shared core with target-specific interfaces

## Development Commands

- **`bun dev`**: Development server with hot-reloading
- **`bun start`**: Production server
- **`bun test`**: Built-in test runner
- **`bun build`**: Production build

## Getting Started

1. Install dependencies:
   ```bash
   bun install
   ```

2. Run the current prototype:
   ```bash
   bun dev
   ```

3. View the ASCII art header at `http://localhost:3000`

## Project Structure

```
├── src/                     # ✅ Core infrastructure implemented
│   ├── core/                # ✅ Shared AI processing engine
│   │   ├── ai/              # ✅ Gemini API integration
│   │   ├── types/           # ✅ TypeScript type system
│   │   ├── formatters/      # ✅ Content formatting engine
│   │   ├── validators/      # ✅ Validation framework
│   │   ├── cache/           # ✅ High-performance caching
│   │   ├── storage/         # ✅ Atomic file operations
│   │   ├── rate-limit/      # ✅ Token bucket rate limiting
│   │   └── performance/     # ✅ Performance monitoring
│   ├── web/                 # ✅ Web TUI interface (Phase 2-3)
│   └── cli/                 # ⏳ CLI interface (Phase 4)
├── docs/                    # 📋 Project documentation
├── tests/                   # ✅ Comprehensive test suite (375+ tests)
├── scripts/                 # ✅ Build and utility scripts
├── archive/                 # 📦 Historical planning documents
├── index.ts                 # ✅ Production server with full features
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## Implementation Timeline

### ✅ Phase 1: Core Infrastructure & AI Engine (COMPLETED)
- **Week 1**: ✅ Gemini AI integration setup (Agent B)
- **Week 2**: ✅ Core AI processing engine (Agents B, C, D)
- **Week 3**: ✅ Environment & build setup (Agent A)
- **Performance**: 15ms startup (vs <100ms target) 🚀
- **Testing Gate**: ✅ PASSED with comprehensive fixes

### 🔄 Phase 2: Web TUI Interface (Ready to Begin)
- **Week 4**: Terminal UI components (Agent E)
- **Week 5**: Web server & API endpoints (Agent F)
- **Week 6**: Client application & security (Agent G)

### ⏳ Phase 3: Enhanced Features & Mobile (Planned)
- **Week 7**: Responsive & mobile optimization (Agent H)
- **Week 8**: Advanced AI features & polish
- **Week 9**: Production readiness & deployment

### ⏳ Phase 4: CLI Implementation & Polish (Planned)
- **Week 10**: CLI foundation & setup (Agent I)
- **Week 11**: Documentation & examples (Agent J)
- **Week 12**: Performance optimization & release (Agents K, L)

**Current Status**: Phase 1 Complete ✅ - Ready for Phase 2 Web Interface Development

## Documentation

### 📋 Project Documentation
- **[CLAUDE.md](./CLAUDE.md)**: Comprehensive project context and development guide
- **[API Guide](./API_GUIDE.md)**: Complete API reference and usage
- **[Action Plan](./docs/ACTION_PLAN_CONSOLIDATED.md)**: Current remediation roadmap
- **[Tech Stack](./docs/TECH_STACK_ARCHITECTURE.md)**: Architecture and dependencies

### 🔧 Development Resources
- **[ASCII Style Guide](./ASCII_ART_STYLE_GUIDE.md)**: Terminal aesthetic guidelines
- **[agents.md](./agents.md)**: Context for development agents
- **[Archive](./archive/)**: Historical planning documents (Phase 1)

Built with ❤️ using Bun + TypeScript for maximum developer velocity and runtime performance.

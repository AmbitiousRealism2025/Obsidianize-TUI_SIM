# Obsidianize TUI

**✨ Your Knowledge, Crystallized ✨**

A dual-target application powered by Google Gemini AI that transforms web content (YouTube videos, articles, papers) into structured Markdown notes following the "Gemini Gem" format. Built with Bun + TypeScript for blazing-fast performance and authentic terminal aesthetics.

## Project Vision

Obsidianize delivers two complementary interfaces:

1. **Web TUI Interface**: Browser-based terminal simulation with modern web features
2. **Native Terminal CLI**: Lightning-fast command-line interface for power users

Both versions share the same AI-powered processing engine built around Gemini's advanced content analysis capabilities.

## Current Status

**Phase**: Complete Planning Documentation ✅  
**Next**: Implementation Phase 1 - Web MVP Foundation  
**Ready**: All design documents, API specifications, and development guides completed

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
├── warp_planning/           # 📋 Complete planning documentation
│   ├── README.md           # Planning documentation index
│   ├── HIGH_LEVEL_PLAN.md  # Architecture and roadmap
│   ├── DESIGN_DOCUMENT.md  # Detailed system design
│   ├── API_SPECIFICATIONS.md # Complete API definitions
│   ├── DEVELOPMENT_SETUP.md # Developer setup guide
│   └── SECURITY_ARCHITECTURE.md # Security implementation
├── Kiro_planning/           # Original requirements (reference)
├── src/                     # Source code (to be created)
│   ├── core/                # Shared AI processing engine
│   ├── web/                 # Web TUI interface
│   └── cli/                 # Terminal CLI interface
├── index.ts                 # Current working prototype
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## Implementation Timeline

### Phase 1: Web MVP Foundation (Weeks 1-3) ▶️
- **Week 1**: Gemini AI integration setup
- **Week 2**: Core AI processing engine
- **Week 3**: Web integration & AI features

### Phase 2: Enhanced Features (Weeks 4-5)
- **Week 4**: Advanced AI features
- **Week 5**: Production ready

### Phase 3: Architecture Extraction (Week 6)
- Extract shared core library
- Unified API key management

### Phase 4: CLI Implementation (Weeks 7-9)
- **Week 7**: CLI foundation + AI setup
- **Week 8**: Advanced CLI features
- **Week 9**: CLI polish & distribution

**Current Target**: Begin Week 1 - Gemini AI Integration Setup

## Documentation

### 📋 Planning Documents (Complete)
- **[Planning Index](./warp_planning/README.md)**: Overview of all planning documentation
- **[High-Level Plan](./warp_planning/HIGH_LEVEL_PLAN.md)**: Complete architecture & development strategy
- **[Design Document](./warp_planning/DESIGN_DOCUMENT.md)**: Detailed technical specifications
- **[API Specifications](./warp_planning/API_SPECIFICATIONS.md)**: Complete API definitions
- **[Security Architecture](./warp_planning/SECURITY_ARCHITECTURE.md)**: Enterprise-grade security
- **[Development Setup](./warp_planning/DEVELOPMENT_SETUP.md)**: Developer environment guide

### 🔧 Development Resources
- **[ASCII Style Guide](./ASCII_ART_STYLE_GUIDE.md)**: Terminal aesthetic guidelines
- **[agents.md](./agents.md)**: Updated context for development agents
- **[Original Requirements](./Kiro_planning/)**: Initial concept and requirements (reference)

Built with ❤️ using Bun + TypeScript for maximum developer velocity and runtime performance.

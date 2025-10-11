# Obsidianize Dual-Target Platform - High-Level Planning Document

## Project Overview

**Obsidianize** is a dual-target application powered by **Google Gemini AI** that transforms web content (YouTube videos, articles, papers) into structured Markdown notes following the "Gemini Gem" format. The project will deliver two distinct but related interfaces:

1. **Web TUI Interface**: Browser-based terminal simulation with modern web features
2. **Native Terminal CLI**: True command-line interface for terminal power users

Both versions will share the same core processing engine built around Gemini's advanced content analysis capabilities, ensuring consistency and reducing maintenance overhead.

## Dual-Target Strategy

### Why This Approach Works Best

**Shared Core Benefits:**
- **Single source of truth** for content processing logic
- **Consistent AI-powered analysis** across both interfaces
- **Reduced maintenance** - bug fixes benefit both versions
- **Code reuse** - maximize development efficiency
- **Centralized API key management** - secure handling in one place

**Target-Specific Optimization:**
- **Web version** optimized for visual appeal and accessibility
- **CLI version** optimized for speed and terminal workflow integration
- **Different user experiences** while maintaining feature parity

### Implementation Strategy

```
Development Flow:
1. Build Web TUI MVP with Gemini integration (Weeks 1-5)
2. Extract shared core into library modules (Week 6)  
3. Branch for CLI implementation (Week 7-9)
4. Parallel maintenance and feature development
```

## Vision Statement

Create two complementary interfaces for the same powerful AI-driven content processing engine:
- **Web Interface**: Beautiful, accessible TUI simulation for broad user adoption
- **CLI Interface**: Lightning-fast terminal tool for developer/power-user workflows

Both leveraging Google Gemini's advanced content analysis while maintaining authentic terminal aesthetics.

## Google Gemini Integration Strategy

### Core AI Engine
**Primary Tool**: Google Gemini API with extended YouTube capabilities
- **Content Analysis**: Deep understanding of video content, transcripts, and metadata
- **Structured Output**: AI-generated summaries, key points, and insights
- **Multi-format Support**: YouTube videos, web articles, academic papers
- **Context Understanding**: Maintains context across long-form content

### API Key Management Approach

#### Development Phase (MVP)
```typescript
// For development and initial testing
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Your personal key
```

#### Production Phase (Post-MVP)
**Two-tier approach:**

1. **User-Provided Keys** (Primary recommended approach)
   ```typescript
   // Users provide their own Gemini API keys
   interface UserConfig {
     geminiApiKey: string;  // User's own Google API key
     preferences: ProcessingPreferences;
   }
   ```

2. **Service-Provided Keys** (Optional premium tier)
   ```typescript
   // Anonymized, rate-limited service keys for users without personal keys
   interface ServiceConfig {
     anonymousUsage: boolean;
     rateLimits: UsageLimits;
     keyRotation: KeyManagementPolicy;
   }
   ```

### Security Implementation
```typescript
// src/core/auth/
├── ApiKeyManager.ts          # Secure key handling and validation
├── RateLimitManager.ts       # Usage monitoring and limits  
├── KeyRotationService.ts     # For service-provided keys
└── ConfigValidator.ts        # API key format and scope validation
```

### API Key Workflow

#### Web Interface
1. **First Use**: Prompt user for Gemini API key
2. **Storage**: Secure local storage (encrypted) or session-only
3. **Validation**: Test API key with simple request before processing
4. **Error Handling**: Clear messaging for invalid/expired keys

#### CLI Interface  
1. **Configuration**: Store in config file (`~/.obsidianize/config.json`)
2. **Environment Variables**: Support `GEMINI_API_KEY` environment variable
3. **Interactive Setup**: `obsidianize setup` command for key configuration
4. **Security**: File permissions and encrypted storage

## Current Foundation

### Existing ASCII Art Header
```
 ██████╗ ██████╗ ███████╗██╗██████╗ ██╗ █████╗ ███╗   ██╗██╗███████╗███████╗
██╔═══██╗██╔══██╗██╔════╝██║██╔══██╗██║██╔══██╗████╗  ██║██║╚══███╔╝██╔════╝
██║   ██║██████╔╝███████╗██║██║  ██║██║███████║██╔██╗ ██║██║  ███╔╝ █████╗  
██║   ██║██╔══██╗╚════██║██║██║  ██║██║██╔══██║██║╚██╗██║██║ ███╔╝  ██╔══╝  
╚██████╔╝██████╔╝███████║██║██████╔╝██║██║  ██║██║ ╚████║██║███████╗███████╗
 ╚═════╝ ╚═════╝ ╚══════╝╚═╝╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╚══════╝╚══════╝
```
**Tagline**: "✨ Your Knowledge, Crystallized ✨"

### Current Tech Foundation
- **Runtime**: Bun.js (perfect for both web server and CLI)
- **Language**: TypeScript (shared across both targets)
- **Styling**: Terminal aesthetic already established
- **ASCII Art**: Figlet integration ready to reuse
- **AI Engine**: Google Gemini API with extended YouTube tools
- **Authentication**: API key management for development and user-provided keys

## Bun + TypeScript Performance Architecture

### Why Bun is Perfect for This Project

**Performance Advantages:**
- **Sub-second startup times**: Critical for CLI responsiveness and web server boot
- **Native TypeScript execution**: No compilation step needed during development
- **Built-in bundling**: Single-file executables for CLI distribution
- **Fast HTTP server**: Bun's server is 4x faster than Node.js for our web interface
- **Memory efficiency**: Lower memory footprint for processing large content

**Developer Experience:**
- **Hot reloading**: Instant feedback during development (`bun --hot`)
- **Built-in test runner**: No Jest/Vitest needed - `bun test` just works
- **Package management**: Faster than npm/yarn with `bun install`
- **ESM-first**: Modern module system without compatibility issues

### Bun-Optimized Architecture Decisions

#### Web Server Optimization
```typescript
// Taking advantage of Bun's ultra-fast HTTP server
const server = Bun.serve({
  port: 3000,
  fetch: async (req) => {
    // Direct Request/Response handling - no middleware overhead
    // Streaming responses for real-time AI processing feedback
    // Native WebSocket support for progress updates
  },
  websocket: {
    // Built-in WebSocket for real-time processing updates
    message: (ws, message) => { /* AI processing progress */ }
  }
});
```

#### CLI Performance Optimization
```typescript
// Single executable compilation for distribution
// bun build src/cli/main.ts --outfile obsidianize --target node

// Fast startup with minimal imports
import { parseArgs } from "util"; // Node built-in, no external deps
import type { ProcessingOptions } from "./types"; // Type-only import

// Lazy loading for heavy dependencies
const loadAI = () => import("./core/ai/GeminiClient");
const loadProcessing = () => import("./core/processors");
```

#### TypeScript Configuration for Speed
```json
{
  "compilerOptions": {
    "target": "ES2022",           // Modern JS features
    "module": "ESNext",          // Native ESM
    "moduleResolution": "bundler", // Bun's resolution
    "noEmit": true,              // No compilation needed
    "strict": true,              // Type safety without runtime cost
    "skipLibCheck": true         // Faster type checking
  }
}
```

#### Build System Optimization
```json
{
  "scripts": {
    "dev": "bun --hot src/web/main.ts",           // Instant hot reload
    "build:web": "bun build --minify --target browser", // Optimized bundling
    "build:cli": "bun build --compile --target node",   // Single executable
    "test": "bun test --preload ./test-setup.ts",      // Fast test runner
    "bench": "bun test --bench"                        // Built-in benchmarking
  }
}
```

### Performance Targets Enabled by Bun

**Web Interface:**
- **Server startup**: <100ms (vs 1-2s with Node.js)
- **Hot reload**: <50ms code changes
- **Build time**: <1s for full production build
- **Memory usage**: <50MB baseline (vs 100-200MB Node.js)

**CLI Interface:**
- **Cold start**: <100ms from command execution to processing start
- **Executable size**: <10MB single-file binary
- **Processing throughput**: 10-20% faster than Node.js equivalent
- **Memory efficiency**: Minimal heap allocation for streaming processing

### Bun-Native Features We're Leveraging

1. **Built-in SQLite**: For caching AI responses and rate limiting
2. **Native fetch()**: No need for axios/node-fetch
3. **Web Streams**: Efficient processing of large content
4. **Built-in WebSockets**: Real-time progress without external deps
5. **File system APIs**: Fast file operations for CLI output
6. **Crypto APIs**: Built-in encryption for API key storage

### Development Workflow Optimizations

```bash
# Development - instant startup and hot reload
bun dev                    # Web server ready in <100ms

# Testing - no setup needed
bun test                   # Built-in test runner
bun test --watch          # Watch mode with instant reruns

# Building - single command for everything
bun run build:all         # Web assets + CLI executable

# Distribution - single file deployment
./obsidianize             # Self-contained executable
```

## Target-Specific Design

### Web TUI Interface (Primary Target)
**Use Case**: Users who want visual feedback, mouse interaction, and browser-based workflow

**Key Features:**
- Beautiful terminal simulation in browser
- **API Key Setup**: Guided setup flow for Gemini API key
- Real-time progress indicators powered by Gemini processing
- Interactive file preview with AI-generated insights
- Responsive design for different screen sizes
- Secure API key handling (session storage or encrypted local storage)

**User Flow:**
```
1. Visit website → See ASCII header and API key setup (if first time)
2. Enter Gemini API key → Validate and store securely
3. Enter URL → AI-powered processing with real-time feedback  
4. View AI insights → Interactive markdown preview with Gemini analysis
5. Download file → Enhanced markdown with AI-generated content
```

### Native Terminal CLI (Secondary Target)  
**Use Case**: Developers, power users, automation, scripting workflows

**Key Features:**  
- Lightning-fast AI processing through Gemini API
- **Configuration Management**: Secure API key storage and management
- Batch processing with AI analysis
- Integration with terminal workflows
- Environment variable and config file support

**User Flow:**
```bash
# Initial setup
$ obsidianize setup
> Enter your Gemini API key: [secure input]
> API key validated and saved to ~/.obsidianize/config.json

# Interactive mode
$ obsidianize
> Enter URL: https://youtube.com/watch?v=example
> [AI] Analyzing content with Gemini... ████████████████████ 100%
> [AI] Generated insights: 2.3K tokens processed
> File saved: yt_example_video--abc123.md

# Batch processing with AI
$ obsidianize --batch urls.txt --ai-mode enhanced
```

## Enhanced Architecture with Gemini Integration

### Core AI Processing Engine (Shared)
```typescript
src/core/
├── ai/
│   ├── GeminiClient.ts           # Core Gemini API integration
│   ├── PromptTemplates.ts        # AI prompts for different content types
│   ├── ContentAnalyzer.ts        # AI-powered content analysis
│   ├── InsightGenerator.ts       # Generate summaries, key points, etc.
│   └── ResponseProcessor.ts      # Parse and structure AI responses
├── auth/
│   ├── ApiKeyManager.ts          # Secure key handling
│   ├── RateLimitManager.ts       # Usage monitoring
│   └── ConfigValidator.ts        # Key validation and testing
├── detectors/
│   ├── SourceDetector.ts         # Enhanced with AI content type detection
│   └── ContentTypeValidator.ts   # AI-assisted validation
├── fetchers/
│   ├── YouTubeGeminiFetcher.ts   # Gemini YouTube tools integration
│   ├── WebContentFetcher.ts      # Web scraping + AI analysis
│   └── AcademicPaperFetcher.ts   # AI-enhanced paper processing
├── processors/
│   ├── AIMetadataExtractor.ts    # AI-powered metadata extraction
│   ├── GeminiTagGenerator.ts     # AI-generated tags and categories
│   └── StructuredContentBuilder.ts # AI-structured content organization
└── generators/
    ├── AIMarkdownAssembler.ts    # AI-enhanced markdown generation
    ├── InsightfulSummaryGenerator.ts # AI summaries and insights
    └── EnhancedFrontmatter.ts     # AI-enriched YAML metadata
```

### Enhanced Dependencies
```json
{
  "figlet": "^1.7.0",              // KEEP - ASCII art generation  
  "chalk": "^5.6.2",               // KEEP - Terminal colors
  "@types/figlet": "^1.5.8",       // KEEP - TypeScript support
  
  // NEW - AI and Enhanced Processing:
  "@google-ai/generativelanguage": "^latest", // Gemini API client
  "marked": "^latest",             // Enhanced markdown processing
  "yaml": "^latest",               // YAML frontmatter handling
  "dompurify": "^latest",          // HTML sanitization
  "dotenv": "^latest",             // Environment variable management
  "bcrypt": "^latest",             // API key encryption (for local storage)
  "zod": "^latest"                 // Runtime type validation for AI responses
}
```

## Development Phases (Updated with AI Integration)

### Phase 1: Web MVP Foundation with Gemini (Weeks 1-3)
**Goal**: Complete functional web interface with AI-powered processing

**Week 1: AI Integration Setup**
- [ ] Set up Gemini API client and authentication
- [ ] Create API key management system (development keys)
- [ ] Implement basic AI content analysis pipeline
- [ ] Enhance current HTML interface with API key input
- [ ] Test Gemini YouTube tools integration

**Week 2: Core AI Processing**  
- [ ] Build Gemini-powered content analysis engine
- [ ] Implement AI prompt templates for different content types
- [ ] Create structured AI response processing
- [ ] Develop AI-enhanced tag generation
- [ ] Build AI-powered content structuring

**Week 3: Web Integration & AI Features**
- [ ] Connect web interface to Gemini processing engine
- [ ] Add real-time AI processing feedback
- [ ] Implement AI-generated content preview
- [ ] Create secure API key storage for web interface
- [ ] Polish AI-enhanced terminal UI

### Phase 2: Enhanced AI Features & Web Polish (Weeks 4-5)
**Goal**: Production-ready web interface with advanced AI capabilities

**Week 4: Advanced AI Features**
- [ ] Multi-modal content analysis (video + audio + text)
- [ ] AI-powered insight generation and key takeaways
- [ ] Enhanced error handling for AI processing failures
- [ ] Rate limiting and usage monitoring
- [ ] AI-generated content quality validation

**Week 5: Production Ready**
- [ ] User-provided API key workflow implementation
- [ ] API key security and encryption
- [ ] Cross-browser compatibility testing
- [ ] AI processing performance optimization
- [ ] Comprehensive error handling and user guidance

### Phase 3: Architecture Extraction (Week 6)
**Goal**: Prepare shared AI core for dual-target use

- [ ] **Extract AI Core Library**: Move Gemini integration to standalone modules
- [ ] **API Key Management**: Unified key handling across web/CLI
- [ ] **AI Response Caching**: Optimize repeated processing with intelligent caching
- [ ] **Rate Limit Handling**: Shared rate limiting logic
- [ ] **Comprehensive Testing**: AI integration test suite

### Phase 4: CLI Implementation with AI (Weeks 7-9)  
**Goal**: Native terminal interface with full AI capabilities

**Week 7: CLI Foundation + AI Setup**
- [ ] Create CLI branch with AI integration
- [ ] Implement CLI API key setup (`obsidianize setup`)
- [ ] Build secure config file management (`~/.obsidianize/`)
- [ ] Create CLI-optimized AI processing pipeline
- [ ] Environment variable support for API keys

**Week 8: Advanced CLI Features**  
- [ ] Batch processing with AI analysis
- [ ] CLI progress indicators for AI operations
- [ ] Advanced configuration options for AI behavior
- [ ] Integration with shell pipelines and automation
- [ ] Performance optimization for CLI AI processing

**Week 9: CLI Polish & Distribution**
- [ ] CLI packaging and distribution setup
- [ ] Cross-platform compatibility (macOS, Linux, Windows)
- [ ] CLI documentation and help system
- [ ] Advanced AI features (custom prompts, analysis modes)
- [ ] Production deployment preparation

## API Key Security Considerations

### Development Environment
```bash
# .env file (git-ignored)
GEMINI_API_KEY=your_development_key_here
NODE_ENV=development
```

### Production Security Measures

#### Web Interface
1. **No Server-Side Storage**: API keys never stored on server
2. **Client-Side Encryption**: Keys encrypted in browser local storage
3. **Session-Only Mode**: Option to use keys only during browser session
4. **Key Validation**: Test API key before storing
5. **Clear Security Messaging**: Transparent about how keys are handled

#### CLI Interface
1. **Encrypted Config Files**: API keys encrypted at rest
2. **File Permissions**: Restrict config file access (`chmod 600`)
3. **Environment Variables**: Support secure environment-based configuration
4. **Key Rotation**: Easy commands to update API keys
5. **Multiple Profiles**: Support different keys for different use cases

### Rate Limiting Strategy
```typescript
interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerHour: number;
  burstAllowance: number;
  cooldownPeriod: number;
}

// Different limits for different usage patterns
const RATE_LIMITS = {
  development: { requestsPerMinute: 10, tokensPerHour: 1000 },
  userProvided: { requestsPerMinute: 60, tokensPerHour: 10000 },
  serviceProvided: { requestsPerMinute: 30, tokensPerHour: 5000 }
};
```

## Enhanced File Structure

```
obsidianize/
├── .env.example              # API key template
├── .env                      # Local API keys (git-ignored)
├── package.json              # Enhanced dependencies with Gemini
├── tsconfig.json
│
├── src/
│   ├── core/                 # SHARED: AI-powered processing engine
│   │   ├── ai/               # Gemini API integration
│   │   ├── auth/             # API key management
│   │   ├── detectors/        # AI-enhanced detection
│   │   ├── fetchers/         # AI-powered content fetching
│   │   ├── processors/       # AI processing pipeline
│   │   ├── generators/       # AI-enhanced output generation
│   │   └── types/            # AI response types and interfaces
│   │
│   ├── web/                  # WEB-SPECIFIC: Browser interface
│   │   ├── server/           # Bun server with AI proxy endpoints
│   │   ├── ui/               # Web UI with API key management
│   │   ├── security/         # Client-side encryption utilities
│   │   └── main.ts
│   │
│   └── cli/                  # CLI-SPECIFIC: Terminal interface  
│       ├── config/           # CLI configuration management
│       ├── setup/            # API key setup workflows
│       ├── commands/         # Enhanced CLI commands
│       └── main.ts
│
├── config/
│   ├── ai-prompts/           # Gemini prompt templates
│   ├── rate-limits.json      # Rate limiting configurations  
│   └── content-schemas.json  # AI response validation schemas
│
├── tests/
│   ├── ai/                   # AI integration tests (with mock responses)
│   ├── auth/                 # API key management tests
│   └── e2e/                  # End-to-end tests with real API calls
│
└── docs/
    ├── API_KEY_SETUP.md      # User guide for API key configuration
    ├── GEMINI_INTEGRATION.md # Technical details of AI integration
    └── SECURITY.md           # Security considerations and best practices
```

## Success Metrics (Updated)

### AI Integration Success
- [ ] **Processing Quality**: AI-generated summaries match human evaluation >85% accuracy
- [ ] **Speed**: AI processing completes within 10 seconds for typical YouTube videos
- [ ] **Reliability**: <1% failure rate for valid API keys and accessible content
- [ ] **Cost Efficiency**: Average processing cost <$0.01 per video analysis
- [ ] **User Satisfaction**: Users prefer AI-generated insights over manual summaries

### Security Success
- [ ] **Zero API Key Exposure**: No API keys ever logged or transmitted insecurely
- [ ] **User Confidence**: Clear security documentation builds user trust
- [ ] **Compliance**: Meets Google's API key security requirements
- [ ] **Recovery**: Easy key rotation and problem resolution workflows

## Risk Assessment (Updated)

### AI Integration Risks
1. **API Rate Limiting**: Gemini API usage limits
   - *Mitigation*: Intelligent rate limiting, user usage monitoring, graceful degradation

2. **API Key Security**: User-provided keys could be compromised
   - *Mitigation*: Client-side encryption, clear security guidance, no server storage

3. **AI Response Quality**: Inconsistent or incorrect AI-generated content
   - *Mitigation*: Response validation, fallback processing, user feedback loops

4. **Cost Management**: Unexpected high usage costs for users
   - *Mitigation*: Usage monitoring, cost estimation, processing limits

### Mitigation Strategies
1. **Robust Error Handling**: Graceful failures with helpful error messages
2. **Fallback Processing**: Non-AI processing mode when API unavailable
3. **User Education**: Clear documentation about API costs and security
4. **Monitoring**: Usage analytics to identify and resolve issues quickly

## Next Steps

1. **API Key Acquisition**: Obtain Gemini API key for development
2. **AI Integration Prototype**: Build minimal Gemini integration proof-of-concept
3. **Security Design Review**: Detailed security architecture for API key handling
4. **Cost Analysis**: Estimate processing costs per content type
5. **User Research**: Gather feedback on AI-powered features vs. traditional processing

---

**Key Innovation**: Leveraging Gemini's advanced AI capabilities transforms Obsidianize from a simple converter into an intelligent content analysis platform, while maintaining the authentic terminal aesthetic and dual-target flexibility.

**Security First**: API key management is designed with security as the primary concern, ensuring user trust and compliance with Google's requirements.

**Timeline Remains**: 9 weeks total, with AI integration adding sophistication without extending development time significantly.
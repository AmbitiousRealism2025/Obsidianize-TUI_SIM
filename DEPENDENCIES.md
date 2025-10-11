# Dependencies Documentation

## Core Dependencies

### Application Framework & Runtime
- **bun** (1.2.17) - JavaScript runtime and bundler
  - Primary runtime for the application
  - Provides fast startup times and efficient bundling
  - Required for sub-100ms startup target

### UI & Display
- **chalk** (^5.6.2) - Terminal string styling
  - Used for colored terminal output and styling
  - Maintains the ASCII art aesthetic
  - Essential for TUI visual presentation

- **figlet** (^1.7.0) - ASCII art generation
  - Generates the "OBSIDIANIZE" title in ASCII art
  - Core component of the terminal aesthetic
  - Preserved as per project requirements

### Content Processing
- **marked** (^16.4.0) - Markdown parser and compiler
  - Parses Markdown content from Obsidian files
  - Converts to HTML for TUI display
  - Fast and secure markdown processing

- **gray-matter** (^4.0.3) - Front matter parser
  - Extracts YAML front matter from markdown files
  - Handles metadata like tags, dates, and properties
  - Essential for Obsidian file parsing

- **yaml** (^2.8.1) - YAML parser and serializer
  - Processes YAML front matter content
  - Handles complex data structures in metadata
  - Lightweight and fast parser

- **dompurify** (^3.2.7) - HTML sanitizer
  - Cleans HTML content for safe display
  - Prevents XSS attacks in markdown rendering
  - Security requirement for content processing

### AI Integration
- **@google/generative-ai** (^0.24.1) - Google's Gemini AI SDK
  - AI-powered content generation and analysis
  - Smart suggestions for note organization
  - Natural language processing features

### Web & Data Fetching
- **axios** (^1.12.2) - HTTP client
  - API communication and web requests
  - Fetches external content and resources
  - Reliable request/response handling

- **cheerio** (^1.1.2) - Server-side HTML parser
  - Parses HTML content for extraction
  - Web scraping capabilities
  - Lightweight jQuery-like API

- **pdf-parse** (^2.2.9) - PDF text extraction
  - Extracts text content from PDF files
  - Supports document import functionality
  - Handles various PDF formats

### Data Validation & Schema
- **zod** (^4.1.12) - TypeScript-first schema validation
  - Runtime type checking and validation
  - Ensures data integrity throughout the application
  - Type-safe configuration and API responses

### Environment & Configuration
- **dotenv** (^17.2.3) - Environment variable loader
  - Loads .env configuration files
  - Manages environment-specific settings
  - Essential for deployment and development

## Development Dependencies

### Type Definitions
- **@types/bun** (latest) - Bun runtime type definitions
- **@types/figlet** (^1.5.8) - Figlet type definitions
- **@types/marked** (^6.0.0) - Marked type definitions
- **@types/dompurify** (^3.2.0) - DOMPurify type definitions

### Testing Framework
- **vitest** (^3.2.4) - Modern testing framework
  - Fast unit and integration testing
  - Built-in code coverage
  - TypeScript support
  - Performance optimized for Bun

### Build Tools
- **typescript** (^5.0.0) - TypeScript compiler (peer dependency)
  - Type checking and compilation
  - Modern JavaScript features
  - Enhanced development experience

## Dependency Security & Performance

### Security Measures
- All dependencies are regularly updated
- DOMPurify provides XSS protection for HTML content
- Zod ensures runtime type safety
- Environment variables are validated on startup

### Performance Optimizations
- Bun runtime provides ~3x faster startup than Node.js
- Minimal dependency footprint for fast bundling
- Tree-shaking enabled for optimal bundle size
- Lazy loading for heavy dependencies (PDF parsing)

### Bundle Size Targets
- Target: < 5MB total bundle size
- Current estimated size: ~2-3MB with all dependencies
- Compression enabled in production builds
- Dynamic imports for optional features

## Dependency Management

### Installation Commands
```bash
# Install all dependencies
bun install

# Add new dependencies
bun add package-name

# Add development dependencies
bun add -d package-name

# Update dependencies
bun update
```

### Security Scanning
```bash
# Audit dependencies for vulnerabilities
bun audit

# Fix security issues
bun audit fix
```

### Version Locking
- `bun.lockb` ensures reproducible builds
- Exact versions specified for stability
- Regular updates with compatibility testing
- Semantic versioning followed for updates

## Future Dependency Planning

### Potential Additions
- **blessed** or **ink** - Advanced TUI frameworks
- **sqlite3** - Local database storage
- **chokidar** - File system watching
- **compression** - Bundle compression utilities

### Dependency Monitoring
- Regular security audits scheduled
- Performance impact monitoring
- Bundle size tracking
- Compatibility testing with Bun updates

---

**Last Updated**: 2025-10-11
**Next Review**: 2025-11-11
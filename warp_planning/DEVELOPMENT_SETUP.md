# Obsidianize TUI - Development Setup Guide

**Version**: 1.0  
**Created**: October 11, 2024  
**For**: Development Team and Contributors  
**Location**: `warp_planning/` (Planning Phase Documentation)

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Project Installation](#project-installation)
4. [Development Configuration](#development-configuration)
5. [Gemini API Setup](#gemini-api-setup)
6. [Development Workflow](#development-workflow)
7. [Testing Setup](#testing-setup)
8. [IDE Configuration](#ide-configuration)
9. [Troubleshooting](#troubleshooting)
10. [Development Commands](#development-commands)

---

## Prerequisites

### Required Software

**Bun Runtime (v1.0+)**
```bash
# Install Bun (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# Restart terminal or reload shell
exec $SHELL

# Verify installation
bun --version
```

**Git (Latest)**
```bash
# macOS (with Homebrew)
brew install git

# Linux (Ubuntu/Debian)
sudo apt install git

# Verify installation
git --version
```

**VS Code (Recommended IDE)**
- Download from: https://code.visualstudio.com/
- Alternative IDEs: WebStorm, Cursor, or any TypeScript-compatible editor

### System Requirements

- **macOS**: 10.15+ (Catalina or newer)
- **Linux**: Ubuntu 18.04+, CentOS 8+, or equivalent
- **Windows**: Windows 10+ (with WSL2 recommended)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB for dependencies
- **Node.js**: NOT required (Bun replaces Node.js)

### Optional but Recommended

**Terminal Enhancement (Optional)**
```bash
# Install a modern terminal (choose one)
# iTerm2 (macOS): https://iterm2.com/
# Alacritty (cross-platform): https://alacritty.org/
# Windows Terminal (Windows): Microsoft Store

# Install a terminal multiplexer (optional)
brew install tmux    # macOS
sudo apt install tmux  # Linux
```

---

## Environment Setup

### Clone Repository

```bash
# Clone the project
git clone <repository-url>
cd obsidianize-tui

# Check current branch
git branch -v
```

### Directory Structure Overview

```
obsidianize-tui/
├── .env.example              # Environment template
├── .env                      # Your local environment (create this)
├── .gitignore               # Git exclusions
├── package.json             # Bun dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── bun.lockb               # Bun dependency lockfile
│
├── src/                     # Source code (to be created)
│   ├── core/               # Shared processing engine
│   ├── web/                # Web TUI interface
│   └── cli/                # CLI interface
│
├── tests/                   # Test suites (to be created)
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
│
├── warp_planning/           # THIS FOLDER - Planning documents
│   ├── HIGH_LEVEL_PLAN.md  # Existing architecture plan
│   ├── DESIGN_DOCUMENT.md  # Detailed system design
│   ├── API_SPECIFICATIONS.md # Complete API definitions
│   └── DEVELOPMENT_SETUP.md # This document
│
├── Kiro_planning/           # Original requirements (reference)
├── docs/                    # Documentation (future)
├── config/                  # Configuration templates (future)
└── build/                   # Build output (auto-generated)
```

---

## Project Installation

### Install Dependencies

```bash
# Navigate to project directory
cd obsidianize-tui

# Install all dependencies with Bun
bun install

# Verify installation
bun --version
ls node_modules  # Should show installed packages
```

### Verify Core Dependencies

```bash
# Check installed packages
bun pm ls

# Key packages should include:
# - figlet (ASCII art - already working)
# - chalk (terminal colors - already working) 
# - @google-ai/generativelanguage (to be added for Gemini API)
# - TypeScript types
```

### Initial Build Test

```bash
# Test the existing server
bun dev

# Should output:
# Listening on http://localhost:3000 ...

# Open browser to http://localhost:3000
# Should see the OBSIDIANIZE ASCII art header
```

---

## Development Configuration

### Environment Variables

```bash
# Copy environment template (to be created)
cp .env.example .env

# Edit with your configuration
nano .env  # or your preferred editor
```

**Required Environment Variables (.env)**
```bash
# === REQUIRED ===
# Gemini AI API Key (get from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# Development environment
NODE_ENV=development

# === OPTIONAL ===
# Server configuration
PORT=3000
HOST=localhost

# Debug settings (useful for development)
DEBUG=obsidianize:*

# Processing timeouts
DEFAULT_TIMEOUT=30000
AI_REQUEST_TIMEOUT=60000

# Rate limiting (for development)
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_TOKENS_PER_HOUR=10000
```

### TypeScript Configuration

The project includes a pre-configured `tsconfig.json` optimized for Bun:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "composite": false,
    "strict": true,
    "downlevelIteration": true,
    "skipLibCheck": true,
    "jsx": "preserve",
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "allowJs": true,
    "types": [
      "bun-types"
    ]
  }
}
```

---

## Gemini API Setup

### Get Gemini API Key

1. **Visit Google AI Studio**
   - Go to: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**
   - Click "Create API key"
   - Select "Create API key in new project" (recommended)
   - Copy the generated API key

3. **Add to Environment**
   ```bash
   # In your .env file
   GEMINI_API_KEY=AIzaSy...your-actual-key...
   ```

### Test API Connection

```bash
# Add Gemini dependency first
bun add @google-ai/generativelanguage

# Test Gemini API connection (create this test file)
cat > test-gemini.js << 'EOF'
import { GoogleGenerativeAI } from "@google-ai/generativelanguage";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY not found in environment');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

try {
  const result = await model.generateContent("Hello, can you confirm this API key works?");
  console.log('✅ Gemini API connection successful!');
  console.log('Response:', result.response.text());
} catch (error) {
  console.error('❌ Gemini API connection failed:', error.message);
}
EOF

# Run the test
bun test-gemini.js

# Clean up
rm test-gemini.js
```

### API Key Security

```bash
# Verify .env is in .gitignore
grep -q "^\.env$" .gitignore && echo "✅ .env is ignored by git" || echo "⚠️ Add .env to .gitignore"

# Check file permissions (should be readable only by you)
ls -la .env
# Should show: -rw------- (600 permissions)
```

---

## Development Workflow

### Current State

The project currently has:
- ✅ Basic Bun + TypeScript setup
- ✅ ASCII art header with figlet
- ✅ Web server serving HTML with terminal styling
- ✅ Purple color scheme and terminal aesthetics
- ✅ Complete planning documentation

**Next Implementation Phase:**
- 🔄 Add Gemini API integration
- 🔄 Build shared core processing engine
- 🔄 Implement Web TUI interface
- 🔄 Create CLI interface

### Available Scripts

```bash
# Development server with hot reload
bun dev
# Starts web server on http://localhost:3000

# Run tests (when implemented)
bun test
# Runs all test suites

# Build for production (when implemented)
bun run build
# Creates optimized build

# Type checking
bunx tsc --noEmit
# Validates TypeScript types
```

### Hot Reload Development

```bash
# Start development server
bun dev

# Server automatically restarts when you modify:
# - TypeScript files (.ts)
# - Configuration files
# - Package.json changes

# Browser automatically refreshes for web interface changes
```

### Future File Structure (Implementation Phase)

```
src/
├── core/                    # Shared processing engine
│   ├── ai/                 # AI integration (Gemini client)
│   │   ├── GeminiClient.ts
│   │   ├── ContentAnalyzer.ts
│   │   └── PromptTemplates.ts
│   ├── auth/               # API key management
│   │   ├── ApiKeyManager.ts
│   │   └── EncryptionService.ts
│   ├── content/            # Content processing
│   │   ├── ContentProcessor.ts
│   │   └── ContentFetcher.ts
│   ├── output/             # Output generation
│   │   ├── MarkdownAssembler.ts
│   │   └── FilenameGenerator.ts
│   └── types/              # Shared TypeScript types
│       └── index.ts
│
├── web/                     # Web TUI interface
│   ├── server/             # Bun server implementation
│   │   ├── routes.ts
│   │   └── websocket.ts
│   ├── ui/                 # Web interface components
│   │   ├── terminal.html
│   │   └── styles.css
│   ├── static/             # Static assets
│   └── main.ts             # Web server entry point
│
└── cli/                     # CLI interface (Phase 2)
    ├── commands/           # CLI command handlers
    ├── config/             # CLI configuration
    └── main.ts             # CLI entry point
```

---

## Testing Setup

### Test Framework

The project will use Bun's built-in test runner (no Jest needed):

```bash
# Run all tests (when implemented)
bun test

# Run specific test file
bun test tests/unit/example.test.ts

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Test Structure (Future)

```
tests/
├── unit/                    # Unit tests
│   ├── ai/                 # AI component tests
│   │   ├── GeminiClient.test.ts
│   │   └── ContentAnalyzer.test.ts
│   ├── auth/               # Authentication tests
│   │   └── ApiKeyManager.test.ts
│   └── content/            # Content processing tests
│       └── ContentProcessor.test.ts
│
├── integration/             # Integration tests
│   ├── web-interface.test.ts
│   └── processing-pipeline.test.ts
│
├── e2e/                     # End-to-end tests
│   ├── web-workflow.test.ts
│   └── real-api.test.ts
│
└── fixtures/                # Test data
    ├── sample-responses/
    ├── mock-content/
    └── test-configs/
```

### Example Test

```typescript
// tests/unit/example.test.ts (future implementation)
import { describe, it, expect, beforeEach, afterEach } from "bun:test";

describe("Example Test Suite", () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it("should pass basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle async operations", async () => {
    const result = await Promise.resolve("test");
    expect(result).toBe("test");
  });
});
```

---

## IDE Configuration

### VS Code Setup

**Required Extensions:**
```bash
# Install via command line
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-json

# Or install via VS Code Extensions panel:
# - TypeScript and JavaScript Language Features
# - Prettier - Code formatter
# - JSON Language Features
```

**VS Code Settings (.vscode/settings.json):**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true
  },
  "files.associations": {
    "*.ts": "typescript"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/bun.lockb": true,
    "**/build": true
  }
}
```

**VS Code Tasks (.vscode/tasks.json):**
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "dev",
      "type": "shell",
      "command": "bun dev",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "test",
      "type": "shell",
      "command": "bun test",
      "group": "test"
    },
    {
      "label": "type-check",
      "type": "shell",
      "command": "bunx tsc --noEmit",
      "group": "build"
    }
  ]
}
```

### Debugging Configuration

**.vscode/launch.json:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Bun Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/index.ts",
      "runtime": "bun",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

---

## Troubleshooting

### Common Issues

**1. Bun Not Found**
```bash
# Symptoms: command not found: bun
# Solution: Add Bun to PATH
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**2. TypeScript Errors**
```bash
# Symptoms: TypeScript compilation errors
# Solution: Check tsconfig.json and dependencies
bun install  # Reinstall dependencies
bunx tsc --noEmit  # Check specific type errors
```

**3. Gemini API Issues**
```bash
# Symptoms: API key errors, network issues
# Check API key
echo $GEMINI_API_KEY  # Should show your key (first few chars)

# Test connectivity
curl -H "x-goog-api-key: $GEMINI_API_KEY" \
  "https://generativelanguage.googleapis.com/v1/models"
```

**4. Port Already in Use**
```bash
# Symptoms: EADDRINUSE error
# Solution: Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 bun dev
```

**5. Permission Issues**
```bash
# Symptoms: EACCES errors
# Solution: Fix file permissions
chmod 600 .env  # Secure environment file
chmod -R 755 src/  # Source files readable (when created)
```

### Debug Mode

```bash
# Enable debug logging (when implemented)
DEBUG=obsidianize:* bun dev

# Specific debug categories
DEBUG=obsidianize:ai,obsidianize:content bun dev

# Current simple debugging
console.log("Debug info:", someVariable);
```

### Performance Issues

```bash
# Check Bun version
bun --version  # Should be v1.0+

# Monitor memory usage
top -p $(pgrep -f "bun")

# Check for memory leaks
bun --smol index.ts  # Use less memory
```

---

## Development Commands

### Core Commands

```bash
# Project setup
bun install                  # Install dependencies
cp .env.example .env        # Setup environment (when .env.example exists)

# Development
bun dev                     # Start development server
bun run build              # Build for production (when implemented)
bun test                   # Run test suite (when implemented)
bunx tsc --noEmit          # TypeScript validation

# Current working commands
bun index.ts               # Run current server directly
bun --hot index.ts         # Run with hot reload
```

### Future Commands

```bash
# Advanced dependency management
bun add <package>          # Add new dependency
bun add -d <package>       # Add dev dependency
bun remove <package>       # Remove dependency
bun update                 # Update all dependencies

# Build variations (to be implemented)
bun run build:web          # Build web interface only
bun run build:cli          # Build CLI interface only
bun run build:all          # Build all targets

# Testing variations (to be implemented)
bun test --watch           # Watch mode
bun test --coverage        # With coverage
bun test tests/unit        # Specific directory
bun test --filter="AI"     # Filter by test name
```

### Git Workflow

```bash
# Start feature development
git checkout -b feature/your-feature-name
git pull origin main

# Development cycle
git add .
git commit -m "feat: implement feature X"
git push origin feature/your-feature-name

# Before merging
bun test                   # Ensure tests pass (when implemented)
bunx tsc --noEmit         # Ensure no type errors
bun run build             # Ensure builds successfully (when implemented)
```

---

## Getting Started Checklist

### Initial Setup ✓

- [ ] Install Bun runtime (`curl -fsSL https://bun.sh/install | bash`)
- [ ] Clone repository
- [ ] Run `bun install`
- [ ] Test with `bun dev`
- [ ] Verify ASCII art displays at http://localhost:3000

### Gemini API Setup ✓

- [ ] Get Gemini API key from Google AI Studio
- [ ] Create `.env` file with API key
- [ ] Add Gemini dependency: `bun add @google-ai/generativelanguage`
- [ ] Test API connection
- [ ] Verify `.env` is in `.gitignore`

### Development Ready ✓

- [ ] VS Code extensions installed
- [ ] TypeScript working (no errors with `bunx tsc --noEmit`)
- [ ] Hot reload functioning
- [ ] Debug configuration working
- [ ] Git setup and first commit

### Project Understanding ✓

- [ ] Read [HIGH_LEVEL_PLAN.md](./HIGH_LEVEL_PLAN.md)
- [ ] Read [DESIGN_DOCUMENT.md](./DESIGN_DOCUMENT.md)
- [ ] Review [API_SPECIFICATIONS.md](./API_SPECIFICATIONS.md)
- [ ] Understand dual-target architecture (Web TUI + CLI)
- [ ] Familiar with existing ASCII art implementation in `index.ts`
- [ ] Ready to implement AI integration

---

## Next Implementation Steps

Based on the planning documents, here's the implementation roadmap:

### Phase 1: Web MVP Foundation (Weeks 1-3)

**Week 1: AI Integration Setup**
- [ ] Set up Gemini API client and authentication
- [ ] Create API key management system
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

### Phase 2: Enhanced Features (Weeks 4-5)
- [ ] Advanced AI features and production readiness
- [ ] User-provided API key workflow
- [ ] Cross-browser compatibility
- [ ] Performance optimization

### Phase 3: CLI Implementation (Weeks 6-9)
- [ ] Extract shared core (Week 6)
- [ ] CLI foundation and AI setup (Week 7)
- [ ] Advanced CLI features (Week 8)
- [ ] CLI polish and distribution (Week 9)

---

**Ready to Start Development?**

1. **Current Working State**: The existing `index.ts` demonstrates the foundation
2. **First Task**: Add Gemini API integration to the existing server
3. **Reference**: All planning documents are in `warp_planning/` folder
4. **Architecture**: Follow the shared-core, dual-interface design

**Need Help?**
- Check troubleshooting section above
- Review existing code in `index.ts`
- Reference the planning documents in `warp_planning/`
- Start with small AI integration tests

---

*This setup guide is part of the comprehensive planning phase documentation. Update as implementation progresses.*

<citations>
<document>
<document_type>RULE</document_type>
<document_id>/Users/ambrealismwork/Desktop/Coding-Projects/Obsidianize-TUI_SIM/agents.md</document_id>
</document>
</citations>
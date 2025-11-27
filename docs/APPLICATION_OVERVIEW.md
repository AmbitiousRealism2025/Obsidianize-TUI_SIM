# Obsidianize - Application Overview

## What is Obsidianize?

**Obsidianize** is an AI-powered web application that transforms web content into beautifully structured Markdown notes using Google Gemini AI. The application's mission is to help users extract, analyze, and organize knowledge from diverse online sources into a format optimized for research, learning, and knowledge management systems like Obsidian.

### Mission Statement

> "Transform web content into crystallized knowledge" - turning raw online information into structured, actionable notes ready for your second brain.

### Target Users

- **Students and researchers** who consume online content and need structured notes
- **Knowledge workers** managing research across multiple sources
- **Professionals** building personal knowledge bases
- **Content creators and educators** extracting insights from videos and articles
- **Anyone using note-taking apps** like Obsidian who wants automated content processing

### The Problem It Solves

| Problem | Obsidianize Solution |
|---------|---------------------|
| Manual transcription is tedious | Automatically analyzes diverse content types |
| Important details are often missed | AI-powered comprehensive summaries |
| Content doesn't work in note apps | Produces Obsidian-ready Markdown format |
| Extracted content lacks metadata | Creates YAML frontmatter with rich metadata |
| Inconsistent note formatting | Standardized "Gemini Gem" output format |

---

## Core Features

### 1. Content Type Support

Obsidianize intelligently detects and processes four major content types:

| Content Type | Detection | Processing | Output |
|--------------|-----------|------------|--------|
| **YouTube Videos** | URL pattern matching | Video metadata, timestamps, transcripts | Timestamped notes with key moments |
| **Articles/Blogs** | HTML/PHP/ASP/JSP | Web scraping, text extraction | Clean structured article summary |
| **Research Papers** | PDF files | PDF parsing and analysis | Academic-style notes with citations |
| **Podcasts** | Anchor.fm, Spotify, Apple Podcasts | Episode info, transcripts | Transcript-based notes with speakers |

### 2. AI-Powered Analysis

**Engine**: Google Gemini API (gemini-1.5-flash model)

The AI analysis pipeline includes:
- **Content Extraction**: Intelligent parsing of various formats
- **Smart Analysis**: Content understanding and key point identification
- **Prompt Engineering**: Format-specific prompts for optimal output
- **Response Processing**: Structured data generation with validation
- **Quality Metrics**: Built-in quality scoring for output evaluation

### 3. "Gemini Gem" Output Format

Obsidianize's proprietary output format combines:

**YAML Frontmatter** (Metadata Layer):
```yaml
---
title: "Video/Article Title"
author: "Original Creator"
source_url: "https://..."
content_type: "youtube"
processed: "2025-11-27T10:00:00Z"
tags: [tag1, tag2, tag3]
---
```

**Structured Markdown Content**:
- Automatically formatted sections
- Hierarchical heading structure
- Key points and takeaways
- Timestamps (for video content)
- Quoted excerpts
- Links and references
- Entity extraction (people, concepts, topics)

### 4. Real-Time Progress Tracking

**WebSocket-Powered Live Updates**:
- Live progress percentage display
- Real-time status messages
- Processing stage indicators
- Fallback to polling if WebSocket unavailable

### 5. Batch Processing

- Process multiple URLs in a single request
- Configurable concurrent processing (1-10 URLs)
- Individual job tracking per URL
- Aggregate progress reporting
- Batch result compilation

### 6. Flexible Output Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| **Markdown** | `.md` | Primary format, Obsidian-ready |
| **JSON** | `.json` | Structured data with full metadata |
| **YAML** | `.yaml` | Alternative structured format |

### 7. Advanced Processing Options

**Analysis Modes**:
- `standard` - Balanced summary with key points
- `enhanced` - More detailed analysis with deeper insights
- `academic` - Scholarly format with citations and sources

**Summarization Levels**:
- `brief` - 3 key points, short summary
- `standard` - 5 key points, medium summary
- `detailed` - 10 key points, long summary
- `comprehensive` - 20 key points, very detailed analysis

---

## User Interface

### Web TUI Terminal Aesthetic

Obsidianize features an **authentic terminal-style interface** designed for users who appreciate command-line aesthetics:

**Visual Elements**:
- ASCII art header: "OBSIDIANIZE" in decorative font with tagline
- Terminal window frame with title bar
- Status indicators (● READY, ● PROCESSING, ● ERROR)
- Progress bar with percentage display
- Terminal-style buttons with Unicode symbols

**Color Scheme**:
- Dark background (authentic terminal black)
- Cyan accents (primary highlight color)
- Purple/Magenta secondary colors
- Green for success indicators
- Red for error messages
- White/light gray for text

### Interface Sections

**1. Input Form**:
```
$ CONTENT URL: [URL input field]
$ CONTENT TYPE: [Radio buttons: YouTube, Article, Paper, Podcast]
$ GEMINI API KEY: [Password input with visibility toggle]
[▶ CRYSTALLIZE KNOWLEDGE] button
```

**2. Progress Display**:
- Real-time progress bar (0-100%)
- Status message updates
- Processing stage indicators

**3. Output Display**:
- Rendered YAML frontmatter in code block
- Formatted Markdown content with syntax highlighting
- [⬇ DOWNLOAD MARKDOWN] button

### PWA Support

- Installable as desktop/mobile app
- Service Worker for offline capability
- App manifest with icons and metadata
- Works offline for cached content
- Home screen shortcut support

---

## How It Works: User Journey

### Step 1: Access the Application
1. Navigate to `http://localhost:3000` (or deployed URL)
2. Web TUI interface loads with ASCII art header
3. Status indicator shows "● READY"

### Step 2: API Key Setup (First Time)
1. User enters their Google Gemini API key
2. Application validates format locally
3. Key is encrypted using AES-GCM with device passphrase
4. Encrypted key stored in browser's localStorage
5. Future visits auto-load the encrypted key

### Step 3: Submit Content
1. Enter content URL (YouTube, article, PDF, or podcast)
2. Select content type (or app auto-detects)
3. Configure optional processing options
4. Click "▶ CRYSTALLIZE KNOWLEDGE"

### Step 4: Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESSING PIPELINE                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Job Creation (201 CREATED)                                  │
│     └── Unique job ID: job_TIMESTAMP_RANDOM                     │
│                                                                 │
│  2. Content Extraction (async)                                  │
│     ├── YouTube: metadata, transcript, duration                 │
│     ├── Articles: title, author, body content                   │
│     ├── PDFs: text extraction, structure                        │
│     └── Podcasts: episode info, transcript                      │
│                                                                 │
│  3. AI Analysis                                                 │
│     ├── Format-specific prompt applied                          │
│     ├── Gemini API generates analysis                           │
│     └── Token usage tracked                                     │
│                                                                 │
│  4. Response Processing                                         │
│     ├── Validate against schema                                 │
│     ├── Generate YAML frontmatter                               │
│     └── Format Markdown content                                 │
│                                                                 │
│  5. Result Storage                                              │
│     └── Status: "completed" with download URL                   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 5: Real-Time Updates

**WebSocket Messages**:
```json
{ "type": "progress", "progress": 45, "message": "Analyzing with AI..." }
{ "type": "complete", "downloadUrl": "/api/download/job_xxx" }
```

### Step 6: Download Result
1. Progress bar reaches 100%
2. Output section becomes visible
3. Click "⬇ DOWNLOAD MARKDOWN"
4. File downloads as `title_jobid.md`

---

## API Capabilities

### Core REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/process` | POST | Start content processing |
| `/api/status/:id` | GET | Check job status |
| `/api/download/:id` | GET | Download processed content |
| `/api/health` | GET | System health check |

### Advanced Endpoints (Phase 3)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard` | GET | System metrics dashboard |
| `/api/batch` | POST | Process multiple URLs |
| `/api/batch/:id/status` | GET | Batch job status |
| `/api/batch/:id/results` | GET | Batch job results |
| `/api/export/:id` | GET | Export in JSON/YAML |
| `/api/prompts` | GET | Custom prompt templates |

### WebSocket API

**Connection**: `ws://localhost:3000/ws/progress/:jobId`

**Message Types**:
- `status` - Connection status updates
- `progress` - Processing progress (0-100%)
- `complete` - Job finished with download URL
- `error` - Processing failed with message

### Rate Limiting

**Token Bucket Algorithm**:

| Tier | Tokens | Refill Rate |
|------|--------|-------------|
| Guest | 100 | 10/sec |
| User | 1,000 | 50/sec |
| Premium | 5,000 | 100/sec |

---

## Output Format Structure

### Markdown Output

```markdown
---
title: "Video/Article Title"
author: "Original Creator"
source_url: "https://..."
content_type: "youtube"
duration: "12:34"
tags: [tag1, tag2, tag3]
key_points: 5
processed: "2025-11-27T10:00:00Z"
---

# Main Title

## Summary
High-level overview of content

## Key Takeaways
- Point 1
- Point 2
- Point 3

## Detailed Notes

### Section 1
Content with **bold**, *italic*, and `code`

## Timestamps (for video)
- [00:00:15] - Introduction
- [00:05:30] - Main topic discussion

## Entities
- **People**: Person1, Person2
- **Concepts**: Concept1, Concept2
```

### JSON Export

```json
{
  "frontmatter": {
    "title": "Video Title",
    "author": "Creator",
    "source_url": "https://...",
    "tags": ["tag1", "tag2"]
  },
  "content": "Markdown content here...",
  "metadata": {
    "exportedAt": "2025-11-27T10:15:00Z",
    "format": "json"
  }
}
```

---

## Security Features

### API Key Protection

- **Client-Side Encryption**: AES-256-GCM encryption algorithm
- **PBKDF2 Key Derivation**: 100,000 iterations
- **Device-Specific Storage**: Keys never transmitted to server
- **Automatic Decryption**: Auto-fills on app load

### Server-Side Security

- **SSRF Protection**: Blocks internal network access
- **URL Validation**: Protocol whitelist (HTTPS only)
- **Rate Limiting**: Per-IP token bucket
- **Input Sanitization**: All user inputs validated

### Data Protection

- API keys never stored on server
- No plaintext credentials in logs
- Jobs auto-expire after 1 hour
- Memory cleared after processing

---

## Current Limitations

### What the App DOES

- ✓ Process single URLs with AI analysis
- ✓ Batch process multiple URLs (up to 10)
- ✓ Generate structured Markdown notes
- ✓ Export in multiple formats
- ✓ Real-time progress tracking
- ✓ Client-side API key encryption
- ✓ Support 4 content types
- ✓ Mobile-responsive interface
- ✓ PWA support

### What the App DOESN'T Do (Yet)

- ✗ User authentication and accounts
- ✗ Persistent job storage
- ✗ Scheduled processing
- ✗ CLI interface (Phase 4 planned)
- ✗ Browser extensions
- ✗ Mobile native apps

### Known Constraints

- **In-Memory Storage**: Jobs lost on server restart
- **Single-Instance**: No horizontal scaling yet
- **No Authentication**: Rate limiting by IP only
- **Processing Timeout**: 120 seconds per job
- **Content Size**: 50MB max file size

---

## Getting Started

### Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Get a Gemini API key from:
# https://makersuite.google.com/app/apikey

# 3. Start the server
bun run index.ts

# 4. Open browser
# http://localhost:3000
```

### API Quick Test

```bash
# Health check
curl http://localhost:3000/api/health

# Process content
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=example",
    "apiKey": "your-api-key"
  }'
```

---

## Technical Summary

| Aspect | Technology |
|--------|------------|
| **Runtime** | Bun.js |
| **Language** | TypeScript |
| **AI Engine** | Google Gemini API |
| **Web Server** | Bun native server |
| **Cache** | SQLite |
| **Real-time** | WebSocket |
| **Encryption** | AES-256-GCM |
| **Testing** | Vitest (320+ tests) |

---

## Status

**Phase 3 Complete** - Enhanced Features & Production Ready

- 320+ unit tests with comprehensive coverage
- 15ms startup time (vs <100ms target)
- Full Web TUI interface
- Batch processing and export formats
- PWA support with offline capability

**Next Phase**: Phase 4 (CLI Implementation)

---

**Version**: 1.0.0
**Last Updated**: November 27, 2025

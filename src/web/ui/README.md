# Obsidianize Web TUI - Client-Side Implementation

This directory contains the client-side implementation for the Obsidianize Web TUI Interface.

## Structure

```
src/web/ui/
├── index.html              # Main HTML template
├── scripts/
│   └── app.js              # Main application logic (ES6 modules)
├── styles/
│   └── terminal.css        # Terminal-themed styling
└── README.md               # This file
```

## Files

### index.html
The main HTML template that provides:
- ASCII art header with OBSIDIANIZE branding
- Form for URL input, content type selection, and API key
- Progress indicators with percentage and status
- Output display with frontmatter and markdown content
- Error display section
- Download functionality

### scripts/app.js
Main application script that handles:
- **Form Submission**: Validates inputs and submits processing requests
- **API Communication**: Calls backend endpoints (`/api/process`, `/api/status/:id`, `/api/download/:id`)
- **Progress Tracking**: Real-time updates via WebSocket with polling fallback
- **Output Rendering**: Markdown rendering with frontmatter parsing
- **File Downloads**: Downloads generated markdown files
- **API Key Management**: Device-encrypted storage using Web Crypto API
- **Error Handling**: Terminal-style error messages

### Key Features

#### 1. API Key Security
- Client-side encryption using Web Crypto API (AES-GCM)
- Device-specific passphrase generation
- No server-side storage - keys stored in localStorage encrypted
- Auto-load on page refresh

#### 2. Real-Time Progress Updates
- Primary: WebSocket connection (`/ws/progress/:id`)
- Fallback: HTTP polling (`/api/status/:id`) every 2 seconds
- Progress bar with percentage and status messages

#### 3. Markdown Rendering
- Basic built-in markdown parser
- Support for marked.js if included
- Syntax highlighting support (highlight.js)
- YAML frontmatter display

#### 4. Terminal Aesthetics
- ASCII art header
- Terminal-style status indicators
- Progress animations
- Error messages in terminal format

## Dependencies

### Required (Bundled)
- Encryption module: `../../security/encryption.js`

### Optional (CDN/External)
- `marked.js`: Enhanced markdown parsing (falls back to basic parser)
- `highlight.js`: Code syntax highlighting

## API Endpoints

### POST /api/process
Submit URL for processing
```json
{
  "url": "string",
  "apiKey": "string",
  "options": {
    "contentType": "youtube|article|paper|podcast"
  }
}
```

**Response:**
```json
{
  "jobId": "string",
  "status": "pending",
  "message": "string",
  "statusUrl": "string",
  "downloadUrl": "string"
}
```

### GET /api/status/:id
Check processing status
```json
{
  "jobId": "string",
  "status": "pending|processing|completed|failed",
  "progress": 0-100,
  "message": "string",
  "metadata": {
    "duration": 1234,
    "contentType": "string",
    "tokensUsed": 5678
  }
}
```

### GET /api/download/:id
Download generated markdown
- Returns: `text/markdown` file
- Headers: `Content-Disposition: attachment; filename="..."`

### WebSocket /ws/progress/:id
Real-time progress updates
```json
{
  "type": "progress|complete|error",
  "progress": 0-100,
  "message": "string",
  "result": { ... }
}
```

## Usage

1. **Load the page**: HTML loads and initializes app.js
2. **Enter URL**: User enters content URL (YouTube, article, etc.)
3. **Enter API Key**: User provides Gemini API key (auto-loaded if stored)
4. **Submit**: Form submits, processing starts
5. **Progress**: Real-time updates via WebSocket or polling
6. **Results**: Markdown content displayed with frontmatter
7. **Download**: User can download as .md file

## Security Features

### Client-Side Encryption
- API keys encrypted using AES-GCM with 256-bit key
- PBKDF2 key derivation (100,000 iterations, SHA-256)
- Random IV and salt for each encryption
- Device-specific passphrase based on browser fingerprint

### Data Protection
- No API keys sent to server storage
- HTTPS enforcement (WebSocket secure when HTTPS)
- Input validation before submission
- No sensitive data in console logs (production mode)

## Browser Compatibility

### Required APIs
- ES6 Modules
- Fetch API
- Web Crypto API (SubtleCrypto)
- WebSocket API
- LocalStorage API

### Supported Browsers
- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Opera 74+

## Development

### Testing Locally
```bash
# Start the Bun server
bun dev

# Open browser to http://localhost:3000
```

### Debugging
- Open browser DevTools
- Check Console for logs
- Network tab for API calls
- Application tab for LocalStorage inspection

### Build for Production
```bash
# Bundle and minify
bun build src/web/ui/scripts/app.js --outdir=dist --minify --target=browser

# Compile TypeScript encryption module
bun build src/web/security/encryption.ts --outdir=dist --minify --target=browser
```

## Customization

### Styling
Modify `styles/terminal.css` for:
- Color scheme changes
- Font adjustments
- Layout modifications
- Animation speeds

### Progress Stages
Edit progress messages in `app.js`:
```javascript
function updateProgress(percent, message) {
  // Customize progress display
}
```

### Markdown Rendering
Enhance the `renderMarkdown()` function:
```javascript
function renderMarkdown(markdown) {
  // Add custom rendering logic
}
```

## Troubleshooting

### WebSocket Connection Fails
- Check HTTPS/WSS protocol matching
- Verify server WebSocket support
- Falls back to HTTP polling automatically

### API Key Not Loading
- Check browser console for errors
- Verify LocalStorage not disabled
- Clear storage and re-enter key

### Markdown Not Rendering
- Check for marked.js if using enhanced features
- Verify content format is valid markdown
- Check browser console for parsing errors

### Download Not Working
- Check `Content-Disposition` header
- Verify CORS settings
- Check browser download permissions

## Future Enhancements

- [ ] Copy to clipboard button for output
- [ ] Export as PDF option
- [ ] Multiple API key management
- [ ] Processing history/cache
- [ ] Dark/light theme toggle
- [ ] Mobile-responsive design
- [ ] Offline mode support
- [ ] Batch processing queue

## Security Notes

⚠️ **Important Security Considerations:**

1. API keys are encrypted with a device-specific passphrase
2. This provides protection against casual access, but not against determined attackers with physical device access
3. For maximum security, users should not use shared/public computers
4. Consider implementing additional passphrase protection for sensitive environments
5. HTTPS should ALWAYS be used in production

## License

Part of the Obsidianize project. See main LICENSE file.

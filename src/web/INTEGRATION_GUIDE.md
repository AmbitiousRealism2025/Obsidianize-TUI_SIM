# Client-Side Integration Guide

Quick guide for integrating the client-side JavaScript with the Obsidianize Web TUI.

## File Structure

```
src/web/
├── ui/
│   ├── index.html                 # ✅ Updated with script tag
│   ├── scripts/
│   │   └── app.js                 # ✅ Main application (730 lines)
│   └── README.md                  # ✅ Client documentation
├── security/
│   ├── encryption.ts              # ✅ API key encryption (187 lines)
│   └── index.ts                   # ✅ Barrel export
├── server/
│   ├── index.ts                   # Server entry point
│   ├── routes.ts                  # API endpoints
│   ├── websocket.ts               # WebSocket handler
│   └── middleware.ts              # Server middleware
└── CLIENT_IMPLEMENTATION.md       # ✅ Complete documentation
```

## Integration Steps

### 1. Build TypeScript Files

The encryption module needs to be compiled from TypeScript to JavaScript for browser use:

```bash
# Option A: Build for development (with source maps)
bun build src/web/security/encryption.ts \
  --outdir=src/web/ui/scripts \
  --format=esm \
  --target=browser

# Option B: Build for production (minified)
bun build src/web/security/encryption.ts \
  --outdir=dist/scripts \
  --format=esm \
  --target=browser \
  --minify

# Verify output
ls -lh src/web/ui/scripts/encryption.js
```

### 2. Update Import Path (if needed)

If the compiled `encryption.js` is in a different location, update the import in `app.js`:

```javascript
// Current import (assumes encryption.js in same directory after build)
import {
  saveApiKey,
  loadApiKey,
  clearApiKey,
  hasStoredApiKey,
  generateDevicePassphrase,
} from "../../security/encryption.js";

// Change to relative path if needed
import { ... } from "./encryption.js"; // if in same directory
```

### 3. Serve Static Files

Configure your Bun server to serve the static files:

**In `src/web/server/index.ts`:**

```typescript
import { serve } from "bun";
import { handleApiRequest } from "./routes.js";

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // API routes
    if (url.pathname.startsWith("/api/")) {
      return await handleApiRequest(req);
    }

    // Static files
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(Bun.file("src/web/ui/index.html"));
    }

    if (url.pathname.startsWith("/scripts/")) {
      const file = Bun.file(`src/web/ui${url.pathname}`);
      return new Response(file, {
        headers: {
          "Content-Type": "application/javascript",
        },
      });
    }

    if (url.pathname.startsWith("/styles/")) {
      const file = Bun.file(`src/web/ui${url.pathname}`);
      return new Response(file, {
        headers: {
          "Content-Type": "text/css",
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});
```

### 4. Enable WebSocket Support

**In `src/web/server/index.ts`:**

```typescript
import { serve } from "bun";
import { handleWebSocketUpgrade } from "./websocket.js";

serve({
  port: 3000,
  async fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (url.pathname.startsWith("/ws/progress/")) {
      const jobId = url.pathname.split("/")[3];
      if (server.upgrade(req, { data: { jobId } })) {
        return; // Upgraded to WebSocket
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // ... rest of routes
  },

  websocket: {
    open(ws) {
      console.log("WebSocket opened:", ws.data.jobId);
    },
    message(ws, message) {
      console.log("WebSocket message:", message);
    },
    close(ws) {
      console.log("WebSocket closed:", ws.data.jobId);
    },
  },
});
```

### 5. Test the Integration

```bash
# Start the server
bun dev

# Open browser
open http://localhost:3000

# Check browser console
# Should see: "Obsidianize Web TUI initialized"
```

## Quick Build Script

Add to `package.json`:

```json
{
  "scripts": {
    "build:client": "bun build src/web/security/encryption.ts --outdir=src/web/ui/scripts --format=esm --target=browser",
    "build:client:prod": "bun build src/web/security/encryption.ts --outdir=dist/scripts --format=esm --target=browser --minify",
    "dev:web": "bun run build:client && bun dev",
    "build:web": "bun run build:client:prod && bun build"
  }
}
```

Then run:

```bash
# Development
bun run dev:web

# Production
bun run build:web
```

## Verification Checklist

- [ ] TypeScript files compiled successfully
- [ ] `encryption.js` exists in the correct location
- [ ] Server serves static files from `src/web/ui/`
- [ ] Browser console shows no import errors
- [ ] "Obsidianize Web TUI initialized" message appears
- [ ] API key field works (type and toggle visibility)
- [ ] Form validation works (try submitting empty form)
- [ ] WebSocket connection established (check network tab)
- [ ] Progress bar updates during processing
- [ ] Results display correctly
- [ ] Download button works

## Common Issues

### Import Error: Cannot find module 'encryption.js'

**Problem**: Browser can't find the encryption module

**Solution**:
```bash
# Build the TypeScript file
bun build src/web/security/encryption.ts --outdir=src/web/ui/scripts --format=esm --target=browser

# Verify it exists
ls src/web/ui/scripts/encryption.js
```

### CORS Error

**Problem**: Browser blocks requests due to CORS

**Solution**: Add CORS headers in server:
```typescript
headers: {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}
```

### SubtleCrypto Not Available

**Problem**: Web Crypto API requires HTTPS

**Solution**:
- Development: Use `localhost` (allowed on HTTP)
- Production: Use HTTPS/SSL certificate

### WebSocket Connection Refused

**Problem**: WebSocket upgrade not configured

**Solution**: Implement WebSocket handler in server (see step 4)

## Production Deployment

### 1. Build All Assets

```bash
# Build client-side JavaScript
bun run build:client:prod

# Build server
bun run build
```

### 2. Environment Variables

Create `.env.production`:
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

### 3. Serve with HTTPS

```bash
# Using Bun with TLS
bun serve --tls-cert=cert.pem --tls-key=key.pem

# Or use reverse proxy (nginx, caddy)
```

### 4. Security Headers

Add to server response:
```typescript
headers: {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
}
```

## Development Tips

### Hot Reload

Bun supports hot reloading out of the box:
```bash
bun --hot src/web/server/index.ts
```

### Browser DevTools

- **Console**: Check for initialization messages and errors
- **Network**: Monitor API calls and WebSocket connections
- **Application**: Inspect LocalStorage for encrypted API key
- **Elements**: Debug UI rendering issues

### Testing API Key Encryption

Open browser console:
```javascript
// Test encryption manually
const { encrypt, decrypt, generateDevicePassphrase } = await import('/scripts/encryption.js');

const passphrase = generateDevicePassphrase();
console.log('Passphrase:', passphrase);

const encrypted = await encrypt('test-api-key', passphrase);
console.log('Encrypted:', encrypted);

const decrypted = await decrypt(encrypted, passphrase);
console.log('Decrypted:', decrypted); // Should be 'test-api-key'
```

## Next Steps

1. ✅ Client-side implementation complete
2. ⏭️ Implement WebSocket progress updates in `src/web/server/websocket.ts`
3. ⏭️ Test end-to-end flow with real Gemini API
4. ⏭️ Add styling enhancements for terminal aesthetics
5. ⏭️ Implement error recovery and retry logic
6. ⏭️ Add unit tests for encryption module
7. ⏭️ Create E2E tests for complete workflow

## Support

For issues or questions:
1. Check `CLIENT_IMPLEMENTATION.md` for detailed documentation
2. Review `src/web/ui/README.md` for API documentation
3. Check browser console for error messages
4. Verify server logs for backend issues

---

**Quick Reference**:
- Main app: `/src/web/ui/scripts/app.js`
- Encryption: `/src/web/security/encryption.ts`
- HTML: `/src/web/ui/index.html`
- Docs: `/src/web/CLIENT_IMPLEMENTATION.md`

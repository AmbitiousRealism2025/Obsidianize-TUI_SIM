import figlet from "figlet";
import {
  handleApiRequest,
  handleEnhancedApiRequest,
  applyMiddleware,
  handleWebSocketUpgrade,
  websocketHandlers,
  responseCacheMiddleware,
  compressionMiddleware
} from './src/web/server/index.js';
import { createLogger } from './src/core/logging/index.js';
import { getConfig, isProduction } from './src/core/config/index.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const logger = createLogger('server');
const config = getConfig();

// Box drawing characters for styling - optimized for ASCII art width
// ASCII art is 76 chars wide, so border is 76 + 8 (4 chars padding each side) + 4 (border chars) = 88
const borderWidth = 88;
const topBorder = "╔" + "═".repeat(borderWidth - 2) + "╗";
const bottomBorder = "╚" + "═".repeat(borderWidth - 2) + "╝";
const sideBorder = "║";

// Static file paths for PWA
const UI_PATH = join(import.meta.dir, 'src/web/ui');

export const app = {
  async fetch(req: Request, server: any): Promise<Response> {
    const url = new URL(req.url);

    // Handle WebSocket upgrade requests
    if (url.pathname.startsWith('/ws/')) {
      const upgraded = handleWebSocketUpgrade(req, server);
      if (upgraded) {
        return new Response(null); // Connection will be upgraded
      }
      return new Response('WebSocket upgrade failed', { status: 400 });
    }

    // Serve PWA manifest
    if (url.pathname === '/manifest.json') {
      const manifestPath = join(UI_PATH, 'manifest.json');
      if (existsSync(manifestPath)) {
        const manifest = readFileSync(manifestPath, 'utf-8');
        return new Response(manifest, {
          headers: { 'Content-Type': 'application/manifest+json' }
        });
      }
    }

    // Serve service worker
    if (url.pathname === '/sw.js') {
      const swPath = join(UI_PATH, 'sw.js');
      if (existsSync(swPath)) {
        const sw = readFileSync(swPath, 'utf-8');
        return new Response(sw, {
          headers: {
            'Content-Type': 'application/javascript',
            'Service-Worker-Allowed': '/'
          }
        });
      }
    }

    // Serve static CSS files
    if (url.pathname === '/styles/terminal.css' || url.pathname === '/styles/landing.css') {
      const cssFile = url.pathname === '/styles/terminal.css' ? 'terminal.css' : 'landing.css';
      const cssPath = join(UI_PATH, 'styles', cssFile);
      if (existsSync(cssPath)) {
        const css = readFileSync(cssPath, 'utf-8');
        return new Response(css, {
          headers: { 'Content-Type': 'text/css' }
        });
      }
    }

    // Serve static JS
    if (url.pathname === '/scripts/app.js') {
      const jsPath = join(UI_PATH, 'scripts/app.js');
      if (existsSync(jsPath)) {
        const js = readFileSync(jsPath, 'utf-8');
        return new Response(js, {
          headers: { 'Content-Type': 'application/javascript' }
        });
      }
    }

    // Handle API routes with full middleware stack
    if (url.pathname.startsWith('/api/')) {
      return applyMiddleware(req, async (req) => {
        // Apply caching middleware
        return responseCacheMiddleware(req, async (req) => {
          // Apply compression middleware
          return compressionMiddleware(req, async (req) => {
            // Try enhanced routes first (Phase 3 features)
            const enhancedResponse = await handleEnhancedApiRequest(req);
            if (enhancedResponse) {
              return enhancedResponse;
            }

            // Fall back to standard routes
            const apiResponse = await handleApiRequest(req);
            if (apiResponse) {
              return apiResponse;
            }

            // No matching API route
            return new Response(
              JSON.stringify({
                error: 'Not found',
                code: 'NOT_FOUND'
              }),
              {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        });
      });
    }

    // Serve ASCII art homepage
    const isHtml = !url.searchParams.has("plain");

    // Generate ASCII art with a stylish font
    const asciiArt = figlet.textSync("OBSIDIANIZE", {
      font: "ANSI Shadow",
      horizontalLayout: "full",
      verticalLayout: "default",
    });

    // Center the ASCII art perfectly
    const lines = asciiArt.split("\n").filter(line => line.trim().length > 0);
    const innerWidth = borderWidth - 4; // Account for side borders (2 chars) and inner padding (2 chars)
    const asciiWidth = 76; // OBSIDIANIZE ASCII art is exactly 76 chars wide
    const leftPadding = Math.floor((innerWidth - asciiWidth) / 2);
    const rightPadding = innerWidth - asciiWidth - leftPadding;

    const centeredLines = lines.map((line) => {
      return `${sideBorder} ${" ".repeat(leftPadding)}${line}${" ".repeat(rightPadding)} ${sideBorder}`;
    });

    // Center the tagline relative to the ASCII art
    const tagline = "✨ Your Knowledge, Crystallized ✨";
    const taglinePadding = Math.floor((borderWidth - tagline.length) / 2);
    const centeredTagline = " ".repeat(taglinePadding) + tagline;

    // Build the complete styled output
    const plainOutput = [
      topBorder,
      `${sideBorder}${" ".repeat(borderWidth - 2)}${sideBorder}`,
      ...centeredLines,
      `${sideBorder}${" ".repeat(borderWidth - 2)}${sideBorder}`,
      bottomBorder,
      "",
      centeredTagline,
      "",
    ].join("\n");

    if (isHtml) {
      // HTML version with CSS styling for browsers
      const htmlOutput = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OBSIDIANIZE</title>
  <!-- PWA Meta Tags -->
  <meta name="description" content="Transform web content into structured Markdown notes using AI">
  <meta name="theme-color" content="#9b59d0">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Obsidianize">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
  <link rel="stylesheet" href="/styles/landing.css">
</head>
<body class="landing-page">
  <div class="landing-container">
    <pre class="border">${topBorder}</pre>
    <pre class="border">${sideBorder}${" ".repeat(borderWidth - 2)}${sideBorder}</pre>
${centeredLines.map(line => `    <pre><span class="border">${sideBorder}</span><span class="ascii-art">${line.slice(2, -2)}</span><span class="border">${sideBorder}</span></pre>`).join("\n")}
    <pre class="border">${sideBorder}${" ".repeat(borderWidth - 2)}${sideBorder}</pre>
    <pre class="border">${bottomBorder}</pre>
    <div class="tagline">${tagline}</div>
    <div class="api-info">
      <strong>API Endpoints:</strong><br>
      • <a href="/api/health">GET /api/health</a> - Health check<br>
      • <a href="/api/dashboard">GET /api/dashboard</a> - System dashboard<br>
      • POST /api/process - Start content processing<br>
      • GET /api/status/:id - Get job status<br>
      • GET /api/download/:id - Download result (Markdown)<br>
      • GET /api/export/:id - Export result (JSON/YAML)<br>
      • POST /api/batch - Batch process multiple URLs<br>
      • <a href="/api/prompts">GET /api/prompts</a> - Custom prompt templates<br>
      • WS /ws/progress/:id - Real-time updates
    </div>
  </div>
  <script>
    // Register Service Worker for PWA support
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('Service Worker registered:', reg.scope))
          .catch(err => console.log('Service Worker registration failed:', err));
      });
    }
  </script>
</body>
</html>`;
      return new Response(htmlOutput, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response(plainOutput, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },

  // WebSocket handlers
  websocket: websocketHandlers
};

if (import.meta.main) {
  const port = config.server.port;
  const host = config.server.host;
  const server = Bun.serve({
    ...app,
    port,
    hostname: host,
  });
  logger.info(`Server started`, {
    url: `http://${host}:${server.port}`,
    environment: config.environment,
    version: config.version
  });
  console.log(`Listening on http://${host}:${server.port} ...`);
}
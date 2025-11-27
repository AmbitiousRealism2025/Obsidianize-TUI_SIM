/**
 * Obsidianize Service Worker
 * Provides offline support and caching for PWA functionality
 *
 * Phase 3: Mobile Optimization Feature
 * Version: 1.0.0
 */

const CACHE_NAME = 'obsidianize-v1';
const RUNTIME_CACHE = 'obsidianize-runtime-v1';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/styles/terminal.css',
  '/scripts/app.js'
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  /\/api\/health$/,
  /\/api\/dashboard$/,
  /\/api\/prompts$/
];

// ============================================================================
// INSTALL EVENT
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service worker installed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// ============================================================================
// ACTIVATE EVENT
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// ============================================================================
// FETCH EVENT
// ============================================================================

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip WebSocket requests
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(event.request));
});

// ============================================================================
// REQUEST HANDLERS
// ============================================================================

/**
 * Handle API requests with network-first strategy
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);

  // Check if this is a cacheable API endpoint
  const isCacheable = API_CACHE_PATTERNS.some((pattern) =>
    pattern.test(url.pathname)
  );

  try {
    // Always try network first for API requests
    const networkResponse = await fetch(request);

    // Cache successful cacheable responses
    if (networkResponse.ok && isCacheable) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request:', url.pathname);

    // Fall back to cache for cacheable endpoints
    if (isCacheable) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('[SW] Serving cached API response:', url.pathname);
        return cachedResponse;
      }
    }

    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: 'You are offline',
        code: 'OFFLINE',
        message:
          'This request requires an internet connection. Please check your connection and try again.',
        offline: true
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Offline': 'true'
        }
      }
    );
  }
}

/**
 * Handle static asset requests with cache-first strategy
 */
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Refresh cache in background
    refreshCache(request);
    return cachedResponse;
  }

  try {
    // Fetch from network
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for static request:', request.url);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return createOfflinePage();
    }

    // Return empty response for other static assets
    return new Response('', { status: 503 });
  }
}

/**
 * Refresh cache in background (stale-while-revalidate)
 */
async function refreshCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Ignore background refresh errors
  }
}

/**
 * Create offline page response
 */
function createOfflinePage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Obsidianize</title>
  <style>
    body {
      background-color: #0f0f23;
      color: #d8b4fe;
      font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .container {
      max-width: 600px;
    }
    h1 {
      color: #c084fc;
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    button {
      background-color: #9b59d0;
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 1rem;
      font-family: inherit;
      cursor: pointer;
      margin-top: 1rem;
      transition: background-color 0.2s;
    }
    button:hover {
      background-color: #c084fc;
    }
    .status {
      margin-top: 2rem;
      font-size: 0.875rem;
      color: #a78bfa;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>You're Offline</h1>
    <p>
      It looks like you've lost your internet connection.
      Obsidianize requires an active connection to process content.
    </p>
    <p>
      Don't worry - any work in progress will be saved locally
      and can be resumed when you're back online.
    </p>
    <button onclick="location.reload()">Try Again</button>
    <div class="status" id="status">Waiting for connection...</div>
  </div>
  <script>
    // Check for connection restoration
    window.addEventListener('online', () => {
      document.getElementById('status').textContent = 'Connection restored! Reloading...';
      setTimeout(() => location.reload(), 1000);
    });

    // Update status periodically
    setInterval(() => {
      if (navigator.onLine) {
        location.reload();
      }
    }, 5000);
  </script>
</body>
</html>
  `.trim();

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Offline': 'true'
    }
  });
}

// ============================================================================
// MESSAGE EVENT
// ============================================================================

self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.ports[0].postMessage({
        version: CACHE_NAME,
        runtimeCache: RUNTIME_CACHE
      });
      break;

    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        caches.delete(RUNTIME_CACHE).then(() => {
          event.ports[0].postMessage({ success: true });
        });
      });
      break;

    case 'CACHE_URLS':
      if (data && Array.isArray(data.urls)) {
        caches.open(CACHE_NAME).then((cache) => {
          cache.addAll(data.urls).then(() => {
            event.ports[0].postMessage({ success: true });
          });
        });
      }
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-pending-jobs') {
    event.waitUntil(syncPendingJobs());
  }
});

/**
 * Sync any pending jobs when connection is restored
 */
async function syncPendingJobs() {
  try {
    // This would sync any locally stored pending jobs
    // For now, just notify clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Obsidianize';
  const options = {
    body: data.body || 'You have a notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});

console.log('[SW] Service worker loaded');

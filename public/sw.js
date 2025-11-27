// Service Worker for PWA with smart caching strategy
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `lms-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `lms-dynamic-${CACHE_VERSION}`;

// Static assets that rarely change
const STATIC_ASSETS = [
    '/login-bg.png',
    '/icon-192.png',
    '/icon-512.png',
    '/manifest.json',
];

// Patterns for dynamic content that should always fetch fresh data
const DYNAMIC_PATTERNS = [
    /\/api\//,           // All API routes
    /\/employee\//,      // Employee pages
    /\/admin\//,         // Admin pages
    /\/trainer\//,       // Trainer pages
    /\/quiz\//,          // Quiz pages
];

// Patterns for static assets that can be cached aggressively
const STATIC_PATTERNS = [
    /\.(js|css|woff2?|ttf|eot)$/,  // JS, CSS, fonts
    /\.(png|jpg|jpeg|gif|svg|webp|avif)$/,  // Images
    /^\/_next\/static\//,  // Next.js static files
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .catch((err) => console.log('Cache install failed:', err))
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Helper: Check if URL matches dynamic patterns
function isDynamicContent(url) {
    return DYNAMIC_PATTERNS.some(pattern => pattern.test(url));
}

// Helper: Check if URL matches static patterns
function isStaticAsset(url) {
    return STATIC_PATTERNS.some(pattern => pattern.test(url));
}

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip chrome extensions and non-http(s) requests
    if (!event.request.url.startsWith('http')) return;

    const url = event.request.url;

    // NETWORK-FIRST for dynamic content (API, user pages, etc.)
    if (isDynamicContent(url)) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Optionally cache successful responses briefly
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache only if network fails (offline)
                    return caches.match(event.request);
                })
        );
        return;
    }

    // CACHE-FIRST for static assets (images, fonts, CSS, JS)
    if (isStaticAsset(url)) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then((response) => {
                        if (response && response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(STATIC_CACHE).then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return response;
                    });
                })
        );
        return;
    }

    // DEFAULT: Network-first for everything else
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
    );
});

const SW_VERSION = 'v1';
const CACHE_NAME = `watersafe-${SW_VERSION}`;
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/icon.svg',
    '/manifest.json',
    '/leaflet.css',
    '/fonts/inter-regular.ttf',
    '/fonts/inter-bold.ttf',
    '/fonts/jetbrains-mono-regular.ttf',
    '/fonts/jetbrains-mono-bold.ttf',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
    );
    self.skipWaiting();
});

// Activate — cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
        ),
    );
    self.clients.claim();
});

// Fetch — network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API requests: network-first with 5s timeout
    if (url.hostname.includes('supabase')) {
        event.respondWith(
            fetch(request).catch(() =>
                caches.match(request).then((r) => r || new Response('Offline', { status: 503 })),
            ),
        );
        return;
    }

    // Static assets: cache-first
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                if (response.ok && request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            });
        }),
    );
});

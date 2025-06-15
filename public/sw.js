// Service Worker for offline functionality and performance
const CACHE_NAME = "jewelry-dashboard-v2"
const STATIC_CACHE = "static-v2"
const DYNAMIC_CACHE = "dynamic-v2"
const API_CACHE = "api-v2"

// Assets to cache immediately
const STATIC_ASSETS = ["/", "/manifest.json", "/offline.html", "/favicon.ico"]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/firestore\.googleapis\.com/,
  /^https:\/\/firebase\.googleapis\.com/,
  /^https:\/\/.*\.firebaseapp\.com/,
]

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: "cache-first",
  NETWORK_FIRST: "network-first",
  STALE_WHILE_REVALIDATE: "stale-while-revalidate",
}

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker: Installing...")

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("📦 Service Worker: Caching static assets")
        return cache.addAll(STATIC_ASSETS)
      }),
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
    ])
      .then(() => {
        console.log("✅ Service Worker: Static assets cached")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("❌ Service Worker: Failed to cache static assets", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker: Activating...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
              console.log("🗑️ Service Worker: Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("✅ Service Worker: Activated")
        return self.clients.claim()
      }),
  )
})

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Handle API requests with network-first strategy
  if (API_CACHE_PATTERNS.some((pattern) => pattern.test(request.url))) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets with cache-first strategy
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(handleStaticAsset(request))
    return
  }

  // Handle navigation requests
  if (request.destination === "document") {
    event.respondWith(handleNavigation(request))
    return
  }

  // Default: network first with cache fallback
  event.respondWith(handleDefault(request))
})

// API request handler - network first with cache fallback
async function handleApiRequest(request) {
  try {
    const cache = await caches.open(API_CACHE)

    // Try network first
    try {
      const response = await fetch(request)

      if (response.status === 200) {
        // Cache successful responses
        cache.put(request, response.clone())
      }

      return response
    } catch (networkError) {
      console.log("📡 Network failed, trying cache:", request.url)

      // Fallback to cache
      const cachedResponse = await cache.match(request)
      if (cachedResponse) {
        return cachedResponse
      }

      throw networkError
    }
  } catch (error) {
    console.error("❌ API request failed:", error)
    return new Response(JSON.stringify({ error: "Network unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Static asset handler - cache first
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE)

  // Try cache first
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  // Fallback to network
  try {
    const response = await fetch(request)

    if (response.status === 200) {
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.error("❌ Static asset failed:", error)
    throw error
  }
}

// Navigation handler - network first with offline fallback
async function handleNavigation(request) {
  try {
    const response = await fetch(request)

    // Cache successful navigation responses
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.log("📡 Navigation offline, serving cached version")

    // Try cached version
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // Fallback to offline page
    return caches.match("/offline.html")
  }
}

// Default handler - stale while revalidate
async function handleDefault(request) {
  const cache = await caches.open(DYNAMIC_CACHE)

  // Get cached version immediately
  const cachedResponse = await cache.match(request)

  // Fetch fresh version in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.status === 200) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cachedResponse)

  // Return cached version immediately, or wait for network
  return cachedResponse || fetchPromise
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("🔄 Service Worker: Background sync triggered")

  if (event.tag === "background-sync") {
    event.waitUntil(handleOfflineActions())
  }
})

// Handle offline actions
async function handleOfflineActions() {
  try {
    console.log("🔄 Service Worker: Handling offline actions")

    // Firebase will handle offline persistence automatically
    // This is where you could implement custom offline action queuing

    // Notify clients that sync is happening
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: "BACKGROUND_SYNC",
        payload: { status: "syncing" },
      })
    })
  } catch (error) {
    console.error("❌ Error handling offline actions:", error)
  }
}

// Handle messages from main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// Push notification handler (for future use)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        tag: data.tag || "default",
        data: data.data,
      }),
    )
  }
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"))
})

console.log("🎉 Service Worker loaded successfully")

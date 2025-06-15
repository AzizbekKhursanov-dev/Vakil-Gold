"use client"

// Service Worker registration and management
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager
  private registration: ServiceWorkerRegistration | null = null

  private constructor() {}

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager()
    }
    return ServiceWorkerManager.instance
  }

  async register(): Promise<void> {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      try {
        this.registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })

        console.log("✅ Service Worker registered successfully")

        // Handle updates
        this.registration.addEventListener("updatefound", () => {
          const newWorker = this.registration?.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content available
                this.notifyUpdate()
              }
            })
          }
        })
      } catch (error) {
        console.error("❌ Service Worker registration failed:", error)
      }
    }
  }

  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister()
      console.log("🗑️ Service Worker unregistered")
    }
  }

  private notifyUpdate(): void {
    // Notify user about available update
    if (window.confirm("Yangi versiya mavjud. Sahifani yangilashni xohlaysizmi?")) {
      window.location.reload()
    }
  }

  async skipWaiting(): Promise<void> {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: "SKIP_WAITING" })
    }
  }

  // Cache management
  async clearCache(): Promise<void> {
    if ("caches" in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      console.log("🧹 Cache cleared")
    }
  }

  async getCacheSize(): Promise<number> {
    if ("caches" in window && "storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    }
    return 0
  }
}

// Initialize service worker
export const initializeServiceWorker = async (): Promise<void> => {
  const swManager = ServiceWorkerManager.getInstance()
  await swManager.register()
}

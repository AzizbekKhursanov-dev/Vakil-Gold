// Performance utilities and optimizations

// Cache with TTL (Time To Live)
export const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

export function setCache(key: string, data: any, ttlMinutes = 5) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMinutes * 60 * 1000,
  })
}

export function getCache(key: string) {
  const cached = cache.get(key)
  if (!cached) return null

  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key)
    return null
  }

  return cached.data
}

export function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}

// Debounce function to limit API calls
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {},
): IntersectionObserver | null {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return null
  }

  return new IntersectionObserver(callback, {
    rootMargin: "50px",
    threshold: 0.1,
    ...options,
  })
}

// Memory usage monitoring
interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

export function getMemoryUsage(): MemoryInfo | null {
  if (typeof window !== "undefined" && "memory" in performance) {
    return (performance as any).memory
  }
  return null
}

// Performance timing utilities
export function measurePerformance<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
  const start = performance.now()

  const result = fn()

  if (result instanceof Promise) {
    return result.finally(() => {
      const end = performance.now()
      console.log(`${name} took ${end - start} milliseconds`)
    })
  } else {
    const end = performance.now()
    console.log(`${name} took ${end - start} milliseconds`)
    return result
  }
}

// Bundle size analyzer helper
export function analyzeBundleSize() {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("Bundle Analysis:")
    console.log("- Firebase SDK size: Check network tab for firebase chunks")
    console.log("- Main bundle: Check for main-*.js size")
    console.log("- Vendor bundle: Check for vendor-*.js size")
    console.log("Run ANALYZE=true npm run build for detailed analysis")
  }
}

// Long task detection
export function detectLongTasks() {
  if (typeof window !== "undefined" && "PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // Tasks longer than 50ms
            console.warn(`Long task detected: ${entry.duration}ms`, entry)
          }
        }
      })

      observer.observe({ entryTypes: ["longtask"] })

      return () => observer.disconnect()
    } catch (error) {
      console.warn("Long task detection not supported:", error)
    }
  }

  return () => {}
}

// Memory leak detection
export function detectMemoryLeaks() {
  if (typeof window !== "undefined") {
    let lastMemory = 0

    const checkMemory = () => {
      const memory = getMemoryUsage()
      if (memory && memory.usedJSHeapSize > lastMemory * 1.5) {
        console.warn("Potential memory leak detected:", {
          current: memory.usedJSHeapSize,
          previous: lastMemory,
          increase: memory.usedJSHeapSize - lastMemory,
        })
      }
      lastMemory = memory?.usedJSHeapSize || 0
    }

    const interval = setInterval(checkMemory, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }

  return () => {}
}

// Image optimization helper
export function optimizeImageLoading() {
  if (typeof window !== "undefined") {
    // Add loading="lazy" to images without it
    const images = document.querySelectorAll("img:not([loading])")
    images.forEach((img) => {
      img.setAttribute("loading", "lazy")
    })

    // Add content-visibility to off-screen content
    const offScreenElements = document.querySelectorAll("[data-lazy]")
    offScreenElements.forEach((el) => {
      ;(el as HTMLElement).style.contentVisibility = "auto"
    })
  }
}

// Critical resource hints
export function addResourceHints() {
  if (typeof document !== "undefined") {
    // Preconnect to Firebase
    const preconnectLink = document.createElement("link")
    preconnectLink.rel = "preconnect"
    preconnectLink.href = "https://firestore.googleapis.com"
    document.head.appendChild(preconnectLink)

    // DNS prefetch for other Firebase services
    const dnsPrefetchLink = document.createElement("link")
    dnsPrefetchLink.rel = "dns-prefetch"
    dnsPrefetchLink.href = "https://firebase.googleapis.com"
    document.head.appendChild(dnsPrefetchLink)
  }
}

// Virtual scrolling for large lists
export class VirtualScrollManager {
  private containerHeight: number
  private itemHeight: number
  private overscan: number

  constructor(containerHeight: number, itemHeight: number, overscan = 5) {
    this.containerHeight = containerHeight
    this.itemHeight = itemHeight
    this.overscan = overscan
  }

  getVisibleRange(scrollTop: number, totalItems: number) {
    const visibleStart = Math.floor(scrollTop / this.itemHeight)
    const visibleEnd = Math.min(visibleStart + Math.ceil(this.containerHeight / this.itemHeight), totalItems)

    return {
      start: Math.max(0, visibleStart - this.overscan),
      end: Math.min(totalItems, visibleEnd + this.overscan),
    }
  }

  getTotalHeight(totalItems: number) {
    return totalItems * this.itemHeight
  }

  getOffsetY(startIndex: number) {
    return startIndex * this.itemHeight
  }
}

// Client-side performance monitoring setup
import { performance as firebasePerformance } from "@/lib/config/firebase-optimized"

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private traces: Map<string, any> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Start a custom trace
  startTrace(name: string): void {
    if (typeof window !== "undefined" && firebasePerformance) {
      try {
        const trace = firebasePerformance.trace(name)
        trace.start()
        this.traces.set(name, trace)
      } catch (error) {
        console.warn(`Failed to start trace ${name}:`, error)
      }
    }
  }

  // Stop a custom trace
  stopTrace(name: string): void {
    if (typeof window !== "undefined" && this.traces.has(name)) {
      try {
        const trace = this.traces.get(name)
        trace.stop()
        this.traces.delete(name)
      } catch (error) {
        console.warn(`Failed to stop trace ${name}:`, error)
      }
    }
  }

  // Add custom attributes to a trace
  addTraceAttribute(traceName: string, attribute: string, value: string): void {
    if (this.traces.has(traceName)) {
      try {
        const trace = this.traces.get(traceName)
        trace.putAttribute(attribute, value)
      } catch (error) {
        console.warn(`Failed to add attribute to trace ${traceName}:`, error)
      }
    }
  }

  // Monitor page load performance
  monitorPageLoad(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("load", () => {
        // Monitor Core Web Vitals
        this.monitorCoreWebVitals()

        // Monitor resource loading
        this.monitorResourceLoading()

        // Monitor Firebase operations
        this.monitorFirebaseOperations()
      })
    }
  }

  private monitorCoreWebVitals(): void {
    if ("web-vitals" in window) {
      // This would require installing web-vitals package
      // import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
      console.log("Core Web Vitals monitoring would be implemented here")
    }
  }

  private monitorResourceLoading(): void {
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name.includes("firebase") || entry.name.includes("firestore")) {
              console.log(`Firebase resource: ${entry.name} - ${entry.duration}ms`)
            }
          }
        })

        observer.observe({ entryTypes: ["resource"] })
      } catch (error) {
        console.warn("Resource monitoring not supported:", error)
      }
    }
  }

  private monitorFirebaseOperations(): void {
    // Monitor Firestore operations
    this.startTrace("firestore_operations")

    // Monitor Auth operations
    this.startTrace("auth_operations")

    // Monitor Storage operations
    this.startTrace("storage_operations")
  }
}

// Initialize performance monitoring
export function initializePerformanceMonitoring(): void {
  if (typeof window !== "undefined") {
    const monitor = PerformanceMonitor.getInstance()
    monitor.monitorPageLoad()

    // Add global error handling
    window.addEventListener("error", (event) => {
      console.error("Global error:", event.error)
      // Report to Firebase Performance Monitoring
    })

    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason)
      // Report to Firebase Performance Monitoring
    })
  }
}

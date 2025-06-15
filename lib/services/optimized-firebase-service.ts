// Optimized Firebase service with query optimization and caching
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type QueryConstraint,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
  enableIndexedDbPersistence,
} from "firebase/firestore"
import { db } from "@/lib/config/firebase-optimized"

// Cache for frequently accessed data
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Enable offline persistence
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.")
    } else if (err.code === "unimplemented") {
      console.warn("The current browser does not support all of the features required to enable persistence")
    }
  })
}

export class OptimizedFirebaseService<T extends { id: string }> {
  private collectionName: string
  private activeListeners: Set<Unsubscribe> = new Set()

  constructor(collectionName: string) {
    this.collectionName = collectionName
  }

  // Optimized query with caching and pagination
  async getAll(queryConstraints: QueryConstraint[] = [], useCache = true, pageSize = 50): Promise<T[]> {
    try {
      const cacheKey = `${this.collectionName}-${JSON.stringify(queryConstraints)}`

      // Check cache first
      if (useCache && queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey)!
        if (Date.now() - cached.timestamp < cached.ttl) {
          return cached.data
        }
      }

      // Add pagination limit if not specified
      const hasLimit = queryConstraints.some((constraint) => constraint.type === "limit")
      if (!hasLimit) {
        queryConstraints.push(limit(pageSize))
      }

      const q = query(collection(db, this.collectionName), ...queryConstraints)
      const querySnapshot = await getDocs(q)

      const data = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as T,
      )

      // Cache the result
      if (useCache) {
        queryCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: CACHE_TTL,
        })
      }

      return data
    } catch (error) {
      console.error(`Error getting ${this.collectionName}:`, error)
      throw error
    }
  }

  // Optimized single document fetch with caching
  async getById(id: string, useCache = true): Promise<T | null> {
    try {
      const cacheKey = `${this.collectionName}-${id}`

      if (useCache && queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey)!
        if (Date.now() - cached.timestamp < cached.ttl) {
          return cached.data
        }
      }

      const docRef = doc(db, this.collectionName, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as T

        if (useCache) {
          queryCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            ttl: CACHE_TTL,
          })
        }

        return data
      }

      return null
    } catch (error) {
      console.error(`Error getting ${this.collectionName} by ID:`, error)
      throw error
    }
  }

  // Batch operations for better performance
  async createBatch(items: Omit<T, "id">[]): Promise<string[]> {
    try {
      const { writeBatch } = await import("firebase/firestore")
      const batch = writeBatch(db)
      const docRefs: string[] = []

      items.forEach((item) => {
        const docRef = doc(collection(db, this.collectionName))
        batch.set(docRef, {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        docRefs.push(docRef.id)
      })

      await batch.commit()
      this.invalidateCache()
      return docRefs
    } catch (error) {
      console.error(`Error creating batch ${this.collectionName}:`, error)
      throw error
    }
  }

  // Optimized real-time listener with cleanup
  onSnapshot(
    queryConstraints: QueryConstraint[] = [],
    callback: (data: T[]) => void,
    errorCallback?: (error: Error) => void,
    pageSize = 50,
  ): Unsubscribe {
    // Add pagination if not specified
    const hasLimit = queryConstraints.some((constraint) => constraint.type === "limit")
    if (!hasLimit) {
      queryConstraints.push(limit(pageSize))
    }

    const q = query(collection(db, this.collectionName), ...queryConstraints)

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as T,
        )
        callback(items)
      },
      (error) => {
        console.error(`Error in ${this.collectionName} snapshot:`, error)
        if (errorCallback) errorCallback(error)
      },
    )

    this.activeListeners.add(unsubscribe)
    return () => {
      unsubscribe()
      this.activeListeners.delete(unsubscribe)
    }
  }

  // Cleanup method to remove all listeners
  cleanup(): void {
    this.activeListeners.forEach((unsubscribe) => unsubscribe())
    this.activeListeners.clear()
  }

  // Cache invalidation
  private invalidateCache(): void {
    const keysToDelete = Array.from(queryCache.keys()).filter((key) => key.startsWith(this.collectionName))
    keysToDelete.forEach((key) => queryCache.delete(key))
  }

  // Optimized query builder with indexing hints
  buildOptimizedQuery(filters: Record<string, any> = {}): QueryConstraint[] {
    const constraints: QueryConstraint[] = []

    // Process filters in order of selectivity (most selective first)
    const filterEntries = Object.entries(filters).sort(([, a], [, b]) => {
      // Prioritize equality filters over range filters
      if (typeof a === "string" && typeof b !== "string") return -1
      if (typeof a !== "string" && typeof b === "string") return 1
      return 0
    })

    filterEntries.forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (key === "orderBy" && typeof value === "string") {
          constraints.push(orderBy(value))
        } else if (key === "orderByDesc" && typeof value === "string") {
          constraints.push(orderBy(value, "desc"))
        } else if (key === "limit" && typeof value === "number") {
          constraints.push(limit(Math.min(value, 100))) // Cap at 100 for performance
        } else if (key === "startAfter" && value) {
          constraints.push(startAfter(value))
        } else if (!["startAfter", "limit", "orderBy", "orderByDesc"].includes(key)) {
          constraints.push(where(key, "==", value))
        }
      }
    })

    return constraints
  }
}

// Global cache cleanup
export function clearFirebaseCache(): void {
  queryCache.clear()
}

// Memory usage monitoring
export function getFirebaseCacheStats(): { size: number; keys: string[] } {
  return {
    size: queryCache.size,
    keys: Array.from(queryCache.keys()),
  }
}

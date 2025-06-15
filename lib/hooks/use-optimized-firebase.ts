"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import {
  collection,
  query,
  onSnapshot,
  type QueryConstraint,
  type DocumentData,
  startAfter,
  limit,
  getDocs,
} from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { useLocalStorageCache } from "./use-local-storage"

interface UseOptimizedFirebaseOptions {
  enableCache?: boolean
  cacheTTL?: number
  enableRealtime?: boolean
  batchSize?: number
}

export function useOptimizedFirebase<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  options: UseOptimizedFirebaseOptions = {},
) {
  const { enableCache = true, cacheTTL = 5, enableRealtime = true, batchSize = 50 } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const isInitializedRef = useRef(false)

  // Stable cache key
  const cacheKey = useMemo(
    () => `firebase_${collectionName}_${JSON.stringify(constraints.map((c) => c.toString()))}`,
    [collectionName, constraints],
  )

  const { getCachedData, setCachedData } = useLocalStorageCache<T[]>(cacheKey, cacheTTL)

  // Stable fetch function
  const fetchData = useCallback(async () => {
    if (isInitializedRef.current) return

    try {
      setLoading(true)
      setError(null)

      // Try to get cached data first
      if (enableCache) {
        const cachedData = getCachedData()
        if (cachedData && cachedData.length > 0) {
          setData(cachedData)
          setLoading(false)
          isInitializedRef.current = true
          return
        }
      }

      // Create query
      const q = query(collection(db, collectionName), ...constraints)

      if (enableRealtime) {
        // Set up real-time listener
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const items = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt:
                doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString(),
              updatedAt:
                doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt || new Date().toISOString(),
            })) as T[]

            setData(items)
            setLoading(false)
            isInitializedRef.current = true

            // Cache the data
            if (enableCache) {
              setCachedData(items)
            }
          },
          (err) => {
            console.error(`Error fetching ${collectionName}:`, err)
            setError(`Failed to fetch ${collectionName}`)
            setLoading(false)
            isInitializedRef.current = true
          },
        )

        unsubscribeRef.current = unsubscribe
      }
    } catch (err: any) {
      console.error(`Error setting up ${collectionName} listener:`, err)
      setError(err.message)
      setLoading(false)
      isInitializedRef.current = true
    }
  }, [collectionName, enableCache, enableRealtime, getCachedData, setCachedData])

  useEffect(() => {
    fetchData()

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      isInitializedRef.current = false
    }
  }, [fetchData])

  const refetch = useCallback(() => {
    isInitializedRef.current = false
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch,
  }
}

// Optimized hook for paginated data
export function useOptimizedPaginatedFirebase<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  pageSize = 20,
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastDocRef = useRef<any>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)
      setError(null)

      let q = query(collection(db, collectionName), ...constraints)

      if (lastDocRef.current) {
        q = query(q, startAfter(lastDocRef.current))
      }

      q = query(q, limit(pageSize))

      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setHasMore(false)
        setLoading(false)
        return
      }

      const newItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt || new Date().toISOString(),
      })) as T[]

      setData((prev) => [...prev, ...newItems])
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1]

      if (snapshot.docs.length < pageSize) {
        setHasMore(false)
      }
    } catch (err: any) {
      console.error(`Error loading more ${collectionName}:`, err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [collectionName, constraints, pageSize, loading, hasMore])

  const reset = useCallback(() => {
    setData([])
    setHasMore(true)
    lastDocRef.current = null
  }, [])

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
  }
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { FirebaseService } from "@/lib/services/firebase-service"
import { type QueryConstraint, where, orderBy, limit, startAfter } from "firebase/firestore"

interface UseFirebaseDataOptions<T> {
  collectionName: string
  filters?: Record<string, any>
  defaultSort?: { field: string; direction: "asc" | "desc" }
  pageSize?: number
  realtime?: boolean
}

export function useFirebaseData<T extends { id: string }>(options: UseFirebaseDataOptions<T>) {
  const { collectionName, filters = {}, defaultSort, pageSize = 50, realtime = false } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)

  const service = new FirebaseService<T>(collectionName)

  const buildQueryConstraints = useCallback(() => {
    const constraints: QueryConstraint[] = []

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        constraints.push(where(key, "==", value))
      }
    })

    // Add sorting
    if (defaultSort) {
      constraints.push(orderBy(defaultSort.field, defaultSort.direction))
    }

    // Add pagination
    if (pageSize) {
      constraints.push(limit(pageSize))
    }

    // Add starting point for pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc))
    }

    return constraints
  }, [filters, defaultSort, pageSize, lastDoc])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const constraints = buildQueryConstraints()
      const result = await service.getAll(constraints)

      setData(result)
      setHasMore(result.length === pageSize)
      setLastDoc(result[result.length - 1])
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [service, buildQueryConstraints, pageSize])

  const fetchMore = useCallback(async () => {
    if (!hasMore || loading) return

    try {
      setLoading(true)

      const constraints = buildQueryConstraints()
      const result = await service.getAll(constraints)

      setData((prev) => [...prev, ...result])
      setHasMore(result.length === pageSize)
      setLastDoc(result[result.length - 1])
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [hasMore, loading, service, buildQueryConstraints, pageSize])

  const refresh = useCallback(() => {
    setLastDoc(null)
    setHasMore(true)
    fetchData()
  }, [fetchData])

  // Initial data fetch
  useEffect(() => {
    if (!realtime) {
      fetchData()
    }
  }, [fetchData, realtime])

  // Realtime updates
  useEffect(() => {
    if (realtime) {
      setLoading(true)

      const constraints = buildQueryConstraints()
      const unsubscribe = service.onSnapshot(
        constraints,
        (result) => {
          setData(result)
          setLoading(false)
          setError(null)
        },
        (err) => {
          setError(err.message)
          setLoading(false)
        },
      )

      return () => unsubscribe()
    }
  }, [realtime, service, buildQueryConstraints])

  return {
    data,
    loading,
    error,
    hasMore,
    fetchMore,
    refresh,
  }
}

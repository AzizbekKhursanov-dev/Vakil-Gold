"use client"

// Optimized items hook with React.memo and performance improvements
import { useState, useEffect, useCallback, useMemo } from "react"
import { OptimizedFirebaseService } from "@/lib/services/optimized-firebase-service"
import type { Item, ItemFilters } from "@/lib/types/item"
import { debounce } from "@/lib/utils/performance"

const itemService = new OptimizedFirebaseService<Item>("items")

// Memoized hook for items with performance optimizations
export function useOptimizedItems(filters: ItemFilters = {}, pageSize = 50) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<any>(null)

  // Memoize query constraints to prevent unnecessary re-renders
  const queryConstraints = useMemo(() => {
    return itemService.buildOptimizedQuery({
      ...filters,
      limit: pageSize,
      ...(lastDoc && { startAfter: lastDoc }),
    })
  }, [filters, pageSize, lastDoc])

  // Debounced fetch function to prevent excessive API calls
  const debouncedFetch = useCallback(
    debounce(async (constraints: any[], isLoadMore = false) => {
      try {
        setLoading(true)
        setError(null)

        const newItems = await itemService.getAll(constraints, true, pageSize)

        if (isLoadMore) {
          setItems((prev) => [...prev, ...newItems])
        } else {
          setItems(newItems)
        }

        setHasMore(newItems.length === pageSize)
        if (newItems.length > 0) {
          setLastDoc(newItems[newItems.length - 1])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        console.error("Error fetching items:", err)
      } finally {
        setLoading(false)
      }
    }, 300),
    [pageSize],
  )

  // Load more items for pagination
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const loadMoreConstraints = itemService.buildOptimizedQuery({
        ...filters,
        limit: pageSize,
        startAfter: lastDoc,
      })
      debouncedFetch(loadMoreConstraints, true)
    }
  }, [filters, pageSize, lastDoc, loading, hasMore, debouncedFetch])

  // Refresh items
  const refresh = useCallback(() => {
    setLastDoc(null)
    setHasMore(true)
    const refreshConstraints = itemService.buildOptimizedQuery({
      ...filters,
      limit: pageSize,
    })
    debouncedFetch(refreshConstraints, false)
  }, [filters, pageSize, debouncedFetch])

  // Effect to fetch items when filters change
  useEffect(() => {
    refresh()
  }, [refresh])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      itemService.cleanup()
    }
  }, [])

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    // Memoized computed values
    totalItems: items.length,
    isEmpty: items.length === 0 && !loading,
  }
}

// Memoized item statistics hook
export function useItemStats(filters: ItemFilters = {}) {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalWeight: 0,
    totalValue: 0,
    availableItems: 0,
    soldItems: 0,
    returnedItems: 0,
    branchItems: 0,
    centralItems: 0,
  })
  const [loading, setLoading] = useState(true)

  const debouncedFetchStats = useCallback(
    debounce(async (currentFilters: ItemFilters) => {
      try {
        setLoading(true)
        // Use a smaller sample for stats to improve performance
        const sampleItems = await itemService.getAll(
          itemService.buildOptimizedQuery({ ...currentFilters, limit: 1000 }),
          true,
          1000,
        )

        const newStats = {
          totalItems: sampleItems.length,
          totalWeight: sampleItems.reduce((sum, item) => sum + item.weight, 0),
          totalValue: sampleItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0),
          availableItems: sampleItems.filter((item) => item.status === "available").length,
          soldItems: sampleItems.filter((item) => item.status === "sold").length,
          returnedItems: sampleItems.filter((item) => item.status === "returned").length,
          branchItems: sampleItems.filter((item) => !item.isProvider).length,
          centralItems: sampleItems.filter((item) => item.isProvider).length,
        }

        setStats(newStats)
      } catch (error) {
        console.error("Error fetching item stats:", error)
      } finally {
        setLoading(false)
      }
    }, 500),
    [],
  )

  useEffect(() => {
    debouncedFetchStats(filters)
  }, [filters, debouncedFetchStats])

  return { stats, loading }
}

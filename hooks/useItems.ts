"use client"

import { useState, useEffect, useCallback } from "react"
import { itemService } from "@/lib/services/itemService"
import type { Item } from "@/lib/types/item"
import { useOfflineStatus } from "./use-offline-status"
import { initializeFirebase } from "@/lib/firebase/config"

interface UseItemsOptions {
  category?: string
  status?: string
  branch?: string
  search?: string
  autoRefresh?: boolean
}

interface UseItemsReturn {
  items: Item[]
  loading: boolean
  error: string | null
  stats: {
    total: number
    available: number
    sold: number
    totalValue: number
    totalWeight: number
  }
  refreshItems: () => Promise<void>
  isInitialized: boolean
}

export function useItems(options: UseItemsOptions = {}): UseItemsReturn {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const { isOnline, wasOffline } = useOfflineStatus()

  const refreshItems = useCallback(async () => {
    try {
      setError(null)

      if (isOnline) {
        await itemService.syncItems()
      }

      const filteredItems = itemService.getCachedItems({
        category: options.category,
        status: options.status,
        branch: options.branch,
        search: options.search,
      })

      setItems(filteredItems)
    } catch (err) {
      console.error("Failed to refresh items:", err)
      setError(err instanceof Error ? err.message : "Failed to load items")

      // Fallback to cached data
      const cachedItems = itemService.getCachedItems({
        category: options.category,
        status: options.status,
        branch: options.branch,
        search: options.search,
      })
      setItems(cachedItems)
    } finally {
      setLoading(false)
    }
  }, [options.category, options.status, options.branch, options.search, isOnline])

  // Initialize service and load data
  useEffect(() => {
    let mounted = true

    const initializeAndLoad = async () => {
      try {
        setLoading(true)

        // Initialize Firebase first
        await initializeFirebase()

        // Then initialize the item service
        await itemService.initializeCache()

        if (mounted) {
          setIsInitialized(true)
          await refreshItems()
        }
      } catch (err) {
        console.error("Failed to initialize items:", err)
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize")
          setLoading(false)
        }
      }
    }

    initializeAndLoad()

    return () => {
      mounted = false
    }
  }, [])

  // Subscribe to item changes
  useEffect(() => {
    const unsubscribe = itemService.subscribe(() => {
      const filteredItems = itemService.getCachedItems({
        category: options.category,
        status: options.status,
        branch: options.branch,
        search: options.search,
      })
      setItems(filteredItems)
    })

    return unsubscribe
  }, [options.category, options.status, options.branch, options.search])

  // Refresh when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && isInitialized) {
      refreshItems()
    }
  }, [isOnline, wasOffline, isInitialized, refreshItems])

  // Auto-refresh based on filters
  useEffect(() => {
    if (isInitialized) {
      refreshItems()
    }
  }, [options.category, options.status, options.branch, options.search, isInitialized, refreshItems])

  const stats = itemService.getStats()

  return {
    items,
    loading,
    error,
    stats,
    refreshItems,
    isInitialized,
  }
}

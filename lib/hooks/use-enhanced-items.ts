"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { debounce } from "lodash"
import { useOfflineStatus } from "@/hooks/use-offline-status"
import { itemService } from "@/lib/services/item.service"
import type { Item, ItemFilters, ItemFormData } from "@/lib/types/item"

interface UseEnhancedItemsOptions extends ItemFilters {
  limit?: number
  realtime?: boolean
  sortField?: string
  sortDirection?: "asc" | "desc"
  enableOfflineSupport?: boolean
}

interface OfflineAction {
  id: string
  type: "create" | "update" | "delete"
  data: any
  timestamp: number
}

export function useEnhancedItems(options: UseEnhancedItemsOptions = {}) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [offlineActions, setOfflineActions] = useState<OfflineAction[]>([])

  const { isOnline, wasOffline } = useOfflineStatus()
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const {
    search,
    category,
    status,
    branch,
    isProvider,
    startDate,
    endDate,
    limit: itemLimit = 50,
    realtime = false,
    sortField = "createdAt",
    sortDirection = "desc",
    enableOfflineSupport = true,
  } = options

  // Debounced state update to reduce re-renders
  const debouncedSetItems = useCallback(
    debounce((newItems: Item[]) => {
      setItems(newItems)
      setLoading(false)
    }, 100),
    [],
  )

  // Load offline actions from localStorage
  const loadOfflineActions = useCallback(() => {
    if (enableOfflineSupport && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("offline-actions")
        if (stored) {
          setOfflineActions(JSON.parse(stored))
        }
      } catch (error) {
        console.error("Error loading offline actions:", error)
      }
    }
  }, [enableOfflineSupport])

  // Save offline actions to localStorage
  const saveOfflineActions = useCallback(
    (actions: OfflineAction[]) => {
      if (enableOfflineSupport && typeof window !== "undefined") {
        try {
          localStorage.setItem("offline-actions", JSON.stringify(actions))
          setOfflineActions(actions)
        } catch (error) {
          console.error("Error saving offline actions:", error)
        }
      }
    },
    [enableOfflineSupport],
  )

  // Add offline action
  const addOfflineAction = useCallback(
    (action: Omit<OfflineAction, "id" | "timestamp">) => {
      const newAction: OfflineAction = {
        ...action,
        id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      }

      const updatedActions = [...offlineActions, newAction]
      saveOfflineActions(updatedActions)
    },
    [offlineActions, saveOfflineActions],
  )

  // Process offline actions when back online
  const processOfflineActions = useCallback(async () => {
    if (!isOnline || offlineActions.length === 0) return

    console.log(`Processing ${offlineActions.length} offline actions...`)

    const processedActions: string[] = []

    for (const action of offlineActions) {
      try {
        switch (action.type) {
          case "create":
            await itemService.createItem(action.data)
            break
          case "update":
            await itemService.updateItem(action.data.id, action.data.updates)
            break
          case "delete":
            await itemService.deleteItem(action.data.id)
            break
        }
        processedActions.push(action.id)
      } catch (error) {
        console.error(`Error processing offline action ${action.id}:`, error)
      }
    }

    // Remove processed actions
    const remainingActions = offlineActions.filter((action) => !processedActions.includes(action.id))
    saveOfflineActions(remainingActions)

    // Refresh data after processing
    if (processedActions.length > 0) {
      await refreshItems()
    }
  }, [isOnline, offlineActions, saveOfflineActions])

  // Fetch items with offline support
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const filters = {
        search,
        category,
        status,
        branch,
        isProvider,
        startDate,
        endDate,
        limit: itemLimit,
        sortField,
        sortDirection,
      }

      if (isOnline) {
        const { items: fetchedItems, totalCount: count } = await itemService.getItemsWithCount(filters)
        debouncedSetItems(fetchedItems)
        setTotalCount(count)

        // Cache data for offline use
        if (enableOfflineSupport) {
          localStorage.setItem("cached-items", JSON.stringify(fetchedItems))
          localStorage.setItem("cached-items-timestamp", Date.now().toString())
        }
      } else if (enableOfflineSupport) {
        // Load from cache when offline
        try {
          const cachedItems = localStorage.getItem("cached-items")
          if (cachedItems) {
            const parsedItems = JSON.parse(cachedItems)
            debouncedSetItems(parsedItems)
            setTotalCount(parsedItems.length)
          }
        } catch (error) {
          console.error("Error loading cached items:", error)
          setError("Keshda saqlangan ma'lumotlarni yuklashda xatolik")
        }
      }
    } catch (err: any) {
      setError(err.message || "Mahsulotlarni yuklashda xatolik yuz berdi")
      setLoading(false)
    }
  }, [
    search,
    category,
    status,
    branch,
    isProvider,
    startDate,
    endDate,
    itemLimit,
    sortField,
    sortDirection,
    isOnline,
    enableOfflineSupport,
    debouncedSetItems,
  ])

  // Real-time subscription with debouncing
  useEffect(() => {
    if (!realtime || !isOnline) {
      fetchItems()
      return
    }

    setLoading(true)

    const filters = {
      category,
      status,
      branch,
      isProvider,
      startDate,
      endDate,
      limit: itemLimit,
      sortField,
      sortDirection,
    }

    const unsubscribe = itemService.subscribeToItems(
      filters,
      (fetchedItems) => {
        // Apply client-side search filter
        let filteredItems = fetchedItems
        if (search) {
          const searchTerm = search.toLowerCase()
          filteredItems = fetchedItems.filter(
            (item) =>
              item.model.toLowerCase().includes(searchTerm) ||
              item.category.toLowerCase().includes(searchTerm) ||
              (item.notes && item.notes.toLowerCase().includes(searchTerm)),
          )
        }

        debouncedSetItems(filteredItems)
        setTotalCount(filteredItems.length)
        setError(null)
      },
      (err) => {
        setError(err.message || "Real-time ma'lumotlarni yuklashda xatolik")
        setLoading(false)
      },
    )

    unsubscribeRef.current = unsubscribe
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [
    realtime,
    isOnline,
    category,
    status,
    branch,
    isProvider,
    startDate,
    endDate,
    itemLimit,
    sortField,
    sortDirection,
    search,
    debouncedSetItems,
    fetchItems,
  ])

  // Process offline actions when coming back online
  useEffect(() => {
    if (wasOffline && isOnline) {
      processOfflineActions()
    }
  }, [wasOffline, isOnline, processOfflineActions])

  // Load offline actions on mount
  useEffect(() => {
    loadOfflineActions()
  }, [loadOfflineActions])

  const refreshItems = useCallback(() => {
    if (realtime && isOnline) {
      // Real-time data will automatically refresh
      return Promise.resolve()
    }
    return fetchItems()
  }, [realtime, isOnline, fetchItems])

  // Enhanced create item with offline support
  const createItem = useCallback(
    async (data: ItemFormData) => {
      try {
        if (isOnline) {
          const id = await itemService.createItem(data)
          if (!realtime) {
            await refreshItems()
          }
          return id
        } else if (enableOfflineSupport) {
          // Store for later sync
          addOfflineAction({
            type: "create",
            data,
          })

          // Add optimistic update
          const optimisticItem: Item = {
            id: `temp-${Date.now()}`,
            ...data,
            status: "available",
            sellingPrice: 0, // Will be calculated on sync
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Item

          setItems((prev) => [optimisticItem, ...prev])
          return optimisticItem.id
        } else {
          throw new Error("Internet aloqasi yo'q")
        }
      } catch (error: any) {
        throw new Error(error.message || "Mahsulot yaratishda xatolik yuz berdi")
      }
    },
    [isOnline, enableOfflineSupport, realtime, refreshItems, addOfflineAction],
  )

  // Enhanced update item with offline support
  const updateItem = useCallback(
    async (id: string, data: Partial<ItemFormData>) => {
      try {
        if (isOnline) {
          await itemService.updateItem(id, data)
          if (!realtime) {
            await refreshItems()
          }
        } else if (enableOfflineSupport) {
          addOfflineAction({
            type: "update",
            data: { id, updates: data },
          })

          // Optimistic update
          setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)))
        } else {
          throw new Error("Internet aloqasi yo'q")
        }
      } catch (error: any) {
        throw new Error(error.message || "Mahsulotni yangilashda xatolik yuz berdi")
      }
    },
    [isOnline, enableOfflineSupport, realtime, refreshItems, addOfflineAction],
  )

  // Enhanced delete item with offline support
  const deleteItem = useCallback(
    async (id: string) => {
      try {
        if (isOnline) {
          await itemService.deleteItem(id)
          if (!realtime) {
            await refreshItems()
          }
        } else if (enableOfflineSupport) {
          addOfflineAction({
            type: "delete",
            data: { id },
          })

          // Optimistic update
          setItems((prev) => prev.filter((item) => item.id !== id))
        } else {
          throw new Error("Internet aloqasi yo'q")
        }
      } catch (error: any) {
        throw new Error(error.message || "Mahsulotni o'chirishda xatolik yuz berdi")
      }
    },
    [isOnline, enableOfflineSupport, realtime, refreshItems, addOfflineAction],
  )

  return {
    items,
    loading,
    error,
    totalCount,
    isOnline,
    offlineActions: offlineActions.length,
    refreshItems,
    createItem,
    updateItem,
    deleteItem,
    processOfflineActions,
  }
}

"use client"

import { useState, useEffect, useCallback } from "react"
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type Unsubscribe,
  type QueryConstraint,
} from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { itemService } from "@/lib/services/item.service"
import type { Item, ItemFilters, ItemFormData } from "@/lib/types/item"

interface UseItemsOptions extends ItemFilters {
  limit?: number
  realtime?: boolean
  sortField?: string
  sortDirection?: "asc" | "desc"
}

export function useItems(options: UseItemsOptions = {}) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

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
  } = options

  const buildQuery = useCallback(() => {
    const constraints: QueryConstraint[] = []

    // Add filters
    if (category) constraints.push(where("category", "==", category))
    if (status) constraints.push(where("status", "==", status))
    if (branch) constraints.push(where("branch", "==", branch))
    if (isProvider !== undefined) constraints.push(where("isProvider", "==", isProvider))
    if (startDate) constraints.push(where("createdAt", ">=", startDate))
    if (endDate) constraints.push(where("createdAt", "<=", endDate))

    // Add sorting
    constraints.push(orderBy(sortField, sortDirection))

    // Add limit
    if (itemLimit) constraints.push(limit(itemLimit))

    return query(collection(db, "items"), ...constraints)
  }, [category, status, branch, isProvider, startDate, endDate, sortField, sortDirection, itemLimit])

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

      const { items: fetchedItems, totalCount: count } = await itemService.getItemsWithCount(filters)
      setItems(fetchedItems)
      setTotalCount(count)
    } catch (err: any) {
      setError(err.message || "Mahsulotlarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }, [search, category, status, branch, isProvider, startDate, endDate, itemLimit, sortField, sortDirection])

  // Real-time subscription
  useEffect(() => {
    if (!realtime) {
      fetchItems()
      return
    }

    setLoading(true)
    const q = buildQuery()

    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        let fetchedItems = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Item[]

        // Apply client-side search filter
        if (search) {
          const searchTerm = search.toLowerCase()
          fetchedItems = fetchedItems.filter(
            (item) =>
              item.model.toLowerCase().includes(searchTerm) ||
              item.category.toLowerCase().includes(searchTerm) ||
              (item.notes && item.notes.toLowerCase().includes(searchTerm)),
          )
        }

        setItems(fetchedItems)
        setTotalCount(fetchedItems.length)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message || "Real-time ma'lumotlarni yuklashda xatolik")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [realtime, buildQuery, search, fetchItems])

  // Non-real-time fetch
  useEffect(() => {
    if (!realtime) {
      fetchItems()
    }
  }, [realtime, fetchItems])

  const refreshItems = useCallback(() => {
    if (realtime) {
      // Real-time data will automatically refresh
      return
    }
    fetchItems()
  }, [realtime, fetchItems])

  const createItem = useCallback(
    async (data: ItemFormData) => {
      try {
        const id = await itemService.createItem(data)
        if (!realtime) {
          await refreshItems()
        }
        return id
      } catch (error: any) {
        throw new Error(error.message || "Mahsulot yaratishda xatolik yuz berdi")
      }
    },
    [realtime, refreshItems],
  )

  const updateItem = useCallback(
    async (id: string, data: Partial<ItemFormData>) => {
      try {
        await itemService.updateItem(id, data)
        if (!realtime) {
          await refreshItems()
        }
      } catch (error: any) {
        throw new Error(error.message || "Mahsulotni yangilashda xatolik yuz berdi")
      }
    },
    [realtime, refreshItems],
  )

  const updateItemStatus = useCallback(
    async (id: string, status: "sold" | "returned") => {
      try {
        await itemService.updateItemStatus(id, status)
        if (!realtime) {
          await refreshItems()
        }
      } catch (error: any) {
        throw new Error(error.message || "Mahsulot holatini yangilashda xatolik yuz berdi")
      }
    },
    [realtime, refreshItems],
  )

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        await itemService.deleteItem(id)
        if (!realtime) {
          await refreshItems()
        }
      } catch (error: any) {
        throw new Error(error.message || "Mahsulotni o'chirishda xatolik yuz berdi")
      }
    },
    [realtime, refreshItems],
  )

  const bulkDeleteItems = useCallback(
    async (ids: string[]) => {
      try {
        await itemService.bulkDeleteItems(ids)
        if (!realtime) {
          await refreshItems()
        }
      } catch (error: any) {
        throw new Error(error.message || "Mahsulotlarni o'chirishda xatolik yuz berdi")
      }
    },
    [realtime, refreshItems],
  )

  const bulkCreateItems = useCallback(
    async (items: ItemFormData[]) => {
      try {
        await itemService.createBulkItems(items)
        if (!realtime) {
          await refreshItems()
        }
      } catch (error: any) {
        throw new Error(error.message || "Ko'p mahsulot yaratishda xatolik yuz berdi")
      }
    },
    [realtime, refreshItems],
  )

  return {
    items,
    loading,
    error,
    totalCount,
    refreshItems,
    createItem,
    updateItem,
    updateItemStatus,
    deleteItem,
    bulkDeleteItems,
    bulkCreateItems,
  }
}

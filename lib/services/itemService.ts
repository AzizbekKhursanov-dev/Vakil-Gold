import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  type QueryConstraint,
} from "firebase/firestore"
import { initializeFirebase, getDb, waitForPersistence } from "@/lib/firebase/config"
import type { Item, ItemFormData } from "@/lib/types/item"
import { itemFormSchema } from "@/lib/zod-schemas/item-schemas"
import { getFromLocalStorage, setToLocalStorage } from "@/lib/utils/localStorage"

const ITEMS_COLLECTION = "items"
const CACHE_KEY = "items_cache"
const LAST_SYNCED_KEY = "items_last_synced"
const SYNC_INTERVAL = 30000 // 30 seconds

class ItemService {
  private cache: Item[] = []
  private listeners: Set<() => void> = new Set()
  private syncTimer: NodeJS.Timeout | null = null
  private isInitialized = false

  async initializeCache(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize Firebase first
      await initializeFirebase()

      // Load from localStorage first
      const cachedItems = getFromLocalStorage<Item[]>(CACHE_KEY, [])
      this.cache = cachedItems

      // Fetch fresh data from Firestore
      await this.syncItems()

      // Start periodic sync
      this.startPeriodicSync()

      this.isInitialized = true
      console.log("ItemService initialized with", this.cache.length, "items")
    } catch (error) {
      console.error("Failed to initialize item cache:", error)
      // Fallback to cached data if available
      this.cache = getFromLocalStorage<Item[]>(CACHE_KEY, [])
    }
  }

  async syncItems(): Promise<void> {
    try {
      await waitForPersistence()
      const db = getDb()
      const lastSynced = getFromLocalStorage<string>(LAST_SYNCED_KEY, "")
      const constraints: QueryConstraint[] = [
        orderBy("updatedAt", "desc"),
        limit(1000), // Reasonable limit for performance
      ]

      // Only fetch items updated since last sync
      if (lastSynced) {
        constraints.push(where("updatedAt", ">", new Date(lastSynced)))
      }

      const q = query(collection(db, ITEMS_COLLECTION), ...constraints)
      const snapshot = await getDocs(q)

      const updatedItems: Item[] = []
      snapshot.forEach((doc) => {
        updatedItems.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        } as Item)
      })

      if (updatedItems.length > 0 || !lastSynced) {
        if (!lastSynced) {
          // First sync - replace entire cache
          this.cache = updatedItems
        } else {
          // Incremental sync - merge updates
          this.mergeUpdatedItems(updatedItems)
        }

        // Update localStorage
        setToLocalStorage(CACHE_KEY, this.cache)
        setToLocalStorage(LAST_SYNCED_KEY, new Date().toISOString())

        // Notify listeners
        this.notifyListeners()

        console.log(`Synced ${updatedItems.length} items`)
      }
    } catch (error) {
      console.error("Failed to sync items:", error)
      // Continue with cached data
    }
  }

  private mergeUpdatedItems(updatedItems: Item[]): void {
    const updatedMap = new Map(updatedItems.map((item) => [item.id, item]))

    // Update existing items or add new ones
    this.cache = this.cache.map((item) => (updatedMap.has(item.id) ? updatedMap.get(item.id)! : item))

    // Add completely new items
    const existingIds = new Set(this.cache.map((item) => item.id))
    const newItems = updatedItems.filter((item) => !existingIds.has(item.id))
    this.cache.push(...newItems)
  }

  private startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }

    this.syncTimer = setInterval(() => {
      this.syncItems()
    }, SYNC_INTERVAL)
  }

  getCachedItems(filters?: {
    category?: string
    status?: string
    branch?: string
    search?: string
  }): Item[] {
    let filteredItems = [...this.cache]

    if (filters) {
      if (filters.category) {
        filteredItems = filteredItems.filter((item) =>
          item.category.toLowerCase().includes(filters.category!.toLowerCase()),
        )
      }

      if (filters.status) {
        filteredItems = filteredItems.filter((item) => item.status === filters.status)
      }

      if (filters.branch) {
        filteredItems = filteredItems.filter(
          (item) => item.branchId === filters.branch || item.branchName === filters.branch,
        )
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        filteredItems = filteredItems.filter(
          (item) =>
            item.model.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm) ||
            item.supplierName?.toLowerCase().includes(searchTerm),
        )
      }
    }

    return filteredItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  async createItem(data: ItemFormData): Promise<string> {
    // Validate data
    const validatedData = itemFormSchema.parse(data)

    const now = new Date().toISOString()
    const itemData = {
      ...validatedData,
      createdAt: now,
      updatedAt: now,
      status: "available",
    }

    try {
      await waitForPersistence()
      const db = getDb()
      const docRef = await addDoc(collection(db, ITEMS_COLLECTION), {
        ...itemData,
        createdAt: Timestamp.fromDate(new Date(now)),
        updatedAt: Timestamp.fromDate(new Date(now)),
      })

      // Update local cache
      const newItem: Item = {
        id: docRef.id,
        ...itemData,
      }

      this.cache.unshift(newItem)
      setToLocalStorage(CACHE_KEY, this.cache)
      this.notifyListeners()

      return docRef.id
    } catch (error) {
      console.error("Failed to create item:", error)
      throw error
    }
  }

  async updateItem(id: string, data: Partial<ItemFormData>): Promise<void> {
    const now = new Date().toISOString()
    const updateData = {
      ...data,
      updatedAt: now,
    }

    try {
      await waitForPersistence()
      const db = getDb()
      await updateDoc(doc(db, ITEMS_COLLECTION, id), {
        ...updateData,
        updatedAt: Timestamp.fromDate(new Date(now)),
      })

      // Update local cache
      const index = this.cache.findIndex((item) => item.id === id)
      if (index !== -1) {
        this.cache[index] = { ...this.cache[index], ...updateData }
        setToLocalStorage(CACHE_KEY, this.cache)
        this.notifyListeners()
      }
    } catch (error) {
      console.error("Failed to update item:", error)
      throw error
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      await waitForPersistence()
      const db = getDb()
      await deleteDoc(doc(db, ITEMS_COLLECTION, id))

      // Update local cache
      this.cache = this.cache.filter((item) => item.id !== id)
      setToLocalStorage(CACHE_KEY, this.cache)
      this.notifyListeners()
    } catch (error) {
      console.error("Failed to delete item:", error)
      throw error
    }
  }

  async bulkCreateItems(items: ItemFormData[]): Promise<void> {
    const batch = writeBatch(getDb())
    const now = new Date()
    const newItems: Item[] = []

    items.forEach((itemData) => {
      const validatedData = itemFormSchema.parse(itemData)
      const docRef = doc(collection(getDb(), ITEMS_COLLECTION))

      batch.set(docRef, {
        ...validatedData,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        status: "available",
      })

      newItems.push({
        id: docRef.id,
        ...validatedData,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "available",
      })
    })

    try {
      await waitForPersistence()
      await batch.commit()

      // Update local cache
      this.cache.unshift(...newItems)
      setToLocalStorage(CACHE_KEY, this.cache)
      this.notifyListeners()
    } catch (error) {
      console.error("Failed to bulk create items:", error)
      throw error
    }
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback())
  }

  getStats() {
    const items = this.getCachedItems()
    return {
      total: items.length,
      available: items.filter((item) => item.status === "available").length,
      sold: items.filter((item) => item.status === "sold").length,
      totalValue: items.reduce((sum, item) => sum + item.sellingPrice, 0),
      totalWeight: items.reduce((sum, item) => sum + item.weight, 0),
    }
  }

  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
    this.listeners.clear()
    this.isInitialized = false
  }
}

export const itemService = new ItemService()

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  type QueryConstraint,
} from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { calculateSellingPrice } from "@/lib/calculations/pricing"
import type { Item, ItemFormData, ItemFilters } from "@/lib/types/item"

const COLLECTION_NAME = "items"

// Helper function to clean data for Firebase (remove undefined values)
const cleanDataForFirebase = (data: any): any => {
  const cleaned: any = {}

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = value
    }
  }

  return cleaned
}

// Helper function to validate and prepare item data
const prepareItemData = (data: ItemFormData) => {
  const sellingPrice = calculateSellingPrice(
    data.weight,
    data.lomNarxi,
    data.lomNarxiKirim,
    data.laborCost,
    data.profitPercentage || 20,
    data.isProvider || false,
  )

  const baseData = {
    model: data.model?.trim() || "",
    category: data.category,
    weight: Number(data.weight) || 0,
    size: data.size ? Number(data.size) : null,
    quantity: Number(data.quantity) || 1,
    lomNarxi: Number(data.lomNarxi) || 0,
    lomNarxiKirim: Number(data.lomNarxiKirim) || 0,
    laborCost: Number(data.laborCost) || 0,
    profitPercentage: Number(data.profitPercentage) || 20,
    sellingPrice: Number(sellingPrice),
    status: "available",
    isProvider: Boolean(data.isProvider),

    // Branch handling - store both ID and name for easier display
    branch: !data.isProvider && data.branch ? data.branch.trim() : null,
    branchId: !data.isProvider && data.branch ? data.branch.trim() : null,
    branchName: !data.isProvider && data.branchName ? data.branchName.trim() : null,

    // Optional fields - only include if they have values
    color: data.color?.trim() || null,
    purity: data.purity || null,
    stoneType: data.stoneType?.trim() || null,
    stoneWeight: data.stoneWeight ? Number(data.stoneWeight) : null,
    manufacturer: data.manufacturer?.trim() || null,
    notes: data.notes?.trim() || null,

    // Dates
    purchaseDate: data.purchaseDate || new Date().toISOString().split("T")[0],
    distributedDate: data.distributedDate || null,

    // Supplier and payment info
    supplierName: data.supplierName?.trim() || null,
    paymentStatus: data.paymentStatus || "unpaid",
    payedLomNarxi: data.payedLomNarxi ? Number(data.payedLomNarxi) : null,

    // System metadata
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    version: 1,
  }

  // Calculate price difference if payment price exists
  if (baseData.payedLomNarxi && baseData.lomNarxi) {
    baseData.priceDifference = baseData.payedLomNarxi - baseData.lomNarxi
  }

  // Clean undefined values
  return cleanDataForFirebase(baseData)
}

export const itemService = {
  async createItem(data: ItemFormData): Promise<string> {
    try {
      console.log("Creating item with data:", data)

      const itemData = prepareItemData(data)
      console.log("Prepared item data for Firebase:", itemData)

      const docRef = await addDoc(collection(db, COLLECTION_NAME), itemData)
      console.log("Item created successfully with ID:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("Error creating item:", error)
      throw new Error(
        `Mahsulot yaratishda xatolik yuz berdi: ${error instanceof Error ? error.message : "Noma'lum xatolik"}`,
      )
    }
  },

  async createBulkItems(items: ItemFormData[]): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      console.log(`Starting bulk import of ${items.length} items`)

      const errors: string[] = []
      let success = 0
      let failed = 0

      // Process items in batches of 500 (Firestore limit)
      const batchSize = 500
      const batches: Promise<void>[] = []

      for (let i = 0; i < items.length; i += batchSize) {
        const batchItems = items.slice(i, i + batchSize)
        const currentBatch = writeBatch(db)

        batchItems.forEach((item, index) => {
          try {
            const itemData = prepareItemData(item)
            const docRef = doc(collection(db, COLLECTION_NAME))
            currentBatch.set(docRef, itemData)
            success++
          } catch (error) {
            failed++
            const rowNumber = i + index + 1
            const errorMessage = error instanceof Error ? error.message : "Noma'lum xatolik"
            errors.push(`Qator ${rowNumber}: ${errorMessage}`)
            console.error(`Error preparing item ${rowNumber}:`, error)
          }
        })

        if (success > failed) {
          batches.push(currentBatch.commit())
        }
      }

      await Promise.all(batches)
      console.log(`Bulk import completed: ${success} success, ${failed} failed`)

      return { success, failed, errors }
    } catch (error: any) {
      console.error("Error in bulk import:", error)
      throw new Error(
        `Ko'p mahsulot yaratishda xatolik yuz berdi: ${error instanceof Error ? error.message : "Noma'lum xatolik"}`,
      )
    }
  },

  async updateItem(id: string, data: Partial<ItemFormData>): Promise<void> {
    try {
      const updateData: any = {
        updatedAt: serverTimestamp(),
      }

      // Only update fields that are provided
      if (data.model !== undefined) updateData.model = data.model.trim()
      if (data.category !== undefined) updateData.category = data.category
      if (data.weight !== undefined) updateData.weight = Number(data.weight)
      if (data.size !== undefined) updateData.size = data.size ? Number(data.size) : null
      if (data.quantity !== undefined) updateData.quantity = Number(data.quantity)
      if (data.lomNarxi !== undefined) updateData.lomNarxi = Number(data.lomNarxi)
      if (data.lomNarxiKirim !== undefined) updateData.lomNarxiKirim = Number(data.lomNarxiKirim)
      if (data.laborCost !== undefined) updateData.laborCost = Number(data.laborCost)
      if (data.profitPercentage !== undefined) updateData.profitPercentage = Number(data.profitPercentage)
      if (data.isProvider !== undefined) {
        updateData.isProvider = Boolean(data.isProvider)
        // Clear branch info if becoming provider
        if (data.isProvider) {
          updateData.branch = null
          updateData.branchId = null
        }
      }
      if (data.branch !== undefined) {
        updateData.branch = data.branch ? data.branch.trim() : null
        updateData.branchId = data.branch ? data.branch.trim() : null
      }
      if (data.color !== undefined) updateData.color = data.color ? data.color.trim() : null
      if (data.purity !== undefined) updateData.purity = data.purity || null
      if (data.stoneType !== undefined) updateData.stoneType = data.stoneType ? data.stoneType.trim() : null
      if (data.stoneWeight !== undefined) updateData.stoneWeight = data.stoneWeight ? Number(data.stoneWeight) : null
      if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer ? data.manufacturer.trim() : null
      if (data.notes !== undefined) updateData.notes = data.notes ? data.notes.trim() : null
      if (data.supplierName !== undefined) updateData.supplierName = data.supplierName ? data.supplierName.trim() : null
      if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus
      if (data.payedLomNarxi !== undefined) {
        updateData.payedLomNarxi = data.payedLomNarxi ? Number(data.payedLomNarxi) : null
        // Update price difference if both prices exist
        if (data.payedLomNarxi && data.lomNarxi) {
          updateData.priceDifference = Number(data.payedLomNarxi) - Number(data.lomNarxi)
        }
      }

      // Recalculate selling price if pricing data changed
      if (data.weight || data.lomNarxi || data.lomNarxiKirim || data.laborCost || data.profitPercentage) {
        const currentItem = await this.getItem(id)
        if (currentItem) {
          const updatedItemData = { ...currentItem, ...data }
          updateData.sellingPrice = calculateSellingPrice(
            updatedItemData.weight,
            updatedItemData.lomNarxi,
            updatedItemData.lomNarxiKirim,
            updatedItemData.laborCost,
            updatedItemData.profitPercentage || 20,
            updatedItemData.isProvider || false,
          )
        }
      }

      // Clean undefined values
      const cleanedData = cleanDataForFirebase(updateData)
      await updateDoc(doc(db, COLLECTION_NAME, id), cleanedData)
    } catch (error) {
      console.error("Error updating item:", error)
      throw new Error("Mahsulotni yangilashda xatolik yuz berdi")
    }
  },

  async updateItemStatus(
    id: string,
    status: "sold" | "returned" | "available" | "transferred" | "reserved" | "returned_to_supplier",
    additionalData?: any,
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      }

      if (additionalData) {
        Object.assign(updateData, additionalData)
      }

      if (status === "sold") {
        updateData.soldDate = new Date().toISOString()
      } else if (status === "returned") {
        updateData.returnedDate = new Date().toISOString()
        updateData.status = "available" // When item is returned, it becomes available again
        updateData.returnReason = additionalData?.returnReason || "Mijoz qaytardi"
        updateData.returnDate = new Date().toISOString()
      } else if (status === "transferred") {
        updateData.transferredDate = new Date().toISOString()
        updateData.transferredTo = additionalData?.transferredTo || null
      } else if (status === "reserved") {
        updateData.reservedDate = new Date().toISOString()
        updateData.reservedBy = additionalData?.reservedBy || null
      } else if (status === "returned_to_supplier") {
        updateData.returnToSupplierDate = new Date().toISOString()
        updateData.returnToSupplierReason = additionalData?.returnToSupplierReason || "Sabab ko'rsatilmagan"
        updateData.returnToSupplierReference = additionalData?.returnToSupplierReference || null
      }

      // Clean undefined values
      const cleanedData = cleanDataForFirebase(updateData)
      await updateDoc(doc(db, COLLECTION_NAME, id), cleanedData)
    } catch (error) {
      console.error("Error updating item status:", error)
      throw new Error("Mahsulot holatini yangilashda xatolik yuz berdi")
    }
  },

  async returnToInventory(id: string): Promise<void> {
    try {
      const updateData = {
        isProvider: true,
        branch: null,
        branchId: null,
        status: "available",
        distributedDate: null,
        returnedToInventoryDate: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      }

      // Clean undefined values
      const cleanedData = cleanDataForFirebase(updateData)
      await updateDoc(doc(db, COLLECTION_NAME, id), cleanedData)
    } catch (error) {
      console.error("Error returning item to inventory:", error)
      throw new Error("Mahsulotni omborga qaytarishda xatolik yuz berdi")
    }
  },

  async deleteItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id))
    } catch (error) {
      console.error("Error deleting item:", error)
      throw new Error("Mahsulotni o'chirishda xatolik yuz berdi")
    }
  },

  async getItems(
    filters: ItemFilters & {
      limit?: number
      offset?: number
      sortField?: string
      sortDirection?: "asc" | "desc"
    } = {},
  ): Promise<Item[]> {
    try {
      const constraints: QueryConstraint[] = []

      // Add filters
      if (filters.category) {
        constraints.push(where("category", "==", filters.category))
      }
      if (filters.status) {
        constraints.push(where("status", "==", filters.status))
      }
      if (filters.branch) {
        constraints.push(where("branch", "==", filters.branch))
      }
      if (filters.isProvider !== undefined) {
        constraints.push(where("isProvider", "==", filters.isProvider))
      }
      if (filters.startDate) {
        constraints.push(where("createdAt", ">=", filters.startDate))
      }
      if (filters.endDate) {
        constraints.push(where("createdAt", "<=", filters.endDate))
      }

      // Add sorting
      const sortField = filters.sortField || "createdAt"
      const sortDirection = filters.sortDirection || "desc"
      constraints.push(orderBy(sortField, sortDirection))

      // Add pagination
      if (filters.limit) {
        constraints.push(limit(filters.limit))
      }

      const q = query(collection(db, COLLECTION_NAME), ...constraints)

      const querySnapshot = await getDocs(q)
      let items = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          // Ensure branchName is available for display
          branchName: data.branchName || data.branch || (data.isProvider ? null : "Noma'lum"),
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        }
      }) as Item[]

      // Client-side search filter (since Firestore doesn't support full-text search)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        items = items.filter(
          (item) =>
            item.model.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm) ||
            (item.notes && item.notes.toLowerCase().includes(searchTerm)) ||
            (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm)),
        )
      }

      // Client-side pagination offset
      if (filters.offset) {
        items = items.slice(filters.offset)
      }

      return items
    } catch (error) {
      console.error("Error getting items:", error)
      throw new Error("Mahsulotlarni yuklashda xatolik yuz berdi")
    }
  },

  async getItemsWithCount(filters: ItemFilters = {}): Promise<{ items: Item[]; totalCount: number }> {
    try {
      const items = await this.getItems(filters)
      return {
        items,
        totalCount: items.length,
      }
    } catch (error) {
      console.error("Error getting items with count:", error)
      throw new Error("Mahsulotlarni yuklashda xatolik yuz berdi")
    }
  },

  async getItem(id: string): Promise<Item | null> {
    try {
      const docSnap = await getDoc(doc(db, COLLECTION_NAME, id))

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        } as Item
      }

      return null
    } catch (error) {
      console.error("Error getting item:", error)
      throw new Error("Mahsulotni yuklashda xatolik yuz berdi")
    }
  },

  async getUnpaidItemsBySupplier(supplierName: string): Promise<Item[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("supplierName", "==", supplierName),
        where("paymentStatus", "==", "unpaid"),
        orderBy("purchaseDate", "asc"),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        }
      }) as Item[]
    } catch (error) {
      console.error("Error getting unpaid items:", error)
      throw new Error("To'lanmagan mahsulotlarni yuklashda xatolik yuz berdi")
    }
  },

  async updateItemsPaymentStatus(itemIds: string[], paymentData: any): Promise<void> {
    try {
      const batch = writeBatch(db)

      itemIds.forEach((itemId) => {
        const itemRef = doc(db, COLLECTION_NAME, itemId)
        const updateData = cleanDataForFirebase({
          paymentStatus: "paid",
          payedLomNarxi: paymentData.payedLomNarxi || null,
          paymentDate: paymentData.paymentDate || null,
          paymentReference: paymentData.reference || null,
          priceDifference: paymentData.priceDifference || null,
          updatedAt: serverTimestamp(),
        })
        batch.update(itemRef, updateData)
      })

      await batch.commit()
    } catch (error) {
      console.error("Error updating payment status:", error)
      throw new Error("To'lov holatini yangilashda xatolik yuz berdi")
    }
  },

  // Bulk operations
  async bulkUpdateItems(itemIds: string[], updateData: Partial<ItemFormData>): Promise<void> {
    try {
      const batch = writeBatch(db)
      const cleanedData = cleanDataForFirebase({
        ...updateData,
        updatedAt: serverTimestamp(),
      })

      itemIds.forEach((itemId) => {
        const itemRef = doc(db, COLLECTION_NAME, itemId)
        batch.update(itemRef, cleanedData)
      })

      await batch.commit()
    } catch (error) {
      console.error("Error in bulk update:", error)
      throw new Error("Ko'p mahsulotni yangilashda xatolik yuz berdi")
    }
  },

  async bulkDeleteItems(itemIds: string[]): Promise<void> {
    try {
      const batch = writeBatch(db)

      itemIds.forEach((itemId) => {
        const itemRef = doc(db, COLLECTION_NAME, itemId)
        batch.delete(itemRef)
      })

      await batch.commit()
    } catch (error) {
      console.error("Error in bulk delete:", error)
      throw new Error("Ko'p mahsulotni o'chirishda xatolik yuz berdi")
    }
  },

  // Statistics and analytics
  async getItemStats(filters: ItemFilters = {}): Promise<{
    totalItems: number
    totalWeight: number
    totalValue: number
    availableItems: number
    soldItems: number
    returnedItems: number
    branchItems: number
    centralItems: number
  }> {
    try {
      const items = await this.getItems(filters)

      return {
        totalItems: items.length,
        totalWeight: items.reduce((sum, item) => sum + item.weight, 0),
        totalValue: items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0),
        availableItems: items.filter((item) => item.status === "available").length,
        soldItems: items.filter((item) => item.status === "sold").length,
        returnedItems: items.filter((item) => item.status === "returned").length,
        branchItems: items.filter((item) => !item.isProvider).length,
        centralItems: items.filter((item) => item.isProvider).length,
      }
    } catch (error) {
      console.error("Error getting item stats:", error)
      throw new Error("Mahsulot statistikasini yuklashda xatolik yuz berdi")
    }
  },
}

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/config/firebase"

export interface SupplierConfirmation {
  id?: string
  supplierName: string
  itemIds: string[]
  totalAmount: number
  totalWeight: number
  status: "pending" | "sent" | "confirmed" | "rejected" | "expired"
  sentDate?: string
  confirmedDate?: string
  rejectedDate?: string
  expiryDate?: string
  confirmationCode: string
  supplierResponse?: {
    confirmed: boolean
    confirmedItems: string[]
    rejectedItems: string[]
    notes?: string
    confirmedAt: string
  }
  adminNotes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

class ConfirmationService {
  private collectionName = "supplierConfirmations"

  // Generate unique confirmation code
  generateConfirmationCode(): string {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substr(2, 4).toUpperCase()
    return `CONF-${timestamp}-${random}`
  }

  // Create new confirmation request
  async createConfirmationRequest(data: Omit<SupplierConfirmation, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
      const confirmationData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, this.collectionName), confirmationData)
      return docRef.id
    } catch (error) {
      console.error("Error creating confirmation request:", error)
      throw new Error("Failed to create confirmation request")
    }
  }

  // Send confirmation to supplier (update status)
  async sendConfirmationToSupplier(confirmationId: string): Promise<void> {
    try {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 7) // 7 days expiry

      await updateDoc(doc(db, this.collectionName, confirmationId), {
        status: "sent",
        sentDate: serverTimestamp(),
        expiryDate: expiryDate.toISOString(),
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error sending confirmation:", error)
      throw new Error("Failed to send confirmation")
    }
  }

  // Process supplier confirmation response
  async processSupplierConfirmation(
    confirmationId: string,
    confirmed: boolean,
    confirmedItems: string[],
    rejectedItems: string[],
    notes?: string,
  ): Promise<void> {
    try {
      const batch = writeBatch(db)

      // Update confirmation record
      const confirmationRef = doc(db, this.collectionName, confirmationId)
      batch.update(confirmationRef, {
        status: confirmed ? "confirmed" : "rejected",
        confirmedDate: confirmed ? serverTimestamp() : null,
        rejectedDate: !confirmed ? serverTimestamp() : null,
        supplierResponse: {
          confirmed,
          confirmedItems,
          rejectedItems,
          notes,
          confirmedAt: new Date().toISOString(),
        },
        updatedAt: serverTimestamp(),
      })

      // Update confirmed items
      if (confirmed && confirmedItems.length > 0) {
        for (const itemId of confirmedItems) {
          const itemRef = doc(db, "items", itemId)
          batch.update(itemRef, {
            confirmed: true,
            confirmedDate: serverTimestamp(),
            confirmationId,
            supplierConfirmationNotes: notes || null,
            updatedAt: serverTimestamp(),
          })
        }
      }

      // Update rejected items
      if (rejectedItems.length > 0) {
        for (const itemId of rejectedItems) {
          const itemRef = doc(db, "items", itemId)
          batch.update(itemRef, {
            confirmed: false,
            confirmationId,
            supplierConfirmationNotes: notes || null,
            updatedAt: serverTimestamp(),
          })
        }
      }

      await batch.commit()
    } catch (error) {
      console.error("Error processing supplier confirmation:", error)
      throw new Error("Failed to process supplier confirmation")
    }
  }

  // Get confirmations by supplier
  async getConfirmationsBySupplier(supplierName: string): Promise<SupplierConfirmation[]> {
    try {
      const q = query(collection(db, this.collectionName), where("supplierName", "==", supplierName))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      })) as SupplierConfirmation[]
    } catch (error) {
      console.error("Error getting confirmations by supplier:", error)
      throw new Error("Failed to get confirmations")
    }
  }

  // Mark expired confirmations
  async markExpiredConfirmations(): Promise<void> {
    try {
      const now = new Date()
      const q = query(collection(db, this.collectionName), where("status", "==", "sent"))
      const querySnapshot = await getDocs(q)

      const batch = writeBatch(db)
      let hasUpdates = false

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data()
        if (data.expiryDate && new Date(data.expiryDate) < now) {
          batch.update(doc.ref, {
            status: "expired",
            updatedAt: serverTimestamp(),
          })
          hasUpdates = true
        }
      })

      if (hasUpdates) {
        await batch.commit()
      }
    } catch (error) {
      console.error("Error marking expired confirmations:", error)
      throw new Error("Failed to mark expired confirmations")
    }
  }

  // Get confirmation by code (for supplier portal)
  async getConfirmationByCode(confirmationCode: string): Promise<SupplierConfirmation | null> {
    try {
      const q = query(collection(db, this.collectionName), where("confirmationCode", "==", confirmationCode))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return null
      }

      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      } as SupplierConfirmation
    } catch (error) {
      console.error("Error getting confirmation by code:", error)
      throw new Error("Failed to get confirmation")
    }
  }

  // Bulk confirm items
  async bulkConfirmItems(itemIds: string[], confirmationId: string, notes?: string): Promise<void> {
    try {
      const batch = writeBatch(db)

      for (const itemId of itemIds) {
        const itemRef = doc(db, "items", itemId)
        batch.update(itemRef, {
          confirmed: true,
          confirmedDate: serverTimestamp(),
          confirmationId,
          supplierConfirmationNotes: notes || null,
          updatedAt: serverTimestamp(),
        })
      }

      await batch.commit()
    } catch (error) {
      console.error("Error bulk confirming items:", error)
      throw new Error("Failed to bulk confirm items")
    }
  }

  // Get confirmation statistics
  async getConfirmationStats(): Promise<{
    total: number
    pending: number
    sent: number
    confirmed: number
    rejected: number
    expired: number
  }> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName))
      const confirmations = querySnapshot.docs.map((doc) => doc.data())

      return {
        total: confirmations.length,
        pending: confirmations.filter((c) => c.status === "pending").length,
        sent: confirmations.filter((c) => c.status === "sent").length,
        confirmed: confirmations.filter((c) => c.status === "confirmed").length,
        rejected: confirmations.filter((c) => c.status === "rejected").length,
        expired: confirmations.filter((c) => c.status === "expired").length,
      }
    } catch (error) {
      console.error("Error getting confirmation stats:", error)
      throw new Error("Failed to get confirmation statistics")
    }
  }
}

export const confirmationService = new ConfirmationService()

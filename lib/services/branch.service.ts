import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  writeBatch,
} from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import type {
  Branch,
  BranchFormData,
  BranchStaff,
  BranchExpense,
  BranchInventoryCheck,
  BranchTransfer,
  BranchSalesTarget,
  BranchPerformanceMetrics,
} from "@/lib/types/branch"

const COLLECTION_NAME = "branches"

export const branchService = {
  async createBranch(data: BranchFormData): Promise<string> {
    try {
      const branchData = {
        ...data,
        itemCount: 0,
        totalValue: 0,
        monthlyRevenue: 0,
        status: data.status || "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), branchData)
      return docRef.id
    } catch (error) {
      console.error("Error creating branch:", error)
      throw new Error("Filial yaratishda xatolik yuz berdi")
    }
  },

  async updateBranch(id: string, data: Partial<BranchFormData>): Promise<void> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      }

      await updateDoc(doc(db, COLLECTION_NAME, id), updateData)
    } catch (error) {
      console.error("Error updating branch:", error)
      throw new Error("Filialni yangilashda xatolik yuz berdi")
    }
  },

  async deleteBranch(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id))
    } catch (error) {
      console.error("Error deleting branch:", error)
      throw new Error("Filialni o'chirishda xatolik yuz berdi")
    }
  },

  async getBranches(): Promise<Branch[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Branch,
      )
    } catch (error) {
      console.error("Error getting branches:", error)
      throw new Error("Filiallarni yuklashda xatolik yuz berdi")
    }
  },

  async getBranch(id: string): Promise<Branch | null> {
    try {
      if (!id) {
        return null
      }

      const docSnap = await getDoc(doc(db, COLLECTION_NAME, id))

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Branch
      }

      return null
    } catch (error) {
      console.error("Error getting branch:", error)
      // Don't throw error for single branch fetch to prevent infinite loops
      return null
    }
  },

  async updateBranchStats(
    branchId: string,
    stats: { itemCount: number; totalValue: number; monthlyRevenue: number },
  ): Promise<void> {
    try {
      if (!branchId) {
        return
      }

      await updateDoc(doc(db, COLLECTION_NAME, branchId), {
        ...stats,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error updating branch stats:", error)
      throw new Error("Filial statistikasini yangilashda xatolik yuz berdi")
    }
  },

  async getBranchItems(branchId: string): Promise<any[]> {
    try {
      if (!branchId) {
        return []
      }

      const q = query(collection(db, "items"), where("branchId", "==", branchId), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error getting branch items:", error)
      throw new Error("Filial mahsulotlarini yuklashda xatolik yuz berdi")
    }
  },

  async getBranchTransactions(branchId: string): Promise<any[]> {
    try {
      if (!branchId) {
        return []
      }

      const q = query(collection(db, "transactions"), where("branchId", "==", branchId), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error getting branch transactions:", error)
      throw new Error("Filial tranzaksiyalarini yuklashda xatolik yuz berdi")
    }
  },

  // New methods for enhanced branch management

  async getBranchStaff(branchId: string): Promise<BranchStaff[]> {
    try {
      if (!branchId) {
        return []
      }

      const q = query(collection(db, "branchStaff"), where("branchId", "==", branchId), orderBy("name", "asc"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BranchStaff[]
    } catch (error) {
      console.error("Error getting branch staff:", error)
      throw new Error("Filial xodimlarini yuklashda xatolik yuz berdi")
    }
  },

  async addBranchStaff(staffData: Omit<BranchStaff, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "branchStaff"), {
        ...staffData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error adding branch staff:", error)
      throw new Error("Filial xodimini qo'shishda xatolik yuz berdi")
    }
  },

  async updateBranchStaff(staffId: string, staffData: Partial<BranchStaff>): Promise<void> {
    try {
      await updateDoc(doc(db, "branchStaff", staffId), {
        ...staffData,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error updating branch staff:", error)
      throw new Error("Filial xodimini yangilashda xatolik yuz berdi")
    }
  },

  async deleteBranchStaff(staffId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "branchStaff", staffId))
    } catch (error) {
      console.error("Error deleting branch staff:", error)
      throw new Error("Filial xodimini o'chirishda xatolik yuz berdi")
    }
  },

  async addBranchExpense(expenseData: Omit<BranchExpense, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "branchExpenses"), {
        ...expenseData,
        createdAt: new Date().toISOString(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error adding branch expense:", error)
      throw new Error("Filial xarajatini qo'shishda xatolik yuz berdi")
    }
  },

  async getBranchExpenses(branchId: string, startDate?: string, endDate?: string): Promise<BranchExpense[]> {
    try {
      if (!branchId) {
        return []
      }

      const constraints: any[] = [where("branchId", "==", branchId)]

      if (startDate) {
        constraints.push(where("date", ">=", startDate))
      }

      if (endDate) {
        constraints.push(where("date", "<=", endDate))
      }

      constraints.push(orderBy("date", "desc"))

      const q = query(collection(db, "branchExpenses"), ...constraints)
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BranchExpense[]
    } catch (error) {
      console.error("Error getting branch expenses:", error)
      throw new Error("Filial xarajatlarini yuklashda xatolik yuz berdi")
    }
  },

  async createInventoryCheck(checkData: Omit<BranchInventoryCheck, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "branchInventoryChecks"), {
        ...checkData,
        createdAt: new Date().toISOString(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating inventory check:", error)
      throw new Error("Inventarizatsiya tekshiruvini yaratishda xatolik yuz berdi")
    }
  },

  async getInventoryChecks(branchId: string): Promise<BranchInventoryCheck[]> {
    try {
      if (!branchId) {
        return []
      }

      const q = query(
        collection(db, "branchInventoryChecks"),
        where("branchId", "==", branchId),
        orderBy("date", "desc"),
      )
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BranchInventoryCheck[]
    } catch (error) {
      console.error("Error getting inventory checks:", error)
      throw new Error("Inventarizatsiya tekshiruvlarini yuklashda xatolik yuz berdi")
    }
  },

  async updateInventoryCheck(checkId: string, data: Partial<BranchInventoryCheck>): Promise<void> {
    try {
      await updateDoc(doc(db, "branchInventoryChecks", checkId), {
        ...data,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error updating inventory check:", error)
      throw new Error("Inventarizatsiya tekshiruvini yangilashda xatolik yuz berdi")
    }
  },

  async createBranchTransfer(transferData: Omit<BranchTransfer, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "branchTransfers"), {
        ...transferData,
        createdAt: new Date().toISOString(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating branch transfer:", error)
      throw new Error("Filiallar o'rtasida ko'chirishni yaratishda xatolik yuz berdi")
    }
  },

  async getBranchTransfers(branchId: string, type: "incoming" | "outgoing" | "all" = "all"): Promise<BranchTransfer[]> {
    try {
      if (!branchId) {
        return []
      }

      let q
      if (type === "incoming") {
        q = query(
          collection(db, "branchTransfers"),
          where("toBranchId", "==", branchId),
          orderBy("initiatedDate", "desc"),
        )
      } else if (type === "outgoing") {
        q = query(
          collection(db, "branchTransfers"),
          where("fromBranchId", "==", branchId),
          orderBy("initiatedDate", "desc"),
        )
      } else {
        // Get both incoming and outgoing transfers
        const incomingQ = query(collection(db, "branchTransfers"), where("toBranchId", "==", branchId))
        const outgoingQ = query(collection(db, "branchTransfers"), where("fromBranchId", "==", branchId))

        const [incomingSnapshot, outgoingSnapshot] = await Promise.all([getDocs(incomingQ), getDocs(outgoingQ)])

        const incomingTransfers = incomingSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          transferType: "incoming",
        }))

        const outgoingTransfers = outgoingSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          transferType: "outgoing",
        }))

        return [...incomingTransfers, ...outgoingTransfers].sort(
          (a, b) => new Date(b.initiatedDate).getTime() - new Date(a.initiatedDate).getTime(),
        ) as BranchTransfer[]
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BranchTransfer[]
    } catch (error) {
      console.error("Error getting branch transfers:", error)
      throw new Error("Filiallar o'rtasidagi ko'chirishlarni yuklashda xatolik yuz berdi")
    }
  },

  async updateBranchTransfer(transferId: string, data: Partial<BranchTransfer>): Promise<void> {
    try {
      await updateDoc(doc(db, "branchTransfers", transferId), {
        ...data,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error updating branch transfer:", error)
      throw new Error("Filiallar o'rtasidagi ko'chirishni yangilashda xatolik yuz berdi")
    }
  },

  async completeBranchTransfer(transferId: string, receivedBy: string, notes?: string): Promise<void> {
    try {
      // Get the transfer
      const transferDoc = await getDoc(doc(db, "branchTransfers", transferId))
      if (!transferDoc.exists()) {
        throw new Error("Ko'chirish topilmadi")
      }

      const transfer = { id: transferDoc.id, ...transferDoc.data() } as BranchTransfer

      // Update transfer status
      await updateDoc(doc(db, "branchTransfers", transferId), {
        status: "completed",
        completedDate: new Date().toISOString(),
        receivedBy,
        notes: notes || transfer.notes,
        updatedAt: new Date().toISOString(),
      })

      // Update items location
      const batch = writeBatch(db)
      for (const transferItem of transfer.items) {
        const itemRef = doc(db, "items", transferItem.itemId)
        batch.update(itemRef, {
          branchId: transfer.toBranchId,
          branch: transfer.toBranchId,
          isProvider: false,
          status: "available",
          transferredDate: new Date().toISOString(),
          transferredFrom: transfer.fromBranchId,
          transferredTo: transfer.toBranchId,
          updatedAt: new Date().toISOString(),
        })
      }

      await batch.commit()
    } catch (error) {
      console.error("Error completing branch transfer:", error)
      throw new Error("Filiallar o'rtasidagi ko'chirishni yakunlashda xatolik yuz berdi")
    }
  },

  async setSalesTarget(targetData: Omit<BranchSalesTarget, "id">): Promise<string> {
    try {
      // Check if target already exists for this branch/month/year
      const existingQ = query(
        collection(db, "branchSalesTargets"),
        where("branchId", "==", targetData.branchId),
        where("year", "==", targetData.year),
        where("month", "==", targetData.month),
      )

      const existingSnapshot = await getDocs(existingQ)

      if (!existingSnapshot.empty) {
        // Update existing target
        const existingDoc = existingSnapshot.docs[0]
        await updateDoc(doc(db, "branchSalesTargets", existingDoc.id), {
          ...targetData,
          updatedAt: new Date().toISOString(),
        })
        return existingDoc.id
      }

      // Create new target
      const docRef = await addDoc(collection(db, "branchSalesTargets"), {
        ...targetData,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error setting sales target:", error)
      throw new Error("Sotuv maqsadini o'rnatishda xatolik yuz berdi")
    }
  },

  async getSalesTargets(branchId: string, year?: number, month?: number): Promise<BranchSalesTarget[]> {
    try {
      if (!branchId) {
        return []
      }

      const constraints: any[] = [where("branchId", "==", branchId)]

      if (year !== undefined) {
        constraints.push(where("year", "==", year))
      }

      if (month !== undefined) {
        constraints.push(where("month", "==", month))
      }

      // Order by year and month descending
      constraints.push(orderBy("year", "desc"))
      constraints.push(orderBy("month", "desc"))

      const q = query(collection(db, "branchSalesTargets"), ...constraints)
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BranchSalesTarget[]
    } catch (error) {
      console.error("Error getting sales targets:", error)
      throw new Error("Sotuv maqsadlarini yuklashda xatolik yuz berdi")
    }
  },

  async updateSalesTarget(targetId: string, data: Partial<BranchSalesTarget>): Promise<void> {
    try {
      await updateDoc(doc(db, "branchSalesTargets", targetId), {
        ...data,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error updating sales target:", error)
      throw new Error("Sotuv maqsadini yangilashda xatolik yuz berdi")
    }
  },

  async getBranchPerformanceMetrics(branchId: string, period?: string): Promise<BranchPerformanceMetrics[]> {
    try {
      if (!branchId) {
        return []
      }

      const constraints: any[] = [where("branchId", "==", branchId)]

      if (period) {
        constraints.push(where("period", "==", period))
      }

      constraints.push(orderBy("period", "desc"))

      const q = query(collection(db, "branchPerformanceMetrics"), ...constraints)
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BranchPerformanceMetrics[]
    } catch (error) {
      console.error("Error getting branch performance metrics:", error)
      throw new Error("Filial samaradorlik ko'rsatkichlarini yuklashda xatolik yuz berdi")
    }
  },

  async calculateBranchPerformance(branchId: string, year: number, month: number): Promise<BranchPerformanceMetrics> {
    try {
      if (!branchId) {
        throw new Error("Filial ID ko'rsatilmagan")
      }

      // Format period as YYYY-MM
      const period = `${year}-${month.toString().padStart(2, "0")}`

      // Get start and end dates for the month
      const startDate = new Date(year, month - 1, 1).toISOString()
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

      // Get all transactions for this branch in the given period
      const transactionsQ = query(
        collection(db, "transactions"),
        where("branchId", "==", branchId),
        where("createdAt", ">=", startDate),
        where("createdAt", "<=", endDate),
        where("type", "==", "sale"),
      )

      const transactionsSnapshot = await getDocs(transactionsQ)
      const transactions = transactionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Calculate metrics
      const salesTotal = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      const itemsSold = transactions.reduce((sum, t) => sum + (t.itemCount || 1), 0)

      // Get unique customers
      const customerIds = [...new Set(transactions.map((t) => t.customerId).filter(Boolean))]

      // Get employee performance
      const employeePerformance: Record<string, { salesAmount: number; itemsSold: number }> = {}
      transactions.forEach((t) => {
        if (t.employeeId) {
          if (!employeePerformance[t.employeeId]) {
            employeePerformance[t.employeeId] = { salesAmount: 0, itemsSold: 0 }
          }
          employeePerformance[t.employeeId].salesAmount += t.amount || 0
          employeePerformance[t.employeeId].itemsSold += t.itemCount || 1
        }
      })

      // Get category sales
      const categorySales: Record<string, number> = {}
      const itemSales: Record<string, number> = {}

      for (const t of transactions) {
        if (t.items) {
          for (const item of t.items) {
            if (item.category) {
              categorySales[item.category] = (categorySales[item.category] || 0) + 1
            }
            if (item.id) {
              itemSales[item.id] = (itemSales[item.id] || 0) + 1
            }
          }
        }
      }

      // Find top selling category and item
      let topSellingCategory = ""
      let maxCategorySales = 0
      Object.entries(categorySales).forEach(([category, sales]) => {
        if (sales > maxCategorySales) {
          topSellingCategory = category
          maxCategorySales = sales
        }
      })

      let topSellingItem = ""
      let maxItemSales = 0
      Object.entries(itemSales).forEach(([itemId, sales]) => {
        if (sales > maxItemSales) {
          topSellingItem = itemId
          maxItemSales = sales
        }
      })

      // Calculate average transaction value
      const averageTransactionValue = transactions.length > 0 ? salesTotal / transactions.length : 0

      // Calculate profit margin (if cost data is available)
      let profitMargin = 0
      let totalCost = 0
      let totalRevenue = 0

      transactions.forEach((t) => {
        if (t.totalCost && t.amount) {
          totalCost += t.totalCost
          totalRevenue += t.amount
        }
      })

      if (totalRevenue > 0) {
        profitMargin = ((totalRevenue - totalCost) / totalRevenue) * 100
      }

      // Format employee performance for the result
      const formattedEmployeePerformance = Object.entries(employeePerformance).map(([employeeId, data]) => ({
        employeeId,
        salesAmount: data.salesAmount,
        itemsSold: data.itemsSold,
        rating: 0, // This would need to be calculated based on targets or other criteria
      }))

      // Create the performance metrics object
      const performanceMetrics: BranchPerformanceMetrics = {
        branchId,
        period,
        salesTotal,
        itemsSold,
        newCustomers: customerIds.length, // This is simplified; would need to check if customers are new
        returningCustomers: 0, // Would need historical data to determine this
        averageTransactionValue,
        topSellingCategory,
        topSellingItem,
        profitMargin,
        inventoryTurnover: 0, // Would need inventory data to calculate this
        employeePerformance: formattedEmployeePerformance,
      }

      // Save the metrics to Firestore
      const metricsRef = await addDoc(collection(db, "branchPerformanceMetrics"), {
        ...performanceMetrics,
        createdAt: new Date().toISOString(),
      })

      return {
        id: metricsRef.id,
        ...performanceMetrics,
      } as BranchPerformanceMetrics
    } catch (error) {
      console.error("Error calculating branch performance:", error)
      throw new Error("Filial samaradorligini hisoblashda xatolik yuz berdi")
    }
  },

  async getBranchHierarchy(): Promise<Branch[]> {
    try {
      const branches = await this.getBranches()

      // Build hierarchy
      const branchMap = new Map<string, Branch>()
      branches.forEach((branch) => {
        branchMap.set(branch.id, branch)
      })

      // Set child branches
      branches.forEach((branch) => {
        if (branch.parentBranchId) {
          const parentBranch = branchMap.get(branch.parentBranchId)
          if (parentBranch) {
            if (!parentBranch.childBranchIds) {
              parentBranch.childBranchIds = []
            }
            parentBranch.childBranchIds.push(branch.id)
          }
        }
      })

      return branches
    } catch (error) {
      console.error("Error getting branch hierarchy:", error)
      throw new Error("Filial ierarxiyasini yuklashda xatolik yuz berdi")
    }
  },

  async scheduleBranchInventoryCheck(branchId: string, date: string, conductedBy: string): Promise<string> {
    try {
      const checkData: Omit<BranchInventoryCheck, "id"> = {
        branchId,
        date,
        conductedBy,
        status: "pending",
        itemsChecked: 0,
        itemsMissing: 0,
        itemsExcess: 0,
        nextScheduledDate: new Date(new Date(date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Schedule next check in 30 days
      }

      return await this.createInventoryCheck(checkData)
    } catch (error) {
      console.error("Error scheduling inventory check:", error)
      throw new Error("Inventarizatsiya tekshiruvini rejalashtirish xatolik yuz berdi")
    }
  },
}

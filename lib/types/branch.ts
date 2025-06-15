export interface Branch {
  id: string
  name: string
  location: string
  manager: string
  isProvider: boolean
  itemCount?: number
  totalValue?: number
  monthlyRevenue?: number
  createdAt: string
  updatedAt: string

  // Enhanced fields
  contactPhone?: string
  email?: string
  address?: string
  openingHours?: string
  status?: "active" | "inactive" | "maintenance"
  description?: string

  // Performance metrics
  salesTarget?: number
  currentSales?: number
  lastMonthSales?: number
  profitMargin?: number
  customerCount?: number
  averageTransactionValue?: number

  // Staff information
  staffCount?: number
  assistantManager?: string

  // Operational data
  lastInventoryCheck?: string
  nextInventoryCheck?: string
  operationalCosts?: number

  // Relationships
  parentBranchId?: string
  childBranchIds?: string[]
}

export interface BranchFormData {
  name: string
  location: string
  manager: string
  isProvider: boolean
  contactPhone?: string
  email?: string
  address?: string
  openingHours?: string
  status?: "active" | "inactive" | "maintenance"
  description?: string
  salesTarget?: number
  assistantManager?: string
  parentBranchId?: string
}

export interface BranchStaff {
  id: string
  branchId: string
  name: string
  position: string
  contactPhone: string
  email?: string
  hireDate: string
  status: "active" | "inactive" | "on_leave"
  permissions?: string[]
  salary?: number
  performanceRating?: number
}

export interface BranchExpense {
  id: string
  branchId: string
  amount: number
  category: string
  description: string
  date: string
  approvedBy?: string
  paymentMethod?: string
  receiptUrl?: string
  isRecurring?: boolean
  recurringFrequency?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
}

export interface BranchInventoryCheck {
  id: string
  branchId: string
  date: string
  conductedBy: string
  status: "pending" | "in_progress" | "completed" | "discrepancies_found"
  itemsChecked: number
  itemsMissing: number
  itemsExcess: number
  notes?: string
  attachments?: string[]
  completedDate?: string
  nextScheduledDate?: string
}

// Add this type alias for the component
export type BranchInventoryCheckType = BranchInventoryCheck

export interface BranchTransfer {
  id: string
  fromBranchId: string
  toBranchId: string
  items: BranchTransferItem[]
  initiatedBy: string
  initiatedDate: string
  status: "pending" | "in_transit" | "completed" | "cancelled" | "rejected"
  completedDate?: string
  receivedBy?: string
  notes?: string
  reason: string
  transportMethod?: string
  trackingNumber?: string
  estimatedArrival?: string
}

export interface BranchTransferItem {
  itemId: string
  quantity: number
  condition: "excellent" | "good" | "fair" | "poor"
  notes?: string
}

export interface BranchSalesTarget {
  id: string
  branchId: string
  year: number
  month: number
  targetAmount: number
  actualAmount?: number
  itemsSoldTarget: number
  itemsSoldActual?: number
  status: "pending" | "in_progress" | "achieved" | "missed"
  bonusThreshold?: number
  bonusAmount?: number
  notes?: string
}

export interface BranchPerformanceMetrics {
  branchId: string
  period: string // YYYY-MM format
  salesTotal: number
  itemsSold: number
  newCustomers: number
  returningCustomers: number
  averageTransactionValue: number
  topSellingCategory: string
  topSellingItem: string
  profitMargin: number
  inventoryTurnover: number
  employeePerformance: {
    employeeId: string
    salesAmount: number
    itemsSold: number
    rating: number
  }[]
}

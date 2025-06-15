export interface Item {
  id: string
  model: string
  category: "Uzuk" | "Sirg'a" | "Bilakuzuk" | "Zanjir" | "Boshqa"
  weight: number
  size?: number
  quantity: number
  lomNarxi: number // Supplier's gold price per gram
  lomNarxiKirim: number // Base price per gram for branch distribution
  laborCost: number // Labor cost per gram
  profitPercentage: number
  sellingPrice: number
  status: "available" | "sold" | "returned" | "transferred" | "reserved" | "returned_to_supplier"
  isProvider: boolean // Central inventory vs branch
  branch?: string | null
  branchId?: string | null
  branchName?: string | null
  color?: string | null
  purity?: "14K" | "18K" | "21K" | "22K" | "24K" | null
  stoneType?: string | null
  stoneWeight?: number | null
  manufacturer?: string | null
  notes?: string | null

  // Payment tracking
  payedLomNarxi?: number | null // Actual paid price per gram to supplier
  paymentStatus: "unpaid" | "partially_paid" | "paid"
  paymentDate?: string | null
  paymentReference?: string | null
  supplierName?: string | null
  priceDifference?: number | null // Difference between lomNarxi and payedLomNarxi

  // Enhanced supplier confirmation tracking
  confirmed?: boolean // Whether supplier has confirmed this item
  confirmedDate?: string | null // When supplier confirmed
  confirmationId?: string | null // Reference to confirmation request
  supplierConfirmationNotes?: string | null // Supplier's notes during confirmation

  // Enhanced audit trail
  purchaseDate: string
  distributedDate?: string | null
  soldDate?: string | null
  returnedDate?: string | null
  reservedDate?: string | null
  reservedBy?: string | null

  returnToSupplierDate?: string | null
  returnToSupplierReason?: string | null
  returnToSupplierReference?: string | null

  // Return tracking
  returnReason?: string | null
  returnDate?: string | null

  // Pricing history
  priceHistory?: PriceHistoryEntry[]
  lastPriceUpdate?: string | null

  // Quality and certification
  certification?: string | null
  qualityGrade?: "A" | "B" | "C" | null
  images?: string[]

  // Location tracking
  currentLocation?: string | null
  locationHistory?: LocationHistoryEntry[]

  // System metadata
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  updatedBy?: string | null
  version: number
  tags?: string[]
}

export interface PriceHistoryEntry {
  date: string
  lomNarxi: number
  lomNarxiKirim: number
  laborCost: number
  sellingPrice: number
  reason: string
  updatedBy: string
}

export interface LocationHistoryEntry {
  date: string
  from: string
  to: string
  reason: string
  transferredBy: string
}

export interface ItemFormData {
  model: string
  category: "Uzuk" | "Sirg'a" | "Bilakuzuk" | "Zanjir" | "Boshqa"
  weight: number
  size?: number
  quantity: number
  lomNarxi: number
  lomNarxiKirim: number
  laborCost: number
  profitPercentage: number
  isProvider: boolean
  branch?: string
  branchName?: string
  color?: string
  purity?: "14K" | "18K" | "21K" | "22K" | "24K"
  stoneType?: string
  stoneWeight?: number
  manufacturer?: string
  notes?: string
  purchaseDate: string
  distributedDate?: string
  supplierName?: string
  paymentStatus?: "unpaid" | "partially_paid" | "paid"
  payedLomNarxi?: number
  sellingPrice?: number
  confirmed?: boolean
}

export interface ItemFilters {
  category?: string
  status?: string
  branch?: string
  isProvider?: boolean
  startDate?: string
  endDate?: string
  search?: string
  paymentStatus?: string
  supplierName?: string
  confirmed?: boolean
}

export interface ItemStats {
  totalItems: number
  totalWeight: number
  totalValue: number
  availableItems: number
  soldItems: number
  returnedItems: number
  branchItems: number
  centralItems: number
  paidItems: number
  unpaidItems: number
  partiallyPaidItems: number
  confirmedItems: number
  unconfirmedItems: number
}

// Validation schemas
export interface ItemValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Bulk operations
export interface BulkImportResult {
  success: number
  failed: number
  errors: string[]
  warnings: string[]
  duplicates: number // Keep for backward compatibility but won't be used
  totalValue: number
}

export interface BulkImportItem extends ItemFormData {
  id?: string // Add unique ID field
  isValid: boolean
  errors?: string[]
  warnings?: string[]
  totalCost?: number
  rowIndex?: number
  isDuplicate?: boolean
}

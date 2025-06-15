import { z } from "zod"

// Item schemas
export const itemBasicSchema = z.object({
  model: z.string().min(1, "Model majburiy"),
  category: z.enum(["Uzuk", "Sirg'a", "Bilakuzuk", "Zanjir", "Boshqa"]),
  weight: z.number().positive("Og'irlik 0 dan katta bo'lishi kerak"),
  size: z.number().optional(),
  quantity: z.number().int().min(1, "Miqdor kamida 1 ta bo'lishi kerak"),
  purchaseDate: z.string(),
  isProvider: z.boolean(),
  branch: z.string().optional(),
  distributedDate: z.string().optional(),
  supplierName: z.string().optional(),
  paymentStatus: z.enum(["unpaid", "partially_paid", "paid"]).default("unpaid"),
})

export const itemPricingSchema = z.object({
  lomNarxi: z.number().positive("Lom Narxi 0 dan katta bo'lishi kerak"),
  lomNarxiKirim: z.number().positive("Lom Narxi Kirim 0 dan katta bo'lishi kerak"),
  laborCost: z.number().min(0, "Ishchi haqi manfiy bo'lishi mumkin emas"),
  profitPercentage: z.number().min(0, "Foyda foizi manfiy bo'lishi mumkin emas"),
  payedLomNarxi: z.number().positive().optional(),
})

export const itemDetailsSchema = z.object({
  color: z.string().optional(),
  purity: z.enum(["14K", "18K", "21K", "22K", "24K"]).optional(),
  stoneType: z.string().optional(),
  stoneWeight: z.number().min(0).optional(),
  manufacturer: z.string().optional(),
  notes: z.string().optional(),
})

export const itemFormSchema = itemBasicSchema.merge(itemPricingSchema).merge(itemDetailsSchema)

// Enhanced item schema with quality and certification
export const enhancedItemSchema = itemFormSchema.extend({
  qualityGrade: z.enum(["A", "B", "C"]).optional(),
  certification: z.string().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  currentLocation: z.string().optional(),
})

// Bulk import schema
export const bulkImportSchema = z.object({
  model: z.string().min(1, "Model majburiy"),
  category: z.enum(["Uzuk", "Sirg'a", "Bilakuzuk", "Zanjir", "Boshqa"]),
  weight: z.number().positive("Og'irlik 0 dan katta bo'lishi kerak"),
  lomNarxi: z.number().positive("Lom Narxi 0 dan katta bo'lishi kerak"),
  lomNarxiKirim: z.number().positive("Lom Narxi Kirim 0 dan katta bo'lishi kerak"),
  laborCost: z.number().min(0, "Ishchi haqi manfiy bo'lishi mumkin emas"),
  profitPercentage: z.number().min(0).default(20),
  quantity: z.number().int().min(1).default(1),
  isProvider: z.boolean().default(false),
  branch: z.string().optional(),
  color: z.string().optional(),
  purity: z.enum(["14K", "18K", "21K", "22K", "24K"]).optional(),
  purchaseDate: z.string().optional(),
  supplierName: z.string().optional(),
})

// Supplier transaction schema
export const supplierTransactionSchema = z.object({
  type: z.enum(["payment", "purchase", "adjustment"]),
  itemIds: z.array(z.string()).optional(),
  totalAmount: z.number().positive("Summa 0 dan katta bo'lishi kerak"),
  payedLomNarxi: z.number().positive("To'langan lom narxi 0 dan katta bo'lishi kerak"),
  originalLomNarxi: z.number().positive().optional(),
  priceDifference: z.number().optional(),
  supplierName: z.string().min(1, "Ta'minotchi nomi majburiy"),
  transactionDate: z.string(),
  paymentDate: z.string().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

// Payment transaction schema
export const paymentTransactionSchema = z.object({
  itemIds: z.array(z.string()).min(1, "Kamida bitta mahsulot tanlash kerak"),
  payedLomNarxi: z.number().positive("To'langan lom narxi 0 dan katta bo'lishi kerak"),
  supplierName: z.string().min(1, "Ta'minotchi nomi majburiy"),
  paymentDate: z.string(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

// Branch schema
export const branchSchema = z.object({
  name: z.string().min(1, "Filial nomi majburiy"),
  address: z.string().min(1, "Manzil majburiy"),
  phone: z.string().optional(),
  manager: z.string().optional(),
  isActive: z.boolean().default(true),
})

// User schema
export const userSchema = z.object({
  email: z.string().email("Noto'g'ri email manzil"),
  name: z.string().min(1, "Ism majburiy"),
  role: z.enum(["admin", "manager", "user"]),
  branch: z.string().optional(),
})

// Settings schemas
export const generalSettingsSchema = z.object({
  companyName: z.string().min(1, "Kompaniya nomi majburiy"),
  currency: z.string().default("UZS"),
  defaultProfitPercentage: z.number().min(0).default(20),
  defaultLaborCost: z.number().min(0).default(70000),
  timezone: z.string().default("Asia/Tashkent"),
})

export const backupSettingsSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  time: z.string(),
  retention: z.number().min(1).max(365),
})

// Analytics filter schema
export const analyticsFilterSchema = z.object({
  timeRange: z.enum(["1month", "3months", "6months", "1year", "all"]),
  branch: z.string().optional(),
  category: z.string().optional(),
  metric: z.enum(["profit", "turnover", "pricing", "seasonal", "risk"]),
})

// Recommendation action schema
export const recommendationActionSchema = z.object({
  recommendationId: z.string(),
  action: z.enum(["apply", "dismiss", "defer"]),
  notes: z.string().optional(),
})

// Price optimization schema
export const priceOptimizationSchema = z.object({
  itemId: z.string(),
  newPrice: z.number().positive(),
  reason: z.string(),
  effectiveDate: z.string(),
})

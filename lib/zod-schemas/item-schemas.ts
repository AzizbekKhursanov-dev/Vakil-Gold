import { z } from "zod"

// Item basic information schema
export const itemBasicSchema = z.object({
  model: z.string().min(1, "Model majburiy"),
  category: z.enum(["Uzuk", "Sirg'a", "Bilakuzuk", "Zanjir", "Boshqa"], {
    errorMap: () => ({ message: "Kategoriya tanlash majburiy" }),
  }),
  weight: z.number().positive("Og'irlik 0 dan katta bo'lishi kerak"),
  size: z.number().optional(),
  quantity: z.number().int().min(1, "Miqdor kamida 1 ta bo'lishi kerak").default(1),
  purchaseDate: z.string().min(1, "Xarid sanasi majburiy"),
  isProvider: z.boolean().default(false),
  branch: z.string().optional(),
  distributedDate: z.string().optional(),
  supplierName: z.string().optional(),
  paymentStatus: z.enum(["unpaid", "partially_paid", "paid"]).default("unpaid"),
})

// Item pricing schema
export const itemPricingSchema = z.object({
  lomNarxi: z.number().positive("Lom Narxi 0 dan katta bo'lishi kerak"),
  lomNarxiKirim: z.number().positive("Lom Narxi Kirim 0 dan katta bo'lishi kerak"),
  laborCost: z.number().min(0, "Ishchi haqi manfiy bo'lishi mumkin emas"),
  profitPercentage: z.number().min(0, "Foyda foizi manfiy bo'lishi mumkin emas").default(20),
  payedLomNarxi: z.number().positive().optional(),
})

// Item details schema
export const itemDetailsSchema = z.object({
  color: z.string().optional(),
  purity: z.enum(["14K", "18K", "21K", "22K", "24K"]).optional(),
  stoneType: z.string().optional(),
  stoneWeight: z.number().min(0).optional(),
  manufacturer: z.string().optional(),
  notes: z.string().optional(),
})

// Complete item form schema
export const itemFormSchema = itemBasicSchema.merge(itemPricingSchema).merge(itemDetailsSchema)

// Bulk import schema - removed unique model requirement
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
  paymentStatus: z.enum(["unpaid", "partially_paid", "paid"]).default("unpaid"),
  size: z.number().optional(),
  stoneType: z.string().optional(),
  stoneWeight: z.number().min(0).optional(),
  manufacturer: z.string().optional(),
  notes: z.string().optional(),
})

// Item validation for bulk import
export const validateBulkImportItem = (item: any) => {
  try {
    return {
      success: true,
      data: bulkImportSchema.parse(item),
      errors: [],
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
      }
    }
    return {
      success: false,
      data: null,
      errors: ["Noma'lum xatolik"],
    }
  }
}

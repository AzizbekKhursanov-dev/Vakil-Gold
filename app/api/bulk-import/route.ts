import { type NextRequest, NextResponse } from "next/server"
import { collection, writeBatch, doc } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { bulkImportSchema } from "@/lib/types/schemas"
import { calculateSellingPrice } from "@/lib/calculations/pricing"

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json()

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 })
    }

    const validatedItems = []
    const errors = []

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      try {
        const validatedItem = bulkImportSchema.parse(items[i])
        const sellingPrice = calculateSellingPrice(validatedItem)

        validatedItems.push({
          ...validatedItem,
          sellingPrice,
          status: "available",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      } catch (error: any) {
        errors.push({
          row: i + 1,
          errors: error.errors?.map((e: any) => e.message) || [error.message],
        })
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation errors found",
          errors,
          validItems: validatedItems.length,
          totalItems: items.length,
        },
        { status: 400 },
      )
    }

    // Batch write to Firestore (max 500 operations per batch)
    const batchSize = 500
    const batches = []

    for (let i = 0; i < validatedItems.length; i += batchSize) {
      const batch = writeBatch(db)
      const batchItems = validatedItems.slice(i, i + batchSize)

      batchItems.forEach((item) => {
        const docRef = doc(collection(db, "items"))
        batch.set(docRef, item)
      })

      batches.push(batch.commit())
    }

    await Promise.all(batches)

    return NextResponse.json({
      success: true,
      imported: validatedItems.length,
      total: items.length,
    })
  } catch (error: any) {
    console.error("Error in bulk import:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

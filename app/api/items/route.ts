import { type NextRequest, NextResponse } from "next/server"
import { collection, addDoc, getDocs, query, where, orderBy, limit, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { itemFormSchema } from "@/lib/types/schemas"
import { calculateSellingPrice } from "@/lib/calculations/pricing"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const branch = searchParams.get("branch")
    const isProvider = searchParams.get("isProvider")
    const limitParam = searchParams.get("limit")
    const lastDoc = searchParams.get("lastDoc")
    const search = searchParams.get("search")

    let q = query(collection(db, "items"), orderBy("createdAt", "desc"))

    // Apply filters
    if (category) {
      q = query(q, where("category", "==", category))
    }
    if (status) {
      q = query(q, where("status", "==", status))
    }
    if (branch) {
      q = query(q, where("branch", "==", branch))
    }
    if (isProvider !== null) {
      q = query(q, where("isProvider", "==", isProvider === "true"))
    }

    // Apply pagination
    if (limitParam) {
      q = query(q, limit(Number.parseInt(limitParam)))
    }
    if (lastDoc) {
      // In a real implementation, you'd need to reconstruct the document reference
      // q = query(q, startAfter(lastDocRef))
    }

    const querySnapshot = await getDocs(q)
    let items = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Apply search filter (client-side for simplicity)
    if (search) {
      const searchLower = search.toLowerCase()
      items = items.filter(
        (item) => item.model?.toLowerCase().includes(searchLower) || item.category?.toLowerCase().includes(searchLower),
      )
    }

    return NextResponse.json({ items, total: items.length })
  } catch (error: any) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate data
    const validatedData = itemFormSchema.parse(data)

    // Calculate selling price
    const sellingPrice = calculateSellingPrice(validatedData)

    // Prepare item data
    const itemData = {
      ...validatedData,
      sellingPrice,
      status: "available",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add to Firestore
    const docRef = await addDoc(collection(db, "items"), itemData)

    return NextResponse.json({
      success: true,
      id: docRef.id,
      item: { id: docRef.id, ...itemData },
    })
  } catch (error: any) {
    console.error("Error creating item:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    // Calculate new selling price if pricing fields changed
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    }

    if (data.weight || data.lomNarxi || data.lomNarxiKirim || data.laborCost || data.profitPercentage) {
      updateData.sellingPrice = calculateSellingPrice(data)
    }

    // Update in Firestore
    await updateDoc(doc(db, "items", id), updateData)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    // Soft delete by updating status
    await updateDoc(doc(db, "items", id), {
      status: "deleted",
      deletedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting item:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { collection, addDoc, getDocs, query, orderBy, where } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { supplierTransactionSchema } from "@/lib/types/schemas"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let q = query(collection(db, "supplierTransactions"), orderBy("transactionDate", "desc"))

    if (startDate) {
      q = query(q, where("transactionDate", ">=", startDate))
    }
    if (endDate) {
      q = query(q, where("transactionDate", "<=", endDate))
    }

    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ transactions })
  } catch (error: any) {
    console.error("Error fetching supplier transactions:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate data
    const validatedData = supplierTransactionSchema.parse(data)

    // Calculate quantity
    const quantity = validatedData.amount / validatedData.pricePerGram

    // Prepare transaction data
    const transactionData = {
      ...validatedData,
      quantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add to Firestore
    const docRef = await addDoc(collection(db, "supplierTransactions"), transactionData)

    return NextResponse.json({
      success: true,
      id: docRef.id,
      transaction: { id: docRef.id, ...transactionData },
    })
  } catch (error: any) {
    console.error("Error creating supplier transaction:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

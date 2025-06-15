import { type NextRequest, NextResponse } from "next/server"
import { itemService } from "@/lib/services/item.service"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const filters = {
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      branch: searchParams.get("branch") || undefined,
      isProvider: searchParams.get("isProvider") ? searchParams.get("isProvider") === "true" : undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      search: searchParams.get("search") || undefined,
    }

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })

    const items = await itemService.getItems(filters)

    return NextResponse.json(items)
  } catch (error) {
    console.error("Export API error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

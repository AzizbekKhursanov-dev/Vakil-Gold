import { type NextRequest, NextResponse } from "next/server"
import { exportData, importData } from "@/lib/services/backup.service"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type")

    if (contentType?.includes("multipart/form-data")) {
      // Handle file import
      const formData = await request.formData()
      const file = formData.get("file") as File

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      const result = await importData(file)
      return NextResponse.json(result)
    } else {
      // Handle export
      const body = await request.json()

      if (body.action === "export") {
        const result = await exportData()
        return NextResponse.json(result)
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Backup API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get backup status or list
    return NextResponse.json({ status: "ready" })
  } catch (error: any) {
    console.error("Backup status error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

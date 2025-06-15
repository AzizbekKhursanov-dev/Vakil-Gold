import { NextResponse } from "next/server"
import { getBackupHistory } from "@/lib/services/backup.service"

export async function GET() {
  try {
    const backups = await getBackupHistory()
    return NextResponse.json({ backups })
  } catch (error: any) {
    console.error("Backup history error:", error)
    return NextResponse.json({ error: error.message || "Failed to get backup history" }, { status: 500 })
  }
}

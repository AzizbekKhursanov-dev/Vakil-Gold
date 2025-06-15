import { type NextRequest, NextResponse } from "next/server"
import { scheduleBackup, getBackupSchedule } from "@/lib/services/backup.service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await scheduleBackup(body)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Schedule backup error:", error)
    return NextResponse.json({ error: error.message || "Failed to schedule backup" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const schedule = await getBackupSchedule()
    return NextResponse.json(schedule)
  } catch (error: any) {
    console.error("Get backup schedule error:", error)
    return NextResponse.json({ error: error.message || "Failed to get backup schedule" }, { status: 500 })
  }
}

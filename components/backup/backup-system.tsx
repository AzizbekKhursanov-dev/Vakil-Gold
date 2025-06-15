"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, Trash2, Database, Clock, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocalStorageState } from "@/lib/hooks/use-local-storage"

interface BackupFile {
  id: string
  filename: string
  date: string
  size: string
  downloadURL: string
  status: "completed" | "failed" | "in-progress"
  itemCount?: number
  branchCount?: number
}

interface BackupSchedule {
  enabled: boolean
  frequency: "daily" | "weekly" | "monthly"
  time: string
  retention: number
}

export function BackupSystem() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [backupHistory, setBackupHistory] = useState<BackupFile[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Local storage for backup schedule
  const { value: schedule, updateValue: updateSchedule } = useLocalStorageState<BackupSchedule>("backup-schedule", {
    enabled: false,
    frequency: "daily",
    time: "00:00",
    retention: 30,
  })

  // Fetch backup history on component mount
  useEffect(() => {
    fetchBackupHistory()
  }, [])

  const fetchBackupHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/backup/history")

      if (response.ok) {
        const data = await response.json()
        setBackupHistory(data.backups || [])
      } else {
        throw new Error("Failed to fetch backup history")
      }
    } catch (error: any) {
      console.error("Failed to fetch backup history:", error)
      toast({
        title: "Xatolik",
        description: "Zaxira tarixini yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch("/api/backup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "export" }),
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Export failed")
      }

      const result = await response.json()
      setExportProgress(100)

      toast({
        title: "Eksport muvaffaqiyatli",
        description: `Zaxira yaratildi: ${result.filename}`,
      })

      // Refresh backup history
      await fetchBackupHistory()
    } catch (error: any) {
      console.error("Export error:", error)
      toast({
        title: "Eksport xatoligi",
        description: error.message || "Zaxira yaratishda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
      setTimeout(() => setExportProgress(0), 2000)
    }
  }

  const handleImport = async (file: File) => {
    if (!file) return

    setIsImporting(true)
    setImportProgress(0)

    try {
      // Validate file type
      if (!file.name.endsWith(".json")) {
        throw new Error("Faqat JSON fayllar qabul qilinadi")
      }

      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("Fayl hajmi 50MB dan oshmasligi kerak")
      }

      const formData = new FormData()
      formData.append("file", file)

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch("/api/backup", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Import failed")
      }

      const result = await response.json()
      setImportProgress(100)

      toast({
        title: "Import muvaffaqiyatli",
        description: `Ma'lumotlar tiklandi: ${result.collections?.join(", ") || "Barcha ma'lumotlar"}`,
      })

      // Refresh backup history
      await fetchBackupHistory()
    } catch (error: any) {
      console.error("Import error:", error)
      toast({
        title: "Import xatoligi",
        description: error.message || "Ma'lumotlarni tiklashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      setTimeout(() => setImportProgress(0), 2000)
    }
  }

  const deleteBackup = async (filename: string) => {
    try {
      const response = await fetch(`/api/backup?filename=${encodeURIComponent(filename)}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Zaxira o'chirildi",
          description: "Zaxira fayli muvaffaqiyatli o'chirildi",
        })
        await fetchBackupHistory()
      } else {
        throw new Error("Failed to delete backup")
      }
    } catch (error: any) {
      console.error("Delete error:", error)
      toast({
        title: "O'chirish xatoligi",
        description: error.message || "Zaxirani o'chirishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const saveSchedule = async () => {
    try {
      const response = await fetch("/api/backup/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(schedule),
      })

      if (response.ok) {
        toast({
          title: "Jadval saqlandi",
          description: "Avtomatik zaxiralash jadvali yangilandi",
        })
      } else {
        throw new Error("Failed to save schedule")
      }
    } catch (error: any) {
      console.error("Schedule save error:", error)
      toast({
        title: "Saqlash xatoligi",
        description: error.message || "Jadvalni saqlashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Tugallangan
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Xatolik
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Jarayonda
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Manual Backup/Restore */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Zaxira yaratish
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Muhim</AlertTitle>
              <AlertDescription>
                Bu barcha ma'lumotlaringizning to'liq zaxirasini yaratadi: mahsulotlar, filiallar, foydalanuvchilar va
                tranzaksiyalar.
              </AlertDescription>
            </Alert>

            {isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Zaxira yaratilmoqda...</span>
                  <span>{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} />
              </div>
            )}

            <Button onClick={handleExport} disabled={isExporting} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Yaratilmoqda..." : "Zaxira yaratish"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Zaxiradan tiklash
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ogohlantirish</AlertTitle>
              <AlertDescription>
                Tiklash barcha mavjud ma'lumotlarni almashtiradi. Bu amalni bekor qilib bo'lmaydi.
              </AlertDescription>
            </Alert>

            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ma'lumotlar tiklanmoqda...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}

            <Input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImport(file)
              }}
              disabled={isImporting}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Faqat JSON formatidagi zaxira fayllar qabul qilinadi (maksimal 50MB)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Automatic Backup Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Avtomatik zaxiralash jadvali
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="schedule-enabled"
              checked={schedule.enabled}
              onCheckedChange={(enabled) => updateSchedule({ enabled })}
            />
            <Label htmlFor="schedule-enabled">Avtomatik zaxiralashni yoqish</Label>
          </div>

          {schedule.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Chastota</Label>
                <Select
                  value={schedule.frequency}
                  onValueChange={(frequency: "daily" | "weekly" | "monthly") => updateSchedule({ frequency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Har kuni</SelectItem>
                    <SelectItem value="weekly">Har hafta</SelectItem>
                    <SelectItem value="monthly">Har oy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Vaqt</Label>
                <Input
                  id="time"
                  type="time"
                  value={schedule.time}
                  onChange={(e) => updateSchedule({ time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention">Saqlash muddati (kun)</Label>
                <Input
                  id="retention"
                  type="number"
                  min="1"
                  max="365"
                  value={schedule.retention}
                  onChange={(e) => updateSchedule({ retention: Number.parseInt(e.target.value) })}
                />
              </div>
            </div>
          )}

          <Button onClick={saveSchedule} disabled={!schedule.enabled}>
            Jadvalni saqlash
          </Button>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Zaxira tarixi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Yuklanmoqda...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fayl nomi</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Hajm</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Ma'lumotlar</TableHead>
                  <TableHead>Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Hozircha zaxira fayllar mavjud emas
                    </TableCell>
                  </TableRow>
                ) : (
                  backupHistory.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.filename}</TableCell>
                      <TableCell>{new Date(backup.date).toLocaleString()}</TableCell>
                      <TableCell>{backup.size}</TableCell>
                      <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {backup.itemCount && <div>Mahsulotlar: {backup.itemCount}</div>}
                          {backup.branchCount && <div>Filiallar: {backup.branchCount}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" asChild>
                            <a href={backup.downloadURL} download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteBackup(backup.filename)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

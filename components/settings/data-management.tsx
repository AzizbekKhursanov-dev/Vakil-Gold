"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  Archive,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
} from "lucide-react"

export function DataManagement() {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)

  const [settings, setSettings] = useState({
    autoBackup: true,
    backupFrequency: "daily",
    backupRetention: 30,
    compressionEnabled: true,
    encryptBackups: true,
    includeImages: true,
    includeReports: false,
  })

  // Mock data for demonstration
  const backupHistory = [
    {
      id: "1",
      date: "2024-01-15 14:30",
      type: "Avtomatik",
      size: "245 MB",
      status: "Muvaffaqiyatli",
      location: "Firebase Storage",
    },
    {
      id: "2",
      date: "2024-01-14 14:30",
      type: "Avtomatik",
      size: "243 MB",
      status: "Muvaffaqiyatli",
      location: "Firebase Storage",
    },
    {
      id: "3",
      date: "2024-01-13 09:15",
      type: "Qo'lda",
      size: "241 MB",
      status: "Muvaffaqiyatli",
      location: "Mahalliy",
    },
  ]

  const dataStats = {
    totalItems: 1247,
    totalTransactions: 3456,
    totalCustomers: 892,
    totalSuppliers: 45,
    databaseSize: "245 MB",
    lastBackup: "2024-01-15 14:30",
  }

  const handleExport = async (format: string) => {
    setIsExporting(true)
    setExportProgress(0)

    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsExporting(false)
          toast({
            title: "Export yakunlandi",
            description: `Ma'lumotlar ${format} formatida yuklab olindi`,
          })
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  const handleImport = async () => {
    setIsImporting(true)
    setImportProgress(0)

    // Simulate import progress
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsImporting(false)
          toast({
            title: "Import yakunlandi",
            description: "Ma'lumotlar muvaffaqiyatli yuklandi",
          })
          return 100
        }
        return prev + 15
      })
    }, 600)
  }

  const handleBackup = () => {
    toast({
      title: "Zaxira yaratilmoqda",
      description: "Ma'lumotlar zaxira nusxasi yaratilmoqda...",
    })
  }

  const handleRestore = (backupId: string) => {
    toast({
      title: "Ma'lumotlar tiklanmoqda",
      description: "Tanlangan zaxira nusxasidan ma'lumotlar tiklanmoqda...",
    })
  }

  const handleCleanup = () => {
    toast({
      title: "Ma'lumotlar tozalanmoqda",
      description: "Eski va keraksiz ma'lumotlar o'chirilmoqda...",
    })
  }

  return (
    <div className="space-y-6">
      {/* Database Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Ma'lumotlar bazasi statistikasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{dataStats.totalItems}</div>
              <div className="text-sm text-muted-foreground">Mahsulotlar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{dataStats.totalTransactions}</div>
              <div className="text-sm text-muted-foreground">Tranzaksiyalar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{dataStats.totalCustomers}</div>
              <div className="text-sm text-muted-foreground">Mijozlar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{dataStats.totalSuppliers}</div>
              <div className="text-sm text-muted-foreground">Ta'minotchilar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{dataStats.databaseSize}</div>
              <div className="text-sm text-muted-foreground">Hajm</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">So'nggi zaxira</div>
              <div className="text-xs text-muted-foreground">{dataStats.lastBackup}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Ma'lumotlarni eksport qilish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => handleExport("Excel")}
              disabled={isExporting}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <FileSpreadsheet className="h-8 w-8" />
              <span>Excel formatida</span>
              <span className="text-xs text-muted-foreground">Jadvallar va hisobotlar</span>
            </Button>

            <Button
              onClick={() => handleExport("JSON")}
              disabled={isExporting}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Database className="h-8 w-8" />
              <span>JSON formatida</span>
              <span className="text-xs text-muted-foreground">Barcha ma'lumotlar</span>
            </Button>

            <Button
              onClick={() => handleExport("PDF")}
              disabled={isExporting}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <FileSpreadsheet className="h-8 w-8" />
              <span>PDF hisobot</span>
              <span className="text-xs text-muted-foreground">Tayyorlangan hisobot</span>
            </Button>
          </div>

          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Eksport jarayoni</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Ma'lumotlarni import qilish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Faylni yuklash</h3>
            <p className="text-muted-foreground mb-4">Excel, CSV yoki JSON formatidagi fayllarni bu yerga tashlang</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleImport} disabled={isImporting}>
                Fayl tanlash
              </Button>
              <Button variant="outline" disabled={isImporting}>
                Namuna yuklab olish
              </Button>
            </div>
          </div>

          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Import jarayoni</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Muhim eslatma</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Import jarayoni mavjud ma'lumotlarni o'zgartirishi mumkin. Avval zaxira nusxa yarating.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Archive className="mr-2 h-5 w-5" />
            Zaxira sozlamalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Avtomatik zaxiralash</Label>
              <p className="text-sm text-muted-foreground">Ma'lumotlarni muntazam ravishda zaxiralash</p>
            </div>
            <Switch
              checked={settings.autoBackup}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoBackup: checked }))}
            />
          </div>

          {settings.autoBackup && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Zaxiralash chastotasi</Label>
                  <Select
                    value={settings.backupFrequency}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, backupFrequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Soatlik</SelectItem>
                      <SelectItem value="daily">Kunlik</SelectItem>
                      <SelectItem value="weekly">Haftalik</SelectItem>
                      <SelectItem value="monthly">Oylik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Zaxira saqlash muddati (kun)</Label>
                  <Input
                    type="number"
                    value={settings.backupRetention}
                    onChange={(e) => setSettings((prev) => ({ ...prev, backupRetention: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Siqishni yoqish</Label>
                  <Switch
                    checked={settings.compressionEnabled}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, compressionEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Zaxiralarni shifrlash</Label>
                  <Switch
                    checked={settings.encryptBackups}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, encryptBackups: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Rasmlarni qo'shish</Label>
                  <Switch
                    checked={settings.includeImages}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, includeImages: checked }))}
                  />
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button onClick={handleBackup} className="flex items-center">
              <Archive className="mr-2 h-4 w-4" />
              Zaxira yaratish
            </Button>
            <Button variant="outline" onClick={handleCleanup} className="flex items-center">
              <Trash2 className="mr-2 h-4 w-4" />
              Eski zaxiralarni tozalash
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Zaxira tarixi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {backupHistory.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Archive className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{backup.date}</div>
                    <div className="text-sm text-muted-foreground">
                      {backup.type} • {backup.size} • {backup.location}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={backup.status === "Muvaffaqiyatli" ? "default" : "destructive"}>
                    {backup.status === "Muvaffaqiyatli" ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {backup.status}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => handleRestore(backup.id)}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Tiklash
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3 mr-1" />
                    Yuklab olish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HardDrive className="mr-2 h-5 w-5" />
            Ma'lumotlarni tozalash
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Trash2 className="h-6 w-6" />
              <span>Eski loglarni o'chirish</span>
              <span className="text-xs text-muted-foreground">30 kundan eski</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6" />
              <span>Keshni tozalash</span>
              <span className="text-xs text-muted-foreground">Vaqtinchalik fayllar</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Database className="h-6 w-6" />
              <span>Ma'lumotlar bazasini optimallashtirish</span>
              <span className="text-xs text-muted-foreground">Indekslarni yangilash</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Archive className="h-6 w-6" />
              <span>Arxivlash</span>
              <span className="text-xs text-muted-foreground">Eski ma'lumotlar</span>
            </Button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Ehtiyot bo'ling</h4>
                <p className="text-sm text-red-700 mt-1">
                  Tozalash operatsiyalari qaytarib bo'lmaydigan o'zgarishlar kiritishi mumkin. Avval zaxira nusxa
                  yarating.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

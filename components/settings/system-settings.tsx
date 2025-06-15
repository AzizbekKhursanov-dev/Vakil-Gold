"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Database, Server, HardDrive, Wifi, RefreshCw, AlertTriangle } from "lucide-react"

export function SystemSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    debugMode: false,
    logLevel: "info",
    sessionTimeout: 30,
    maxFileSize: 50,
    enableCache: true,
    cacheExpiry: 24,
    enableCompression: true,
    enableSSL: true,
    backupRetention: 30,
    autoCleanup: true,
    cleanupInterval: 7,
  })

  // Mock system info
  const systemInfo = {
    version: "1.2.3",
    uptime: "15 kun 8 soat",
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 78,
    activeUsers: 12,
    totalRequests: 45678,
    errorRate: 0.02,
  }

  const handleSave = () => {
    toast({
      title: "Tizim sozlamalari saqlandi",
      description: "Tizim sozlamalari muvaffaqiyatli yangilandi",
    })
  }

  const handleInputChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSystemRestart = () => {
    toast({
      title: "Tizim qayta ishga tushirilmoqda",
      description: "Tizim bir necha daqiqada qayta ishga tushadi",
    })
  }

  const handleClearCache = () => {
    toast({
      title: "Kesh tozalandi",
      description: "Tizim keshi muvaffaqiyatli tozalandi",
    })
  }

  return (
    <div className="space-y-6">
      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="mr-2 h-5 w-5" />
            Tizim ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Versiya</Label>
              <div className="text-lg font-medium">{systemInfo.version}</div>
            </div>
            <div className="space-y-2">
              <Label>Ishlash vaqti</Label>
              <div className="text-lg font-medium">{systemInfo.uptime}</div>
            </div>
            <div className="space-y-2">
              <Label>Faol foydalanuvchilar</Label>
              <div className="text-lg font-medium">{systemInfo.activeUsers}</div>
            </div>
            <div className="space-y-2">
              <Label>Jami so'rovlar</Label>
              <div className="text-lg font-medium">{systemInfo.totalRequests.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HardDrive className="mr-2 h-5 w-5" />
            Tizim ishlashi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>CPU foydalanishi</Label>
                <span className="text-sm font-medium">{systemInfo.cpuUsage}%</span>
              </div>
              <Progress value={systemInfo.cpuUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Xotira foydalanishi</Label>
                <span className="text-sm font-medium">{systemInfo.memoryUsage}%</span>
              </div>
              <Progress value={systemInfo.memoryUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Disk foydalanishi</Label>
                <span className="text-sm font-medium">{systemInfo.diskUsage}%</span>
              </div>
              <Progress value={systemInfo.diskUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Xatolik darajasi</Label>
                <span className="text-sm font-medium">{systemInfo.errorRate}%</span>
              </div>
              <Progress value={systemInfo.errorRate} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Tizim konfiguratsiyasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Sessiya tugash vaqti (daqiqa)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleInputChange("sessionTimeout", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxFileSize">Maksimal fayl hajmi (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => handleInputChange("maxFileSize", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logLevel">Log darajasi</Label>
              <Select value={settings.logLevel} onValueChange={(value) => handleInputChange("logLevel", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cacheExpiry">Kesh tugash vaqti (soat)</Label>
              <Input
                id="cacheExpiry"
                type="number"
                value={settings.cacheExpiry}
                onChange={(e) => handleInputChange("cacheExpiry", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ta'mirlash rejimi</Label>
                <p className="text-sm text-muted-foreground">Tizimni ta'mirlash rejimiga o'tkazish</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleInputChange("maintenanceMode", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Debug rejimi</Label>
                <p className="text-sm text-muted-foreground">Tizim xatolarini batafsil ko'rsatish</p>
              </div>
              <Switch
                checked={settings.debugMode}
                onCheckedChange={(checked) => handleInputChange("debugMode", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Keshni yoqish</Label>
                <p className="text-sm text-muted-foreground">Tizim tezligini oshirish uchun kesh</p>
              </div>
              <Switch
                checked={settings.enableCache}
                onCheckedChange={(checked) => handleInputChange("enableCache", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ma'lumotlarni siqish</Label>
                <p className="text-sm text-muted-foreground">Tarmoq trafigini kamaytirish</p>
              </div>
              <Switch
                checked={settings.enableCompression}
                onCheckedChange={(checked) => handleInputChange("enableCompression", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SSL shifrlash</Label>
                <p className="text-sm text-muted-foreground">Xavfsiz ulanish uchun SSL</p>
              </div>
              <Switch
                checked={settings.enableSSL}
                onCheckedChange={(checked) => handleInputChange("enableSSL", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Avtomatik tozalash</Label>
                <p className="text-sm text-muted-foreground">Eski fayllarni avtomatik o'chirish</p>
              </div>
              <Switch
                checked={settings.autoCleanup}
                onCheckedChange={(checked) => handleInputChange("autoCleanup", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wifi className="mr-2 h-5 w-5" />
            Tizim amallar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={handleClearCache} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Keshni tozalash
            </Button>

            <Button onClick={handleSystemRestart} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tizimni qayta ishga tushirish
            </Button>

            <Button variant="outline">
              <Database className="mr-2 h-4 w-4" />
              Ma'lumotlar bazasini optimallashtirish
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      {(systemInfo.diskUsage > 80 || systemInfo.memoryUsage > 80) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Tizim ogohlantirishlari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-yellow-700">
              {systemInfo.diskUsage > 80 && (
                <p>⚠️ Disk foydalanishi 80% dan oshdi. Eski fayllarni tozalash tavsiya etiladi.</p>
              )}
              {systemInfo.memoryUsage > 80 && (
                <p>⚠️ Xotira foydalanishi 80% dan oshdi. Tizimni qayta ishga tushirish tavsiya etiladi.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>Sozlamalarni saqlash</Button>
      </div>
    </div>
  )
}

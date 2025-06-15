"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Shield, Lock, Eye, Key, Clock } from "lucide-react"

export function SecuritySettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    // Password policies
    minPasswordLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpiry: 90,
    
    // Two-factor authentication
    twoFactorEnabled: false,
    twoFactorMethod: "sms",
    
    // Session management
    sessionTimeout: 30,
    maxConcurrentSessions: 3,
    logoutOnClose: false,
    
    // Security monitoring
    loginAttemptLimit: 5,
    lockoutDuration: 15,
    enableAuditLog: true,
    enableIpWhitelist: false,
    
    // Data encryption
    encryptSensitiveData: true,
    encryptBackups: true,
    
    // API security
    enableApiRateLimit: true,
    apiRequestLimit: 1000,
    apiTimeWindow: 60,
  })

  // Mock security logs
  const securityLogs = [
    {
      id: "1",
      timestamp: "2024-01-15 14:30:25",
      event: "Muvaffaqiyatli kirish",
      user: "admin@vakilgold.uz",
      ip: "192.168.1.100",
      status: "success"
    },
    {
      id: "2",
      timestamp: "2024-01-15 14:25:10",
      event: "Noto'g'ri parol",
      user: "user@vakilgold.uz",
      ip: "192.168.1.105",
      status: "warning"
    },
    {
      id: "3",
      timestamp: "2024-01-15 14:20:45",
      event: "Hisobdan chiqish",
      user: "manager@vakilgold.uz",
      ip: "192.168.1.102",
      status: "info"
    },
    {
      id: "4",
      timestamp: "2024-01-15 14:15:30",
      event: "Ko'p urinish",
      user: "unknown@example.com",
      ip: "203.0.113.1",
      status: "danger"
    }
  ]

  const handleSave = () => {
    toast({
      title: "Xavfsizlik sozlamalari saqlandi",
      description: "Xavfsizlik sozlamalari muvaffaqiyatli yangilandi",
    })
  }

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success": return <Badge className="bg-green-100 text-green-800">Muvaffaqiyat</Badge>
      case "warning": return <Badge className="bg-yellow-100 text-yellow-800">Ogohlantirish</Badge>
      case "danger": return <Badge className="bg-red-100 text-red-800">Xavf</Badge>
      case "info": return <Badge className="bg-blue-100 text-blue-800">Ma'lumot</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Password Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="mr-2 h-5 w-5" />
            Parol siyosati
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minPasswordLength">Minimal parol uzunligi</Label>
              <Input
                id="minPasswordLength"
                type="number"
                value={settings.minPasswordLength}
                onChange={(e) => handleInputChange("minPasswordLength", Number(e.target.value))}
                min="6"
                max="20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordExpiry">Parol amal qilish muddati (kun)</Label>
              <Input
                id="passwordExpiry"
                type="number"
                value={settings.passwordExpiry}
                onChange={(e) => handleInputChange("passwordExpiry", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Katta harflar talab qilinadi</Label>
              <Switch
                checked={settings.requireUppercase}
                onCheckedChange={(checked) => handleInputChange("requireUppercase", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Kichik harflar talab qilinadi</Label>
              <Switch
                checked={settings.requireLowercase}
                onCheckedChange={(checked) => handleInputChange("requireLowercase", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Raqamlar talab qilinadi</Label>
              <Switch
                checked={settings.requireNumbers}
                onCheckedChange={(checked) => handleInputChange("requireNumbers", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Maxsus belgilar talab qilinadi</Label>
              <Switch
                checked={settings.requireSpecialChars}
                onCheckedChange={(checked) => handleInputChange("requireSpecialChars", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="mr-2 h-5 w-5" />
            Ikki bosqichli autentifikatsiya
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>2FA ni yoqish</Label>
              <p className="text-sm text-muted-foreground">
                Qo'shimcha xavfsizlik uchun ikki bosqichli tasdiqlash
              </p>
            </div>
            <Switch
              checked={settings.twoFactorEnabled}
              onCheckedChange={(checked) => handleInputChange("twoFactorEnabled", checked)}
            />
          </div>

          {settings.twoFactorEnabled && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Label htmlFor="twoFactorMethod">2FA usuli</Label>
              <Select value={settings.twoFactorMethod} onValueChange={(value) => handleInputChange("twoFactorMethod", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS kod</SelectItem>
                  <SelectItem value="email">Email kod</SelectItem>
                  <SelectItem value="app">Authenticator ilovasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Sessiya boshqaruvi
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
              <Label htmlFor="maxConcurrentSessions">Maksimal bir vaqtdagi sessiyalar</Label>
              <Input
                id="maxConcurrentSessions"
                type="number"
                value={settings.maxConcurrentSessions}
                onChange={(e) => handleInputChange("maxConcurrentSessions", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Brauzer yopilganda chiqish</Label>
              <p className="text-sm text-muted-foreground">
                Brauzer yopilganda avtomatik tizimdan chiqish
              </p>
            </div>
            <Switch
              checked={settings.logoutOnClose}
              onCheckedChange={(checked) => handleInputChange("logoutOnClose", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            Xavfsizlik monitoringi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loginAttemptLimit">Kirish urinishlari chegarasi</Label>
              <Input
                id="loginAttemptLimit"
                type="number"
                value={settings.loginAttemptLimit}
                onChange={(e) => handleInputChange("loginAttemptLimit", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lockoutDuration">Bloklash muddati (daqiqa)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                value={settings.lockoutDuration}
                onChange={(e) => handleInputChange("lockoutDuration", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Audit logini yoqish</Label>
              <Switch
                checked={settings.enableAuditLog}
                onCheckedChange={(checked) => handleInputChange("enableAuditLog", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>IP oq ro'yxatini yoqish</Label>
              <Switch
                checked={settings.enableIpWhitelist}
                onCheckedChange={(checked) => handleInputChange("enableIpWhitelist", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Encryption */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Ma'lumotlar shifrlash
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maxfiy ma'lumotlarni shifrlash</Label>
              <p className="text-sm text-muted-foreground">
                Parollar va maxfiy ma'lumotlarni shifrlash
              </p>
            </div>
            <Switch
              checked={settings.encryptSensitiveData}
              onCheckedChange={(checked) => handleInputChange("encryptSensitiveData", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Zaxira nusxalarni shifrlash</Label>
              <p className="text-sm text-muted-foreground">
                Barcha zaxira nusxalarni shifrlash
              </p>
            </div>
            <Switch
              checked={settings.encryptBackups}
              onCheckedChange={(checked) => handleInputChange("encryptBackups", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* API Security */}
      <Card>
        <CardHeader>
          <CardTitle>API xavfsizligi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>API so'rovlar cheklovi</Label>
              <p className="text-sm text-muted-foreground">
                API so'rovlar sonini cheklash
              </p>
            </div>
            <Switch
              checked={settings.enableApiRateLimit}
              onCheckedChange={(checked) => handleInputChange("enableApiRateLimit", checked)}
            />
          </div>

          {settings.enableApiRateLimit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
              <div className="space-y\

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Bell, Mail, Smartphone, Volume2 } from "lucide-react"

export function NotificationSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    // Email notifications
    emailEnabled: true,
    emailAddress: "admin@vakilgold.uz",
    emailFrequency: "immediate",
    lowStockEmail: true,
    salesEmail: true,
    systemEmail: true,

    // SMS notifications
    smsEnabled: false,
    smsNumber: "+998901234567",
    lowStockSms: false,
    salesSms: false,
    systemSms: false,

    // Push notifications
    pushEnabled: true,
    lowStockPush: true,
    salesPush: true,
    systemPush: true,

    // Sound notifications
    soundEnabled: true,
    soundVolume: 50,

    // Notification thresholds
    lowStockThreshold: 10,
    highValueSaleThreshold: 5000000,

    // Custom messages
    lowStockMessage: "Mahsulot qoldig'i kam!",
    salesMessage: "Yangi sotuv amalga oshirildi",
    systemMessage: "Tizim xabari",
  })

  const handleSave = () => {
    toast({
      title: "Bildirishnoma sozlamalari saqlandi",
      description: "Bildirishnoma sozlamalari muvaffaqiyatli yangilandi",
    })
  }

  const handleInputChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleTestNotification = (type: string) => {
    toast({
      title: "Test bildirishnoma",
      description: `${type} bildirishnomasi yuborildi`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Email bildirishnomalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email bildirishnomalarini yoqish</Label>
              <p className="text-sm text-muted-foreground">Muhim hodisalar haqida email orqali xabar olish</p>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => handleInputChange("emailEnabled", checked)}
            />
          </div>

          {settings.emailEnabled && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emailAddress">Email manzil</Label>
                  <Input
                    id="emailAddress"
                    type="email"
                    value={settings.emailAddress}
                    onChange={(e) => handleInputChange("emailAddress", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailFrequency">Yuborish chastotasi</Label>
                  <Select
                    value={settings.emailFrequency}
                    onValueChange={(value) => handleInputChange("emailFrequency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Darhol</SelectItem>
                      <SelectItem value="hourly">Soatlik</SelectItem>
                      <SelectItem value="daily">Kunlik</SelectItem>
                      <SelectItem value="weekly">Haftalik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Kam qoldiq haqida</Label>
                  <Switch
                    checked={settings.lowStockEmail}
                    onCheckedChange={(checked) => handleInputChange("lowStockEmail", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Sotuv haqida</Label>
                  <Switch
                    checked={settings.salesEmail}
                    onCheckedChange={(checked) => handleInputChange("salesEmail", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Tizim xabarlari</Label>
                  <Switch
                    checked={settings.systemEmail}
                    onCheckedChange={(checked) => handleInputChange("systemEmail", checked)}
                  />
                </div>
              </div>

              <Button variant="outline" onClick={() => handleTestNotification("Email")}>
                Test email yuborish
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="mr-2 h-5 w-5" />
            SMS bildirishnomalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS bildirishnomalarini yoqish</Label>
              <p className="text-sm text-muted-foreground">Muhim hodisalar haqida SMS orqali xabar olish</p>
            </div>
            <Switch
              checked={settings.smsEnabled}
              onCheckedChange={(checked) => handleInputChange("smsEnabled", checked)}
            />
          </div>

          {settings.smsEnabled && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div className="space-y-2">
                <Label htmlFor="smsNumber">Telefon raqam</Label>
                <Input
                  id="smsNumber"
                  value={settings.smsNumber}
                  onChange={(e) => handleInputChange("smsNumber", e.target.value)}
                  placeholder="+998901234567"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Kam qoldiq haqida</Label>
                  <Switch
                    checked={settings.lowStockSms}
                    onCheckedChange={(checked) => handleInputChange("lowStockSms", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Sotuv haqida</Label>
                  <Switch
                    checked={settings.salesSms}
                    onCheckedChange={(checked) => handleInputChange("salesSms", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Tizim xabarlari</Label>
                  <Switch
                    checked={settings.systemSms}
                    onCheckedChange={(checked) => handleInputChange("systemSms", checked)}
                  />
                </div>
              </div>

              <Button variant="outline" onClick={() => handleTestNotification("SMS")}>
                Test SMS yuborish
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Push bildirishnomalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push bildirishnomalarini yoqish</Label>
              <p className="text-sm text-muted-foreground">Brauzer orqali bildirishnomalar olish</p>
            </div>
            <Switch
              checked={settings.pushEnabled}
              onCheckedChange={(checked) => handleInputChange("pushEnabled", checked)}
            />
          </div>

          {settings.pushEnabled && (
            <div className="space-y-3 pl-4 border-l-2 border-muted">
              <div className="flex items-center justify-between">
                <Label>Kam qoldiq haqida</Label>
                <Switch
                  checked={settings.lowStockPush}
                  onCheckedChange={(checked) => handleInputChange("lowStockPush", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Sotuv haqida</Label>
                <Switch
                  checked={settings.salesPush}
                  onCheckedChange={(checked) => handleInputChange("salesPush", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Tizim xabarlari</Label>
                <Switch
                  checked={settings.systemPush}
                  onCheckedChange={(checked) => handleInputChange("systemPush", checked)}
                />
              </div>

              <Button variant="outline" onClick={() => handleTestNotification("Push")}>
                Test push yuborish
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Volume2 className="mr-2 h-5 w-5" />
            Ovoz sozlamalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ovozli bildirishnomalar</Label>
              <p className="text-sm text-muted-foreground">Bildirishnomalar uchun ovoz signali</p>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => handleInputChange("soundEnabled", checked)}
            />
          </div>

          {settings.soundEnabled && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Label htmlFor="soundVolume">Ovoz balandligi: {settings.soundVolume}%</Label>
              <input
                type="range"
                id="soundVolume"
                min="0"
                max="100"
                value={settings.soundVolume}
                onChange={(e) => handleInputChange("soundVolume", Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Bildirishnoma chegaralari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Kam qoldiq chegarasi</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => handleInputChange("lowStockThreshold", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Mahsulot miqdori bu raqamdan kam bo'lganda bildirishnoma yuboriladi
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="highValueSaleThreshold">Katta sotuv chegarasi (so'm)</Label>
              <Input
                id="highValueSaleThreshold"
                type="number"
                value={settings.highValueSaleThreshold}
                onChange={(e) => handleInputChange("highValueSaleThreshold", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Bu summadan katta sotuvlar haqida alohida bildirishnoma yuboriladi
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Maxsus xabarlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lowStockMessage">Kam qoldiq xabari</Label>
            <Textarea
              id="lowStockMessage"
              value={settings.lowStockMessage}
              onChange={(e) => handleInputChange("lowStockMessage", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salesMessage">Sotuv xabari</Label>
            <Textarea
              id="salesMessage"
              value={settings.salesMessage}
              onChange={(e) => handleInputChange("salesMessage", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemMessage">Tizim xabari</Label>
            <Textarea
              id="systemMessage"
              value={settings.systemMessage}
              onChange={(e) => handleInputChange("systemMessage", e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>Sozlamalarni saqlash</Button>
      </div>
    </div>
  )
}

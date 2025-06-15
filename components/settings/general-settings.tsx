"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Save, Building, Globe, Clock } from "lucide-react"

export function GeneralSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    companyName: "Vakil Gold",
    companyAddress: "Toshkent, O'zbekiston",
    companyPhone: "+998 90 123 45 67",
    companyEmail: "info@vakilgold.uz",
    currency: "UZS",
    language: "uz",
    timezone: "Asia/Tashkent",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1,234.56",
    enableNotifications: true,
    enableAutoBackup: true,
    backupFrequency: "daily",
    defaultProfitMargin: 25,
    defaultLaborCost: 70000,
    taxRate: 12,
  })

  const handleSave = () => {
    // In a real app, this would save to Firebase
    toast({
      title: "Sozlamalar saqlandi",
      description: "Umumiy sozlamalar muvaffaqiyatli yangilandi",
    })
  }

  const handleInputChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Kompaniya ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Kompaniya nomi</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={settings.companyEmail}
                onChange={(e) => handleInputChange("companyEmail", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyPhone">Telefon</Label>
              <Input
                id="companyPhone"
                value={settings.companyPhone}
                onChange={(e) => handleInputChange("companyPhone", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Valyuta</Label>
              <Select value={settings.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UZS">O'zbek so'mi (UZS)</SelectItem>
                  <SelectItem value="USD">Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">Evro (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyAddress">Manzil</Label>
            <Textarea
              id="companyAddress"
              value={settings.companyAddress}
              onChange={(e) => handleInputChange("companyAddress", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Localization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5" />
            Lokalizatsiya sozlamalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Til</Label>
              <Select value={settings.language} onValueChange={(value) => handleInputChange("language", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uz">O'zbek tili</SelectItem>
                  <SelectItem value="ru">Rus tili</SelectItem>
                  <SelectItem value="en">Ingliz tili</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Vaqt zonasi</Label>
              <Select value={settings.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Tashkent">Toshkent (UTC+5)</SelectItem>
                  <SelectItem value="Asia/Samarkand">Samarqand (UTC+5)</SelectItem>
                  <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat">Sana formati</Label>
              <Select value={settings.dateFormat} onValueChange={(value) => handleInputChange("dateFormat", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberFormat">Raqam formati</Label>
              <Select value={settings.numberFormat} onValueChange={(value) => handleInputChange("numberFormat", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1,234.56">1,234.56</SelectItem>
                  <SelectItem value="1.234,56">1.234,56</SelectItem>
                  <SelectItem value="1 234.56">1 234.56</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Biznes sozlamalari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultProfitMargin">Standart foyda marjasi (%)</Label>
              <Input
                id="defaultProfitMargin"
                type="number"
                value={settings.defaultProfitMargin}
                onChange={(e) => handleInputChange("defaultProfitMargin", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultLaborCost">Standart mehnat haqi (so'm/g)</Label>
              <Input
                id="defaultLaborCost"
                type="number"
                value={settings.defaultLaborCost}
                onChange={(e) => handleInputChange("defaultLaborCost", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">Soliq stavkasi (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={settings.taxRate}
                onChange={(e) => handleInputChange("taxRate", Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Tizim sozlamalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bildirishnomalarni yoqish</Label>
              <p className="text-sm text-muted-foreground">Tizim bildirishnomalarini olish</p>
            </div>
            <Switch
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => handleInputChange("enableNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Avtomatik zaxiralash</Label>
              <p className="text-sm text-muted-foreground">Ma'lumotlarni avtomatik zaxiralash</p>
            </div>
            <Switch
              checked={settings.enableAutoBackup}
              onCheckedChange={(checked) => handleInputChange("enableAutoBackup", checked)}
            />
          </div>

          {settings.enableAutoBackup && (
            <div className="space-y-2">
              <Label htmlFor="backupFrequency">Zaxiralash chastotasi</Label>
              <Select
                value={settings.backupFrequency}
                onValueChange={(value) => handleInputChange("backupFrequency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Kunlik</SelectItem>
                  <SelectItem value="weekly">Haftalik</SelectItem>
                  <SelectItem value="monthly">Oylik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center">
          <Save className="mr-2 h-4 w-4" />
          Sozlamalarni saqlash
        </Button>
      </div>
    </div>
  )
}

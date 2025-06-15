"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Calculator, Clock, AlertTriangle, TrendingUp, Package, DollarSign, Settings } from "lucide-react"

export function BusinessSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    // Pricing Rules
    defaultProfitMargin: 25,
    minimumProfitMargin: 10,
    maximumProfitMargin: 100,
    laborCostPerGram: 70000,
    stoneSettingCost: 50000,

    // Inventory Rules
    lowStockThreshold: 5,
    criticalStockThreshold: 2,
    autoReorderEnabled: false,
    reorderQuantity: 10,

    // Sales Rules
    maxDiscountPercent: 15,
    requireApprovalAbove: 10000000, // 10M UZS
    allowNegativeStock: false,

    // Working Hours
    workingHours: {
      start: "09:00",
      end: "18:00",
      breakStart: "13:00",
      breakEnd: "14:00",
    },

    // Business Processes
    requireItemPhotos: true,
    requireCustomerInfo: true,
    enableLayaway: true,
    layawayMinDeposit: 30, // percentage

    // Quality Control
    requireQualityCheck: true,
    qualityCheckSteps: ["Vazn tekshiruvi", "Prob tekshiruvi", "Tosh tekshiruvi", "Ishlov tekshiruvi"],

    // Financial Rules
    dailyCashLimit: 50000000, // 50M UZS
    requireReceiptAbove: 1000000, // 1M UZS
    enableCreditSales: false,
    maxCreditAmount: 5000000, // 5M UZS

    // Workflow Settings
    enableApprovalWorkflow: true,
    approvalLevels: [
      { amount: 5000000, role: "manager" },
      { amount: 20000000, role: "admin" },
      { amount: 50000000, role: "owner" },
    ],
  })

  const handleSave = () => {
    toast({
      title: "Biznes sozlamalari saqlandi",
      description: "Biznes qoidalari va jarayonlar yangilandi",
    })
  }

  const handleInputChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleWorkingHoursChange = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      workingHours: { ...prev.workingHours, [field]: value },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Pricing Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Narxlash qoidalari
          </CardTitle>
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
              <Label htmlFor="minimumProfitMargin">Minimal foyda marjasi (%)</Label>
              <Input
                id="minimumProfitMargin"
                type="number"
                value={settings.minimumProfitMargin}
                onChange={(e) => handleInputChange("minimumProfitMargin", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maximumProfitMargin">Maksimal foyda marjasi (%)</Label>
              <Input
                id="maximumProfitMargin"
                type="number"
                value={settings.maximumProfitMargin}
                onChange={(e) => handleInputChange("maximumProfitMargin", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="laborCostPerGram">Mehnat haqi (so'm/g)</Label>
              <Input
                id="laborCostPerGram"
                type="number"
                value={settings.laborCostPerGram}
                onChange={(e) => handleInputChange("laborCostPerGram", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stoneSettingCost">Tosh o'rnatish narxi (so'm)</Label>
              <Input
                id="stoneSettingCost"
                type="number"
                value={settings.stoneSettingCost}
                onChange={(e) => handleInputChange("stoneSettingCost", Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Ombor boshqaruvi
          </CardTitle>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="criticalStockThreshold">Kritik qoldiq chegarasi</Label>
              <Input
                id="criticalStockThreshold"
                type="number"
                value={settings.criticalStockThreshold}
                onChange={(e) => handleInputChange("criticalStockThreshold", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderQuantity">Qayta buyurtma miqdori</Label>
              <Input
                id="reorderQuantity"
                type="number"
                value={settings.reorderQuantity}
                onChange={(e) => handleInputChange("reorderQuantity", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Avtomatik qayta buyurtma</Label>
                <p className="text-sm text-muted-foreground">Qoldiq kam bo'lganda avtomatik buyurtma berish</p>
              </div>
              <Switch
                checked={settings.autoReorderEnabled}
                onCheckedChange={(checked) => handleInputChange("autoReorderEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Manfiy qoldiqqa ruxsat</Label>
                <p className="text-sm text-muted-foreground">Omborda yo'q mahsulotni sotishga ruxsat berish</p>
              </div>
              <Switch
                checked={settings.allowNegativeStock}
                onCheckedChange={(checked) => handleInputChange("allowNegativeStock", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Sotuv qoidalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxDiscountPercent">Maksimal chegirma (%)</Label>
              <Input
                id="maxDiscountPercent"
                type="number"
                value={settings.maxDiscountPercent}
                onChange={(e) => handleInputChange("maxDiscountPercent", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requireApprovalAbove">Tasdiqlash kerak (so'm)</Label>
              <Input
                id="requireApprovalAbove"
                type="number"
                value={settings.requireApprovalAbove}
                onChange={(e) => handleInputChange("requireApprovalAbove", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="layawayMinDeposit">Minimal oldindan to'lov (%)</Label>
              <Input
                id="layawayMinDeposit"
                type="number"
                value={settings.layawayMinDeposit}
                onChange={(e) => handleInputChange("layawayMinDeposit", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxCreditAmount">Maksimal kredit (so'm)</Label>
              <Input
                id="maxCreditAmount"
                type="number"
                value={settings.maxCreditAmount}
                onChange={(e) => handleInputChange("maxCreditAmount", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Kredit sotuvini yoqish</Label>
                <p className="text-sm text-muted-foreground">Mijozlarga kredit asosida sotuv qilish</p>
              </div>
              <Switch
                checked={settings.enableCreditSales}
                onCheckedChange={(checked) => handleInputChange("enableCreditSales", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bo'lib to'lashni yoqish</Label>
                <p className="text-sm text-muted-foreground">Mahsulotni bo'lib to'lash imkoniyati</p>
              </div>
              <Switch
                checked={settings.enableLayaway}
                onCheckedChange={(checked) => handleInputChange("enableLayaway", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Ish vaqti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workStart">Ish boshlanishi</Label>
              <Input
                id="workStart"
                type="time"
                value={settings.workingHours.start}
                onChange={(e) => handleWorkingHoursChange("start", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workEnd">Ish tugashi</Label>
              <Input
                id="workEnd"
                type="time"
                value={settings.workingHours.end}
                onChange={(e) => handleWorkingHoursChange("end", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="breakStart">Tanaffus boshlanishi</Label>
              <Input
                id="breakStart"
                type="time"
                value={settings.workingHours.breakStart}
                onChange={(e) => handleWorkingHoursChange("breakStart", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="breakEnd">Tanaffus tugashi</Label>
              <Input
                id="breakEnd"
                type="time"
                value={settings.workingHours.breakEnd}
                onChange={(e) => handleWorkingHoursChange("breakEnd", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Sifat nazorati
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sifat tekshiruvini talab qilish</Label>
              <p className="text-sm text-muted-foreground">Har bir mahsulot uchun sifat tekshiruvi</p>
            </div>
            <Switch
              checked={settings.requireQualityCheck}
              onCheckedChange={(checked) => handleInputChange("requireQualityCheck", checked)}
            />
          </div>

          {settings.requireQualityCheck && (
            <div className="space-y-2">
              <Label>Tekshiruv bosqichlari</Label>
              <div className="space-y-2">
                {settings.qualityCheckSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mahsulot rasmini talab qilish</Label>
                <p className="text-sm text-muted-foreground">Har bir mahsulot uchun rasm majburiy</p>
              </div>
              <Switch
                checked={settings.requireItemPhotos}
                onCheckedChange={(checked) => handleInputChange("requireItemPhotos", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mijoz ma'lumotini talab qilish</Label>
                <p className="text-sm text-muted-foreground">Sotuvda mijoz ma'lumotlari majburiy</p>
              </div>
              <Switch
                checked={settings.requireCustomerInfo}
                onCheckedChange={(checked) => handleInputChange("requireCustomerInfo", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Moliyaviy nazorat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dailyCashLimit">Kunlik naqd pul limiti (so'm)</Label>
              <Input
                id="dailyCashLimit"
                type="number"
                value={settings.dailyCashLimit}
                onChange={(e) => handleInputChange("dailyCashLimit", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requireReceiptAbove">Chek talab qilinadigan summa (so'm)</Label>
              <Input
                id="requireReceiptAbove"
                type="number"
                value={settings.requireReceiptAbove}
                onChange={(e) => handleInputChange("requireReceiptAbove", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tasdiqlash jarayonini yoqish</Label>
              <p className="text-sm text-muted-foreground">Katta summalar uchun tasdiqlash jarayoni</p>
            </div>
            <Switch
              checked={settings.enableApprovalWorkflow}
              onCheckedChange={(checked) => handleInputChange("enableApprovalWorkflow", checked)}
            />
          </div>

          {settings.enableApprovalWorkflow && (
            <div className="space-y-2">
              <Label>Tasdiqlash darajalari</Label>
              <div className="space-y-2">
                {settings.approvalLevels.map((level, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{level.amount.toLocaleString()} so'm</span>
                      <p className="text-sm text-muted-foreground">dan yuqori summalar uchun</p>
                    </div>
                    <Badge variant="secondary">{level.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center">
          <Settings className="mr-2 h-4 w-4" />
          Sozlamalarni saqlash
        </Button>
      </div>
    </div>
  )
}

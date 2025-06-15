"use client"

import { cn } from "@/lib/utils"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Palette, Monitor, Sun, Moon, Type, Layout, Eye, Settings } from "lucide-react"

export function AppearanceSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    // Theme Settings
    theme: "system", // light, dark, system
    accentColor: "blue",
    colorScheme: "default",

    // Layout Settings
    sidebarWidth: 280,
    compactMode: false,
    showSidebarLabels: true,
    sidebarPosition: "left",

    // Typography
    fontSize: "medium",
    fontFamily: "system",
    lineHeight: "normal",

    // Display Settings
    density: "comfortable", // compact, comfortable, spacious
    showAnimations: true,
    reducedMotion: false,
    highContrast: false,

    // Dashboard Settings
    showWelcomeMessage: true,
    showQuickActions: true,
    showRecentItems: true,
    dashboardLayout: "grid", // grid, list

    // Table Settings
    tableRowHeight: "medium",
    showTableBorders: true,
    alternateRowColors: true,

    // Advanced Settings
    enableGlassEffect: true,
    showTooltips: true,
    autoHideScrollbars: true,
  })

  const themes = [
    { value: "light", label: "Yorug'", icon: Sun },
    { value: "dark", label: "Qorong'u", icon: Moon },
    { value: "system", label: "Tizim", icon: Monitor },
  ]

  const accentColors = [
    { value: "blue", label: "Ko'k", color: "bg-blue-500" },
    { value: "green", label: "Yashil", color: "bg-green-500" },
    { value: "purple", label: "Binafsha", color: "bg-purple-500" },
    { value: "orange", label: "To'q sariq", color: "bg-orange-500" },
    { value: "red", label: "Qizil", color: "bg-red-500" },
    { value: "gold", label: "Oltin", color: "bg-yellow-500" },
  ]

  const fontSizes = [
    { value: "small", label: "Kichik" },
    { value: "medium", label: "O'rta" },
    { value: "large", label: "Katta" },
    { value: "extra-large", label: "Juda katta" },
  ]

  const densityOptions = [
    { value: "compact", label: "Ixcham" },
    { value: "comfortable", label: "Qulay" },
    { value: "spacious", label: "Keng" },
  ]

  const handleSave = () => {
    toast({
      title: "Ko'rinish sozlamalari saqlandi",
      description: "Interfeys sozlamalari muvaffaqiyatli yangilandi",
    })
  }

  const handleInputChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const previewTheme = (theme: string) => {
    // In a real app, this would apply the theme temporarily
    toast({
      title: "Mavzu ko'rinishi",
      description: `${themes.find((t) => t.value === theme)?.label} mavzusi qo'llanildi`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2 h-5 w-5" />
            Mavzu va ranglar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mavzu</Label>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((theme) => (
                <Button
                  key={theme.value}
                  variant={settings.theme === theme.value ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => {
                    handleInputChange("theme", theme.value)
                    previewTheme(theme.value)
                  }}
                >
                  <theme.icon className="h-6 w-6" />
                  <span className="text-sm">{theme.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Asosiy rang</Label>
            <div className="grid grid-cols-6 gap-3">
              {accentColors.map((color) => (
                <Button
                  key={color.value}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center gap-2"
                  onClick={() => handleInputChange("accentColor", color.value)}
                >
                  <div className={cn("w-6 h-6 rounded-full", color.color)} />
                  <span className="text-xs">{color.label}</span>
                  {settings.accentColor === color.value && (
                    <Badge variant="secondary" className="text-xs">
                      Tanlangan
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Yuqori kontrast</Label>
              <p className="text-sm text-muted-foreground">Ko'rish qiyinchiligi bo'lganlar uchun</p>
            </div>
            <Switch
              checked={settings.highContrast}
              onCheckedChange={(checked) => handleInputChange("highContrast", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Layout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layout className="mr-2 h-5 w-5" />
            Tartib va joylashuv
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Yon panel kengligi: {settings.sidebarWidth}px</Label>
            <Slider
              value={[settings.sidebarWidth]}
              onValueChange={(value) => handleInputChange("sidebarWidth", value[0])}
              max={400}
              min={200}
              step={20}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Ma'lumotlar zichligi</Label>
            <Select value={settings.density} onValueChange={(value) => handleInputChange("density", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {densityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ixcham rejim</Label>
                <p className="text-sm text-muted-foreground">Kichik ekranlar uchun optimallashtirilgan</p>
              </div>
              <Switch
                checked={settings.compactMode}
                onCheckedChange={(checked) => handleInputChange("compactMode", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Yon panel yorliqlarini ko'rsatish</Label>
                <p className="text-sm text-muted-foreground">Navigatsiya elementlari yonida matn</p>
              </div>
              <Switch
                checked={settings.showSidebarLabels}
                onCheckedChange={(checked) => handleInputChange("showSidebarLabels", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Type className="mr-2 h-5 w-5" />
            Tipografiya
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Shrift o'lchami</Label>
            <Select value={settings.fontSize} onValueChange={(value) => handleInputChange("fontSize", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Shrift oilasi</Label>
            <Select value={settings.fontFamily} onValueChange={(value) => handleInputChange("fontFamily", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">Tizim shrifti</SelectItem>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="open-sans">Open Sans</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            Ko'rinish sozlamalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Animatsiyalarni ko'rsatish</Label>
                <p className="text-sm text-muted-foreground">Interfeys animatsiyalari va o'tishlar</p>
              </div>
              <Switch
                checked={settings.showAnimations}
                onCheckedChange={(checked) => handleInputChange("showAnimations", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Harakatni kamaytirish</Label>
                <p className="text-sm text-muted-foreground">Harakat kasalligi bo'lganlar uchun</p>
              </div>
              <Switch
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => handleInputChange("reducedMotion", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Shisha effekti</Label>
                <p className="text-sm text-muted-foreground">Zamonaviy shisha ko'rinishi</p>
              </div>
              <Switch
                checked={settings.enableGlassEffect}
                onCheckedChange={(checked) => handleInputChange("enableGlassEffect", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maslahat oynalarini ko'rsatish</Label>
                <p className="text-sm text-muted-foreground">Elementlar ustida maslahat matnlari</p>
              </div>
              <Switch
                checked={settings.showTooltips}
                onCheckedChange={(checked) => handleInputChange("showTooltips", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="mr-2 h-5 w-5" />
            Bosh sahifa sozlamalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bosh sahifa tartib</Label>
            <Select
              value={settings.dashboardLayout}
              onValueChange={(value) => handleInputChange("dashboardLayout", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">To'r ko'rinishi</SelectItem>
                <SelectItem value="list">Ro'yxat ko'rinishi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Xush kelibsiz xabarini ko'rsatish</Label>
                <p className="text-sm text-muted-foreground">Bosh sahifada xush kelibsiz xabari</p>
              </div>
              <Switch
                checked={settings.showWelcomeMessage}
                onCheckedChange={(checked) => handleInputChange("showWelcomeMessage", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tez harakatlarni ko'rsatish</Label>
                <p className="text-sm text-muted-foreground">Bosh sahifada tez harakatlar paneli</p>
              </div>
              <Switch
                checked={settings.showQuickActions}
                onCheckedChange={(checked) => handleInputChange("showQuickActions", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>So'nggi elementlarni ko'rsatish</Label>
                <p className="text-sm text-muted-foreground">Bosh sahifada so'nggi ko'rilgan elementlar</p>
              </div>
              <Switch
                checked={settings.showRecentItems}
                onCheckedChange={(checked) => handleInputChange("showRecentItems", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layout className="mr-2 h-5 w-5" />
            Jadval sozlamalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Jadval qatori balandligi</Label>
            <Select
              value={settings.tableRowHeight}
              onValueChange={(value) => handleInputChange("tableRowHeight", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Kichik</SelectItem>
                <SelectItem value="medium">O'rta</SelectItem>
                <SelectItem value="large">Katta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Jadval chegaralarini ko'rsatish</Label>
                <p className="text-sm text-muted-foreground">Jadval katakchalarining chegaralari</p>
              </div>
              <Switch
                checked={settings.showTableBorders}
                onCheckedChange={(checked) => handleInputChange("showTableBorders", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Navbatma-navbat qator ranglari</Label>
                <p className="text-sm text-muted-foreground">Jadval qatorlarini rangli ko'rsatish</p>
              </div>
              <Switch
                checked={settings.alternateRowColors}
                onCheckedChange={(checked) => handleInputChange("alternateRowColors", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Avtomatik scroll panellarini yashirish</Label>
                <p className="text-sm text-muted-foreground">Foydalanilmayotganda scroll panellarini yashirish</p>
              </div>
              <Switch
                checked={settings.autoHideScrollbars}
                onCheckedChange={(checked) => handleInputChange("autoHideScrollbars", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            Ko'rinish namunasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Namuna interfeys</h3>
                <Badge variant="secondary">Yangi</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Bu sizning tanlangan sozlamalaringiz qanday ko'rinishini ko'rsatadi
              </p>
              <div className="flex gap-2">
                <Button size="sm">Asosiy tugma</Button>
                <Button size="sm" variant="outline">
                  Ikkinchi tugma
                </Button>
              </div>
            </div>
          </div>
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

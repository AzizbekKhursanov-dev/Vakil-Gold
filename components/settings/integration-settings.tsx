"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import {
  Zap,
  Key,
  Smartphone,
  Mail,
  MessageSquare,
  CreditCard,
  Truck,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Settings,
} from "lucide-react"

export function IntegrationSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    // API Settings
    apiEnabled: true,
    apiKey: "vg_live_sk_1234567890abcdef",
    webhookUrl: "https://api.vakilgold.uz/webhooks",
    rateLimitEnabled: true,
    maxRequestsPerMinute: 100,

    // Payment Integrations
    paymeEnabled: false,
    paymeToken: "",
    clickEnabled: false,
    clickToken: "",
    uzumEnabled: false,
    uzumToken: "",

    // SMS Integration
    smsEnabled: true,
    smsProvider: "eskiz",
    smsApiKey: "",
    smsFrom: "VAKIL GOLD",

    // Email Integration
    emailEnabled: true,
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",

    // Telegram Bot
    telegramEnabled: false,
    telegramBotToken: "",
    telegramChatId: "",

    // Analytics
    googleAnalyticsEnabled: false,
    googleAnalyticsId: "",
    yandexMetricaEnabled: false,
    yandexMetricaId: "",

    // Delivery Services
    yandexDeliveryEnabled: false,
    yandexDeliveryToken: "",

    // Accounting Software
    oneСEnabled: false,
    oneCLogin: "",
    oneCPassword: "",
  })

  const integrations = [
    {
      name: "Payme",
      description: "To'lov tizimi integratsiyasi",
      icon: CreditCard,
      status: settings.paymeEnabled,
      category: "payment",
    },
    {
      name: "Click",
      description: "To'lov tizimi integratsiyasi",
      icon: CreditCard,
      status: settings.clickEnabled,
      category: "payment",
    },
    {
      name: "Uzum",
      description: "To'lov tizimi integratsiyasi",
      icon: CreditCard,
      status: settings.uzumEnabled,
      category: "payment",
    },
    {
      name: "SMS Eskiz",
      description: "SMS xabarlari yuborish",
      icon: Smartphone,
      status: settings.smsEnabled,
      category: "communication",
    },
    {
      name: "Email SMTP",
      description: "Email xabarlari yuborish",
      icon: Mail,
      status: settings.emailEnabled,
      category: "communication",
    },
    {
      name: "Telegram Bot",
      description: "Telegram orqali bildirishnomalar",
      icon: MessageSquare,
      status: settings.telegramEnabled,
      category: "communication",
    },
    {
      name: "Google Analytics",
      description: "Veb-sayt analitikasi",
      icon: BarChart3,
      status: settings.googleAnalyticsEnabled,
      category: "analytics",
    },
    {
      name: "Yandex Metrica",
      description: "Veb-sayt analitikasi",
      icon: BarChart3,
      status: settings.yandexMetricaEnabled,
      category: "analytics",
    },
    {
      name: "Yandex Delivery",
      description: "Yetkazib berish xizmati",
      icon: Truck,
      status: settings.yandexDeliveryEnabled,
      category: "delivery",
    },
    {
      name: "1C Accounting",
      description: "Buxgalteriya dasturi",
      icon: BarChart3,
      status: settings.oneСEnabled,
      category: "accounting",
    },
  ]

  const handleSave = () => {
    toast({
      title: "Integratsiya sozlamalari saqlandi",
      description: "Tashqi xizmatlar sozlamalari yangilandi",
    })
  }

  const handleInputChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const testIntegration = (integration: string) => {
    toast({
      title: "Integratsiya sinovdan o'tkazilmoqda",
      description: `${integration} bilan bog'lanish tekshirilmoqda...`,
    })
  }

  const generateApiKey = () => {
    const newKey = `vg_live_sk_${Math.random().toString(36).substring(2, 15)}`
    handleInputChange("apiKey", newKey)
    toast({
      title: "Yangi API kalit yaratildi",
      description: "Yangi API kalitini xavfsiz joyda saqlang",
    })
  }

  return (
    <div className="space-y-6">
      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="mr-2 h-5 w-5" />
            API sozlamalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>API ni yoqish</Label>
              <p className="text-sm text-muted-foreground">Tashqi ilovalar uchun API dostupligini yoqish</p>
            </div>
            <Switch
              checked={settings.apiEnabled}
              onCheckedChange={(checked) => handleInputChange("apiEnabled", checked)}
            />
          </div>

          {settings.apiEnabled && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div className="space-y-2">
                <Label>API kalit</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.apiKey}
                    onChange={(e) => handleInputChange("apiKey", e.target.value)}
                    type="password"
                    className="font-mono"
                  />
                  <Button onClick={generateApiKey} variant="outline">
                    Yangi yaratish
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={settings.webhookUrl}
                  onChange={(e) => handleInputChange("webhookUrl", e.target.value)}
                  placeholder="https://api.vakilgold.uz/webhooks"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>So'rovlar cheklovi</Label>
                  <Switch
                    checked={settings.rateLimitEnabled}
                    onCheckedChange={(checked) => handleInputChange("rateLimitEnabled", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Daqiqada maksimal so'rovlar</Label>
                  <Input
                    type="number"
                    value={settings.maxRequestsPerMinute}
                    onChange={(e) => handleInputChange("maxRequestsPerMinute", Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            Integratsiyalar ko'rinishi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <div key={integration.name} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <integration.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{integration.name}</h3>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  {integration.status ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={integration.status ? "outline" : "default"} className="flex-1">
                    {integration.status ? "Sozlash" : "Yoqish"}
                  </Button>
                  {integration.status && (
                    <Button size="sm" variant="outline" onClick={() => testIntegration(integration.name)}>
                      Test
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            To'lov tizimlari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payme */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <Label>Payme</Label>
                  <p className="text-sm text-muted-foreground">O'zbekiston to'lov tizimi</p>
                </div>
              </div>
              <Switch
                checked={settings.paymeEnabled}
                onCheckedChange={(checked) => handleInputChange("paymeEnabled", checked)}
              />
            </div>
            {settings.paymeEnabled && (
              <div className="pl-11 space-y-2">
                <Label>Payme Token</Label>
                <Input
                  value={settings.paymeToken}
                  onChange={(e) => handleInputChange("paymeToken", e.target.value)}
                  placeholder="Payme API token"
                  type="password"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Click */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <Label>Click</Label>
                  <p className="text-sm text-muted-foreground">O'zbekiston to'lov tizimi</p>
                </div>
              </div>
              <Switch
                checked={settings.clickEnabled}
                onCheckedChange={(checked) => handleInputChange("clickEnabled", checked)}
              />
            </div>
            {settings.clickEnabled && (
              <div className="pl-11 space-y-2">
                <Label>Click Token</Label>
                <Input
                  value={settings.clickToken}
                  onChange={(e) => handleInputChange("clickToken", e.target.value)}
                  placeholder="Click API token"
                  type="password"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Uzum */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <Label>Uzum</Label>
                  <p className="text-sm text-muted-foreground">Uzum Bank to'lov tizimi</p>
                </div>
              </div>
              <Switch
                checked={settings.uzumEnabled}
                onCheckedChange={(checked) => handleInputChange("uzumEnabled", checked)}
              />
            </div>
            {settings.uzumEnabled && (
              <div className="pl-11 space-y-2">
                <Label>Uzum Token</Label>
                <Input
                  value={settings.uzumToken}
                  onChange={(e) => handleInputChange("uzumToken", e.target.value)}
                  placeholder="Uzum API token"
                  type="password"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Communication Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Aloqa sozlamalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SMS Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <Label>SMS xizmati</Label>
                  <p className="text-sm text-muted-foreground">SMS xabarlari yuborish</p>
                </div>
              </div>
              <Switch
                checked={settings.smsEnabled}
                onCheckedChange={(checked) => handleInputChange("smsEnabled", checked)}
              />
            </div>
            {settings.smsEnabled && (
              <div className="pl-11 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMS API kalit</Label>
                    <Input
                      value={settings.smsApiKey}
                      onChange={(e) => handleInputChange("smsApiKey", e.target.value)}
                      placeholder="Eskiz.uz API kalit"
                      type="password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jo'natuvchi nomi</Label>
                    <Input
                      value={settings.smsFrom}
                      onChange={(e) => handleInputChange("smsFrom", e.target.value)}
                      placeholder="VAKIL GOLD"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Email Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <Label>Email xizmati</Label>
                  <p className="text-sm text-muted-foreground">Email xabarlari yuborish</p>
                </div>
              </div>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={(checked) => handleInputChange("emailEnabled", checked)}
              />
            </div>
            {settings.emailEnabled && (
              <div className="pl-11 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMTP server</Label>
                    <Input
                      value={settings.smtpHost}
                      onChange={(e) => handleInputChange("smtpHost", e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => handleInputChange("smtpPort", Number(e.target.value))}
                      placeholder="587"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Foydalanuvchi nomi</Label>
                    <Input
                      value={settings.smtpUser}
                      onChange={(e) => handleInputChange("smtpUser", e.target.value)}
                      placeholder="email@gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parol</Label>
                    <Input
                      value={settings.smtpPassword}
                      onChange={(e) => handleInputChange("smtpPassword", e.target.value)}
                      type="password"
                      placeholder="App password"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Telegram Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <Label>Telegram Bot</Label>
                  <p className="text-sm text-muted-foreground">Telegram orqali bildirishnomalar</p>
                </div>
              </div>
              <Switch
                checked={settings.telegramEnabled}
                onCheckedChange={(checked) => handleInputChange("telegramEnabled", checked)}
              />
            </div>
            {settings.telegramEnabled && (
              <div className="pl-11 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bot Token</Label>
                    <Input
                      value={settings.telegramBotToken}
                      onChange={(e) => handleInputChange("telegramBotToken", e.target.value)}
                      placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ"
                      type="password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chat ID</Label>
                    <Input
                      value={settings.telegramChatId}
                      onChange={(e) => handleInputChange("telegramChatId", e.target.value)}
                      placeholder="-1001234567890"
                    />
                  </div>
                </div>
              </div>
            )}
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

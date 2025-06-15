import type { Metadata } from "next"
import { AppLayout } from "@/components/layout/app-layout"
import { AdvancedAnalytics } from "@/components/analytics/advanced-analytics"

export const metadata: Metadata = {
  title: "Analitika | Vakil Gold",
  description: "Vakil Gold tizimining kengaytirilgan analitika sahifasi",
}

// Mock data - in real app, this would come from your data layer
const mockData = {
  items: [
    {
      id: "1",
      model: "D MJ",
      category: "Uzuk",
      weight: 3.62,
      lomNarxi: 800000,
      lomNarxiKirim: 850000,
      laborCost: 70000,
      sellingPrice: 3500000,
      status: "available",
      isProvider: false,
      branch: "bulung-ur",
      createdAt: "2024-01-15T00:00:00Z",
    },
    // Add more mock items...
  ],
  branches: [
    { id: "bulung-ur", name: "Bulung'ur" },
    { id: "qizil-tepa", name: "Qizil Tepa" },
    { id: "markaz", name: "Markaz" },
  ],
  transactions: [
    {
      id: "1",
      amount: 3500000,
      date: "2024-01-20T00:00:00Z",
      type: "sale",
    },
    // Add more mock transactions...
  ],
}

export default function AnalyticsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kengaytirilgan Analitika</h1>
          <p className="text-muted-foreground">
            Biznes ko'rsatkichlarini chuqur tahlil qilish va qarorlar qabul qilish uchun ma'lumotlar
          </p>
        </div>
        <AdvancedAnalytics
          items={mockData.items}
          branches={mockData.branches}
          transactions={mockData.transactions}
          timeRange="3months"
        />
      </div>
    </AppLayout>
  )
}

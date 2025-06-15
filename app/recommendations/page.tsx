import type { Metadata } from "next"
import { AppLayout } from "@/components/layout/app-layout"
import { SmartRecommendations } from "@/components/inventory/smart-recommendations"

export const metadata: Metadata = {
  title: "Tavsiyalar | Vakil Gold",
  description: "Vakil Gold tizimining aqlli tavsiyalar sahifasi",
}

export default function RecommendationsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aqlli Tavsiyalar</h1>
          <p className="text-muted-foreground">Tizim tomonidan taqdim etilgan avtomatik tavsiyalar va harakatlar</p>
        </div>
        <SmartRecommendations />
      </div>
    </AppLayout>
  )
}

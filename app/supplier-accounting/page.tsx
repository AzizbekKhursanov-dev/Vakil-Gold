"use client"

import { EnhancedSupplierAccounting } from "@/components/supplier/enhanced-supplier-accounting"

export default function SupplierAccountingPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ta'minotchi hisobi</h1>
          <p className="text-muted-foreground">
            Ta'minotchilar bilan hisob-kitob, tasdiqlash va to'lovlarni boshqarish
          </p>
        </div>
      </div>
      <EnhancedSupplierAccounting />
    </div>
  )
}

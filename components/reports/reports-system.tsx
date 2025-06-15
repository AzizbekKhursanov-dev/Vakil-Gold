"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SalesReport } from "./sales-report"
import { InventoryReport } from "./inventory-report"
import { FinancialSummaryReport } from "./financial-summary-report"
import { ProfitLossReport } from "./profit-loss-report"
import { SupplierReport } from "./supplier-report"
import { BranchPerformanceReport } from "./branch-performance-report"
import { Download, FileSpreadsheet, Printer } from "lucide-react"

interface ReportsSystemProps {
  items?: any[]
  transactions?: any[]
  branches?: any[]
  expenses?: any[]
  suppliers?: any[]
  dateRange?: { from: Date; to: Date }
}

export function ReportsSystem({
  items = [],
  transactions = [],
  branches = [],
  expenses = [],
  suppliers = [],
  dateRange,
}: ReportsSystemProps) {
  const [activeTab, setActiveTab] = useState("sales")

  const handleExport = (reportType: string) => {
    // This would be implemented to export specific report data
    alert(`Export ${reportType} report functionality would be implemented here`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Hisobotlar</h2>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Chop etish
          </Button>
          <Button onClick={() => handleExport(activeTab)} variant="outline" size="sm">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button onClick={() => handleExport(activeTab)} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <TabsTrigger value="sales">Sotuvlar</TabsTrigger>
          <TabsTrigger value="inventory">Inventar</TabsTrigger>
          <TabsTrigger value="financial">Moliyaviy</TabsTrigger>
          <TabsTrigger value="profit">Foyda/Zarar</TabsTrigger>
          <TabsTrigger value="supplier">Ta'minotchilar</TabsTrigger>
          <TabsTrigger value="branch">Filiallar</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sotuvlar hisoboti</CardTitle>
              <CardDescription>Sotuvlar bo'yicha batafsil ma'lumotlar va tahlillar</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesReport transactions={transactions} dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventar hisoboti</CardTitle>
              <CardDescription>Inventar holati va harakatlari bo'yicha ma'lumotlar</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryReport items={items} branches={branches} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moliyaviy hisobot</CardTitle>
              <CardDescription>Daromadlar, xarajatlar va moliyaviy ko'rsatkichlar</CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialSummaryReport transactions={transactions} expenses={expenses} dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Foyda va zarar hisoboti</CardTitle>
              <CardDescription>Foyda va zarar ko'rsatkichlari tahlili</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfitLossReport transactions={transactions} expenses={expenses} items={items} dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supplier" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ta'minotchilar hisoboti</CardTitle>
              <CardDescription>Ta'minotchilar bilan munosabatlar va to'lovlar tahlili</CardDescription>
            </CardHeader>
            <CardContent>
              <SupplierReport suppliers={suppliers} items={items} dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filiallar samaradorligi hisoboti</CardTitle>
              <CardDescription>Filiallar bo'yicha samaradorlik ko'rsatkichlari</CardDescription>
            </CardHeader>
            <CardContent>
              <BranchPerformanceReport
                branches={branches}
                transactions={transactions}
                items={items}
                dateRange={dateRange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

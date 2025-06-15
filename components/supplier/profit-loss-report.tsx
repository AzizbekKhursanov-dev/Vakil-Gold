"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils/currency"
import { TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react"
import type { Item } from "@/lib/types/item"

interface SupplierTransaction {
  id: string
  type: "payment" | "purchase" | "adjustment"
  totalAmount: number
  payedLomNarxi: number
  priceDifference?: number
  supplierName: string
  transactionDate: string
}

interface ProfitLossReportProps {
  transactions?: SupplierTransaction[]
  items?: Item[]
}

export function ProfitLossReport({ transactions = [], items = [] }: ProfitLossReportProps) {
  // Safe array handling
  const safeTransactions = Array.isArray(transactions) ? transactions : []
  const safeItems = Array.isArray(items) ? items : []

  // Calculate profit/loss metrics
  const calculateMetrics = () => {
    const totalPurchaseValue = safeItems.reduce((sum, item) => sum + (item.weight || 0) * (item.lomNarxi || 0), 0)

    const totalPaidValue = safeItems
      .filter((item) => item.paymentStatus === "paid")
      .reduce((sum, item) => sum + (item.weight || 0) * (item.payedLomNarxi || item.lomNarxi || 0), 0)

    const totalPriceDifference = safeItems
      .filter((item) => item.paymentStatus === "paid" && item.priceDifference)
      .reduce((sum, item) => sum + (item.priceDifference || 0) * (item.weight || 0), 0)

    const totalPayments = safeTransactions
      .filter((t) => t.type === "payment")
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0)

    const averageLomPrice =
      safeTransactions.length > 0
        ? safeTransactions.reduce((sum, t) => sum + (t.payedLomNarxi || 0), 0) / safeTransactions.length
        : 0

    const paidItemsCount = safeItems.filter((item) => item.paymentStatus === "paid").length
    const unpaidItemsCount = safeItems.filter((item) => item.paymentStatus === "unpaid").length

    return {
      totalPurchaseValue,
      totalPaidValue,
      totalPriceDifference,
      totalPayments,
      averageLomPrice,
      paidItemsCount,
      unpaidItemsCount,
      totalItems: safeItems.length,
      savingsPercentage: totalPurchaseValue > 0 ? (totalPriceDifference / totalPurchaseValue) * 100 : 0,
    }
  }

  const metrics = calculateMetrics()

  // Calculate supplier-wise breakdown
  const supplierBreakdown = safeItems.reduce(
    (acc, item) => {
      const supplier = item.supplierName || "Noma'lum"
      if (!acc[supplier]) {
        acc[supplier] = {
          totalItems: 0,
          paidItems: 0,
          totalValue: 0,
          paidValue: 0,
          priceDifference: 0,
        }
      }

      acc[supplier].totalItems++
      acc[supplier].totalValue += (item.weight || 0) * (item.lomNarxi || 0)

      if (item.paymentStatus === "paid") {
        acc[supplier].paidItems++
        acc[supplier].paidValue += (item.weight || 0) * (item.payedLomNarxi || item.lomNarxi || 0)
        acc[supplier].priceDifference += (item.priceDifference || 0) * (item.weight || 0)
      }

      return acc
    },
    {} as Record<string, any>,
  )

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami sotib olish</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalPurchaseValue)}</div>
            <p className="text-xs text-muted-foreground">{metrics.totalItems} ta mahsulot</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami to'lovlar</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalPayments)}</div>
            <p className="text-xs text-muted-foreground">{metrics.paidItemsCount} ta to'langan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Narx farqi</CardTitle>
            {metrics.totalPriceDifference >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${metrics.totalPriceDifference >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {metrics.totalPriceDifference >= 0 ? "+" : ""}
              {formatCurrency(metrics.totalPriceDifference)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.savingsPercentage >= 0 ? "Tejamkorlik" : "Qo'shimcha xarajat"}:{" "}
              {Math.abs(metrics.savingsPercentage).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O'rtacha lom narxi</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.averageLomPrice)}/g</div>
            <p className="text-xs text-muted-foreground">{safeTransactions.length} ta tranzaksiya</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>To'lov holati tahlili</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">To'langan mahsulotlar</span>
                <div className="text-right">
                  <div className="font-bold text-green-600">{metrics.paidItemsCount}</div>
                  <div className="text-xs text-muted-foreground">
                    {metrics.totalItems > 0 ? ((metrics.paidItemsCount / metrics.totalItems) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">To'lanmagan mahsulotlar</span>
                <div className="text-right">
                  <div className="font-bold text-red-600">{metrics.unpaidItemsCount}</div>
                  <div className="text-xs text-muted-foreground">
                    {metrics.totalItems > 0 ? ((metrics.unpaidItemsCount / metrics.totalItems) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">To'langan qiymat</span>
                  <span className="font-bold">{formatCurrency(metrics.totalPaidValue)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-medium">To'lanmagan qiymat</span>
                  <span className="font-bold">
                    {formatCurrency(metrics.totalPurchaseValue - metrics.totalPaidValue)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Ta'minotchilar bo'yicha tahlil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(supplierBreakdown)
                .sort(([, a], [, b]) => b.totalValue - a.totalValue)
                .map(([supplier, data]) => (
                  <div key={supplier} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{supplier}</span>
                      <span className="text-sm text-muted-foreground">{data.totalItems} ta</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Jami qiymat:</span>
                        <div className="font-medium">{formatCurrency(data.totalValue)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">To'langan:</span>
                        <div className="font-medium">{formatCurrency(data.paidValue)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">To'lov foizi:</span>
                        <div className="font-medium">
                          {data.totalItems > 0 ? ((data.paidItems / data.totalItems) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Narx farqi:</span>
                        <div className={`font-medium ${data.priceDifference >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {data.priceDifference >= 0 ? "+" : ""}
                          {formatCurrency(data.priceDifference)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Moliyaviy xulosalar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">Umumiy holat</div>
              <div className="text-xs text-blue-600">
                {metrics.totalItems} ta mahsulotdan {metrics.paidItemsCount} tasi to'langan (
                {metrics.totalItems > 0 ? ((metrics.paidItemsCount / metrics.totalItems) * 100).toFixed(1) : 0}%)
              </div>
            </div>

            <div className={`p-4 rounded-lg ${metrics.totalPriceDifference >= 0 ? "bg-green-50" : "bg-red-50"}`}>
              <div
                className={`text-sm font-medium mb-1 ${metrics.totalPriceDifference >= 0 ? "text-green-800" : "text-red-800"}`}
              >
                {metrics.totalPriceDifference >= 0 ? "Tejamkorlik" : "Qo'shimcha xarajat"}
              </div>
              <div className={`text-xs ${metrics.totalPriceDifference >= 0 ? "text-green-600" : "text-red-600"}`}>
                {Math.abs(metrics.savingsPercentage).toFixed(1)}% (
                {formatCurrency(Math.abs(metrics.totalPriceDifference))})
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm font-medium text-orange-800 mb-1">O'rtacha ko'rsatkichlar</div>
              <div className="text-xs text-orange-600">
                Lom narxi: {formatCurrency(metrics.averageLomPrice)}/g
                <br />
                Tranzaksiya:{" "}
                {formatCurrency(
                  metrics.totalPayments / Math.max(safeTransactions.filter((t) => t.type === "payment").length, 1),
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

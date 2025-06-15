"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/currency"
import { Calendar, CreditCard, AlertTriangle } from "lucide-react"
import type { Item } from "@/lib/types/item"

interface ItemPaymentListProps {
  items?: Item[]
  type: "paid" | "unpaid"
  onPayment?: () => void
}

export function ItemPaymentList({ items = [], type, onPayment }: ItemPaymentListProps) {
  // Safety check for items array
  const safeItems = Array.isArray(items) ? items : []

  const getUrgencyLevel = (purchaseDate: string) => {
    if (!purchaseDate) return { level: "low", text: "Oddiy", color: "text-green-600" }

    const daysSince = Math.floor((new Date().getTime() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSince > 30) return { level: "high", text: "Shoshilinch", color: "text-red-600" }
    if (daysSince > 15) return { level: "medium", text: "O'rtacha", color: "text-yellow-600" }
    return { level: "low", text: "Oddiy", color: "text-green-600" }
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      Uzuk: "bg-blue-100 text-blue-800",
      "Sirg'a": "bg-green-100 text-green-800",
      Bilakuzuk: "bg-purple-100 text-purple-800",
      Zanjir: "bg-orange-100 text-orange-800",
      Boshqa: "bg-gray-100 text-gray-800",
    }
    return <Badge className={colors[category as keyof typeof colors] || colors["Boshqa"]}>{category || "Boshqa"}</Badge>
  }

  if (safeItems.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground">
            {type === "paid" ? "To'langan mahsulotlar yo'q" : "To'lanmagan mahsulotlar yo'q"}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {type === "paid" ? (
            <>
              <CreditCard className="h-5 w-5 text-green-600" />
              To'langan mahsulotlar ({safeItems.length})
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-red-600" />
              To'lanmagan mahsulotlar ({safeItems.length})
            </>
          )}
        </CardTitle>
        {type === "unpaid" && onPayment && (
          <Button onClick={onPayment} size="sm">
            To'lov qilish
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Kategoriya</TableHead>
                <TableHead>Ta'minotchi</TableHead>
                <TableHead>Og'irlik</TableHead>
                <TableHead>Lom narxi</TableHead>
                <TableHead>Jami qiymat</TableHead>
                {type === "paid" ? (
                  <>
                    <TableHead>To'langan narx</TableHead>
                    <TableHead>Narx farqi</TableHead>
                    <TableHead>To'lov sanasi</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Sotib olingan</TableHead>
                    <TableHead>Muhimlik</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeItems.map((item) => {
                const urgency = type === "unpaid" ? getUrgencyLevel(item.purchaseDate || item.createdAt) : null
                const totalValue = (item.weight || 0) * (item.lomNarxi || 0)
                const paidValue = item.payedLomNarxi ? (item.weight || 0) * item.payedLomNarxi : totalValue
                const priceDifference = item.priceDifference ? item.priceDifference * (item.weight || 0) : 0

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.model || "—"}</TableCell>
                    <TableCell>{getCategoryBadge(item.category)}</TableCell>
                    <TableCell>{item.supplierName || "—"}</TableCell>
                    <TableCell>{item.weight || 0}g</TableCell>
                    <TableCell>{formatCurrency(item.lomNarxi || 0)}/g</TableCell>
                    <TableCell className="font-medium">{formatCurrency(totalValue)}</TableCell>
                    {type === "paid" ? (
                      <>
                        <TableCell>{formatCurrency(item.payedLomNarxi || item.lomNarxi || 0)}/g</TableCell>
                        <TableCell className={priceDifference >= 0 ? "text-green-600" : "text-red-600"}>
                          {priceDifference >= 0 ? "+" : ""}
                          {formatCurrency(priceDifference)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : "—"}
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {item.purchaseDate
                              ? new Date(item.purchaseDate).toLocaleDateString()
                              : item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString()
                                : "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${urgency?.color}`}>{urgency?.text}</span>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Jami mahsulotlar: </span>
              <span className="font-medium">{safeItems.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Jami og'irlik: </span>
              <span className="font-medium">
                {safeItems.reduce((sum, item) => sum + (item.weight || 0), 0).toFixed(2)}g
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Jami qiymat: </span>
              <span className="font-medium">
                {formatCurrency(safeItems.reduce((sum, item) => sum + (item.weight || 0) * (item.lomNarxi || 0), 0))}
              </span>
            </div>
          </div>

          {type === "paid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2">
              <div>
                <span className="text-muted-foreground">To'langan qiymat: </span>
                <span className="font-medium">
                  {formatCurrency(
                    safeItems.reduce(
                      (sum, item) => sum + (item.weight || 0) * (item.payedLomNarxi || item.lomNarxi || 0),
                      0,
                    ),
                  )}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Jami narx farqi: </span>
                <span
                  className={`font-medium ${safeItems.reduce((sum, item) => sum + (item.priceDifference || 0) * (item.weight || 0), 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(
                    safeItems.reduce((sum, item) => sum + (item.priceDifference || 0) * (item.weight || 0), 0),
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

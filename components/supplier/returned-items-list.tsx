"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/currency"
import { Calendar, RotateCcw, Eye } from "lucide-react"
import type { Item } from "@/lib/types/item"

interface ReturnedItemsListProps {
  items?: Item[]
  onViewDetails?: (item: Item) => void
}

export function ReturnedItemsList({ items = [], onViewDetails }: ReturnedItemsListProps) {
  // Safe array handling
  const safeItems = Array.isArray(items) ? items : []

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

  const getReturnReason = (reason?: string) => {
    const reasons = {
      defective: "Nuqsonli",
      wrong_specification: "Noto'g'ri spetsifikatsiya",
      quality_issue: "Sifat muammosi",
      customer_return: "Mijoz qaytargan",
      other: "Boshqa",
    }
    return reasons[reason as keyof typeof reasons] || reason || "Belgilanmagan"
  }

  if (safeItems.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground">Ta'minotchiga qaytarilgan mahsulotlar yo'q</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-orange-600" />
          Ta'minotchiga qaytarilgan mahsulotlar ({safeItems.length})
        </CardTitle>
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
                <TableHead>Qaytarish sanasi</TableHead>
                <TableHead>Sabab</TableHead>
                <TableHead>Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeItems.map((item) => {
                const totalValue = (item.weight || 0) * (item.lomNarxi || 0)

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.model || "—"}</TableCell>
                    <TableCell>{getCategoryBadge(item.category)}</TableCell>
                    <TableCell>{item.supplierName || "—"}</TableCell>
                    <TableCell>{item.weight || 0}g</TableCell>
                    <TableCell>{formatCurrency(item.lomNarxi || 0)}/g</TableCell>
                    <TableCell className="font-medium">{formatCurrency(totalValue)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {item.returnToSupplierDate ? new Date(item.returnToSupplierDate).toLocaleDateString() : "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-orange-600">
                        {getReturnReason(item.returnToSupplierReason)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {onViewDetails && (
                        <Button variant="ghost" size="sm" onClick={() => onViewDetails(item)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Jami qaytarilgan: </span>
              <span className="font-medium">{safeItems.length} ta</span>
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
            <div>
              <span className="text-muted-foreground">Eng ko'p sabab: </span>
              <span className="font-medium">
                {(() => {
                  const reasons = safeItems.reduce(
                    (acc, item) => {
                      const reason = getReturnReason(item.returnToSupplierReason)
                      acc[reason] = (acc[reason] || 0) + 1
                      return acc
                    },
                    {} as Record<string, number>,
                  )

                  const mostCommon = Object.entries(reasons).sort(([, a], [, b]) => b - a)[0]
                  return mostCommon ? mostCommon[0] : "—"
                })()}
              </span>
            </div>
          </div>

          {/* Return reasons breakdown */}
          <div className="mt-3 pt-3 border-t border-orange-200">
            <div className="text-sm font-medium mb-2">Qaytarish sabablari:</div>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const reasons = safeItems.reduce(
                  (acc, item) => {
                    const reason = getReturnReason(item.returnToSupplierReason)
                    acc[reason] = (acc[reason] || 0) + 1
                    return acc
                  },
                  {} as Record<string, number>,
                )

                return Object.entries(reasons).map(([reason, count]) => (
                  <Badge key={reason} variant="outline" className="text-orange-600">
                    {reason}: {count}
                  </Badge>
                ))
              })()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils/currency"
import { Search, ArrowUpDown } from "lucide-react"
import type { Item } from "@/lib/types/item"

interface ProfitItemsListProps {
  items: Item[]
}

type SortField = "model" | "category" | "supposedProfit" | "actualProfit" | "profitMargin" | "paymentDate"
type SortDirection = "asc" | "desc"

export function ProfitItemsList({ items }: ProfitItemsListProps) {
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("actualProfit")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [statusFilter, setStatusFilter] = useState("all")

  // Calculate profit for each item
  const itemsWithProfit = items.map((item) => {
    const supposedProfitPerGram = item.lomNarxiKirim - item.lomNarxi
    const supposedProfit = supposedProfitPerGram * item.weight

    const actualCost = item.weight * (item.payedLomNarxi || item.lomNarxi) + item.laborCost * item.weight
    const actualRevenue = item.status === "sold" ? item.sellingPrice * item.weight : 0
    const actualProfit = actualRevenue - actualCost

    const profitMargin = actualRevenue > 0 ? (actualProfit / actualRevenue) * 100 : 0

    return {
      ...item,
      supposedProfit,
      actualProfit,
      actualRevenue,
      actualCost,
      profitMargin,
    }
  })

  // Filter items
  const filteredItems = itemsWithProfit.filter((item) => {
    if (search) {
      const searchTerm = search.toLowerCase()
      if (
        !item.model.toLowerCase().includes(searchTerm) &&
        !item.category.toLowerCase().includes(searchTerm) &&
        !item.supplierName?.toLowerCase().includes(searchTerm)
      ) {
        return false
      }
    }

    if (statusFilter !== "all" && item.status !== statusFilter) return false

    return true
  })

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]

    if (sortField === "paymentDate") {
      aValue = a.paymentDate ? new Date(a.paymentDate).getTime() : 0
      bValue = b.paymentDate ? new Date(b.paymentDate).getTime() : 0
    }

    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sold":
        return <Badge className="bg-green-100 text-green-800">Sotilgan</Badge>
      case "available":
        return <Badge className="bg-blue-100 text-blue-800">Mavjud</Badge>
      case "transferred":
        return <Badge className="bg-purple-100 text-purple-800">O'tkazilgan</Badge>
      case "returned":
        return <Badge className="bg-red-100 text-red-800">Qaytarilgan</Badge>
      case "reserved":
        return <Badge className="bg-yellow-100 text-yellow-800">Band qilingan</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">To'langan</Badge>
      case "unpaid":
        return <Badge className="bg-red-100 text-red-800">To'lanmagan</Badge>
      case "partially_paid":
        return <Badge className="bg-yellow-100 text-yellow-800">Qisman</Badge>
      default:
        return <Badge variant="secondary">Noma'lum</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mahsulotlar bo'yicha foyda tahlili</CardTitle>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Model, kategoriya yoki ta'minotchi bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="sold">Sotilgan</SelectItem>
              <SelectItem value="available">Mavjud</SelectItem>
              <SelectItem value="transferred">O'tkazilgan</SelectItem>
              <SelectItem value="returned">Qaytarilgan</SelectItem>
              <SelectItem value="reserved">Band qilingan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("model")} className="h-auto p-0 font-medium">
                    Model
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("category")} className="h-auto p-0 font-medium">
                    Kategoriya
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Og'irlik</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>To'lov</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("supposedProfit")}
                    className="h-auto p-0 font-medium"
                  >
                    Nazariy foyda
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("actualProfit")} className="h-auto p-0 font-medium">
                    Haqiqiy foyda
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("profitMargin")} className="h-auto p-0 font-medium">
                    Foyda marjasi
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("paymentDate")} className="h-auto p-0 font-medium">
                    To'lov sanasi
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.model}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.weight}g</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(item.paymentStatus)}</TableCell>
                  <TableCell className="text-blue-600 font-medium">{formatCurrency(item.supposedProfit)}</TableCell>
                  <TableCell className={`font-medium ${item.actualProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(item.actualProfit)}
                  </TableCell>
                  <TableCell className={`font-medium ${item.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {item.actualRevenue > 0 ? `${item.profitMargin.toFixed(1)}%` : "—"}
                  </TableCell>
                  <TableCell>{item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {sortedItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Filtr shartlariga mos mahsulotlar topilmadi</div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Jami mahsulotlar: </span>
              <span className="font-medium">{sortedItems.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Jami nazariy foyda: </span>
              <span className="font-medium text-blue-600">
                {formatCurrency(sortedItems.reduce((sum, item) => sum + item.supposedProfit, 0))}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Jami haqiqiy foyda: </span>
              <span className="font-medium text-green-600">
                {formatCurrency(sortedItems.reduce((sum, item) => sum + item.actualProfit, 0))}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">O'rtacha margin: </span>
              <span className="font-medium">
                {sortedItems.filter((item) => item.actualRevenue > 0).length > 0
                  ? (
                      sortedItems
                        .filter((item) => item.actualRevenue > 0)
                        .reduce((sum, item) => sum + item.profitMargin, 0) /
                      sortedItems.filter((item) => item.actualRevenue > 0).length
                    ).toFixed(1)
                  : "0"}
                %
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

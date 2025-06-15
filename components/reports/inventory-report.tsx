"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils/currency"
import { Chart } from "@/components/ui/chart"
import { Search, Download, Filter } from "lucide-react"

interface InventoryReportProps {
  items?: any[]
  branches?: any[]
  dateRange?: { from: Date; to: Date }
  onExport?: () => void
}

export function InventoryReport({ items = [], branches = [], dateRange, onExport }: InventoryReportProps) {
  const [filter, setFilter] = useState("all")
  const [branchFilter, setBranchFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredItems, setFilteredItems] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [branchData, setBranchData] = useState<any[]>([])

  useEffect(() => {
    // Filter items
    let filtered = [...items]

    // Apply category filter
    if (filter !== "all") {
      filtered = filtered.filter((item) => item.category === filter)
    }

    // Apply branch filter
    if (branchFilter !== "all") {
      filtered = filtered.filter((item) => item.branch === branchFilter || item.branchId === branchFilter)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.model?.toLowerCase().includes(term) ||
          item.category?.toLowerCase().includes(term) ||
          item.id?.toLowerCase().includes(term),
      )
    }

    setFilteredItems(filtered)

    // Calculate inventory by category
    const categoryInventory: Record<string, { count: number; value: number }> = {}
    filtered.forEach((item) => {
      if (item.category) {
        if (!categoryInventory[item.category]) {
          categoryInventory[item.category] = { count: 0, value: 0 }
        }
        categoryInventory[item.category].count += 1
        categoryInventory[item.category].value += item.sellingPrice || 0
      }
    })

    const categoryChartData = Object.entries(categoryInventory).map(([name, data]) => ({
      name,
      count: data.count,
      value: data.value,
    }))
    setCategoryData(categoryChartData)

    // Calculate inventory by branch
    const branchInventory: Record<string, { count: number; value: number }> = {}
    filtered.forEach((item) => {
      const branchId = item.branch || item.branchId
      if (branchId) {
        if (!branchInventory[branchId]) {
          branchInventory[branchId] = { count: 0, value: 0 }
        }
        branchInventory[branchId].count += 1
        branchInventory[branchId].value += item.sellingPrice || 0
      }
    })

    const branchChartData = Object.entries(branchInventory).map(([branchId, data]) => {
      const branch = branches.find((b) => b.id === branchId)
      return {
        name: branch?.name || branchId,
        count: data.count,
        value: data.value,
      }
    })
    setBranchData(branchChartData)
  }, [items, branches, filter, branchFilter, searchTerm])

  // Get unique categories for filter
  const categories = ["all", ...new Set(items.map((item) => item.category))].filter(Boolean)

  // Calculate total inventory value
  const totalValue = filteredItems.reduce((sum, item) => sum + (item.sellingPrice || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Qidirish..."
              className="pl-8 w-full sm:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Kategoriya" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "Barcha kategoriyalar" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha filiallar</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onExport} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Eksport
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Kategoriya bo'yicha inventar</h3>
            <div className="h-[300px]">
              {categoryData.length > 0 ? (
                <Chart data={categoryData} type="bar" xKey="name" dataKey="count" colors={["#0088FE"]} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Ma'lumot mavjud emas
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Filial bo'yicha inventar</h3>
            <div className="h-[300px]">
              {branchData.length > 0 ? (
                <Chart data={branchData} type="bar" xKey="name" dataKey="count" colors={["#00C49F"]} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Ma'lumot mavjud emas
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Inventar ro'yxati</h3>
            <div className="text-sm text-muted-foreground">
              Jami qiymati: <span className="font-medium">{formatCurrency(totalValue)}</span>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Kategoriya</TableHead>
                  <TableHead>Filial</TableHead>
                  <TableHead>Holati</TableHead>
                  <TableHead className="text-right">Narxi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const branch = branches.find((b) => b.id === (item.branch || item.branchId))
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.model || "Noma'lum"}</TableCell>
                        <TableCell>{item.category || "Noma'lum"}</TableCell>
                        <TableCell>{branch?.name || "Noma'lum"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              item.status === "available"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : item.status === "sold"
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                            }
                          >
                            {item.status === "available"
                              ? "Mavjud"
                              : item.status === "sold"
                                ? "Sotilgan"
                                : item.status || "Noma'lum"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.sellingPrice)}</TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Ma'lumot topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

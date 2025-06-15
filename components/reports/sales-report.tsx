"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/currency"
import { Chart } from "@/components/ui/chart"
import { Search, Download, Filter } from "lucide-react"
import { format } from "date-fns"

interface SalesReportProps {
  transactions?: any[]
  dateRange?: { from: Date; to: Date }
  selectedBranch?: string
  onExport?: () => void
}

export function SalesReport({ transactions = [], dateRange, selectedBranch, onExport }: SalesReportProps) {
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [salesByCategory, setSalesByCategory] = useState<any[]>([])
  const [salesByDate, setSalesByDate] = useState<any[]>([])

  useEffect(() => {
    // Filter transactions
    let filtered = transactions.filter((t) => t.type === "sale")

    // Apply date range filter
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.createdAt)
        return transactionDate >= dateRange.from && transactionDate <= dateRange.to
      })
    }

    // Apply branch filter
    if (selectedBranch && selectedBranch !== "all") {
      filtered = filtered.filter((t) => t.branchId === selectedBranch)
    }

    // Apply category filter
    if (filter !== "all") {
      filtered = filtered.filter((t) => {
        if (t.items && t.items.length > 0) {
          return t.items.some((item: any) => item.category === filter)
        }
        return false
      })
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.customerName?.toLowerCase().includes(term) ||
          t.id?.toLowerCase().includes(term) ||
          t.items?.some((item: any) => item.model?.toLowerCase().includes(term)),
      )
    }

    setFilteredTransactions(filtered)

    // Calculate sales by category
    const categoryData: Record<string, number> = {}
    filtered.forEach((t) => {
      if (t.items && t.items.length > 0) {
        t.items.forEach((item: any) => {
          if (item.category) {
            categoryData[item.category] = (categoryData[item.category] || 0) + (item.sellingPrice || 0)
          }
        })
      }
    })

    const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }))
    setSalesByCategory(categoryChartData)

    // Calculate sales by date
    const dateData: Record<string, number> = {}
    filtered.forEach((t) => {
      if (t.createdAt) {
        const date = format(new Date(t.createdAt), "yyyy-MM-dd")
        dateData[date] = (dateData[date] || 0) + (t.amount || 0)
      }
    })

    const dateChartData = Object.entries(dateData)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))
    setSalesByDate(dateChartData)
  }, [transactions, dateRange, selectedBranch, filter, searchTerm])

  // Get unique categories for filter
  const categories = [
    "all",
    ...new Set(transactions.flatMap((t) => t.items?.map((item: any) => item.category) || [])),
  ].filter(Boolean)

  // Calculate total sales
  const totalSales = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)

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
        </div>

        <Button onClick={onExport} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Eksport
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Kategoriya bo'yicha sotuvlar</h3>
            <div className="h-[300px]">
              {salesByCategory.length > 0 ? (
                <Chart
                  data={salesByCategory}
                  type="pie"
                  nameKey="name"
                  valueKey="value"
                  colors={["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]}
                />
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
            <h3 className="text-lg font-medium mb-4">Vaqt bo'yicha sotuvlar</h3>
            <div className="h-[300px]">
              {salesByDate.length > 0 ? (
                <Chart data={salesByDate} type="line" xKey="date" dataKey="value" colors={["#0088FE"]} />
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
            <h3 className="text-lg font-medium">Sotuvlar ro'yxati</h3>
            <div className="text-sm text-muted-foreground">
              Jami: <span className="font-medium">{formatCurrency(totalSales)}</span>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Mahsulotlar</TableHead>
                  <TableHead>Filial</TableHead>
                  <TableHead className="text-right">Summa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {transaction.createdAt ? format(new Date(transaction.createdAt), "dd.MM.yyyy") : "Noma'lum"}
                      </TableCell>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.customerName || "Noma'lum"}</TableCell>
                      <TableCell>
                        {transaction.items?.length ? `${transaction.items.length} ta mahsulot` : "Noma'lum"}
                      </TableCell>
                      <TableCell>{transaction.branchName || "Noma'lum"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(transaction.amount)}</TableCell>
                    </TableRow>
                  ))
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

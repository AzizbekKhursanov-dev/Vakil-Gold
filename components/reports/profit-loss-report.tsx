"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/currency"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns"
import { Download, TrendingUp, ArrowUp, ArrowDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import * as XLSX from "xlsx"
import type { DateRange } from "react-day-picker"

interface ProfitLossReportProps {
  dateRange: DateRange | undefined
  selectedBranch: string
  onExport: () => void
}

export function ProfitLossReport({ dateRange, selectedBranch, onExport }: ProfitLossReportProps) {
  const [loading, setLoading] = useState(true)
  const [profitData, setProfitData] = useState<any[]>([])
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalCost: 0,
    totalExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange?.from || !dateRange?.to) return

      setLoading(true)
      try {
        // Fetch sold items for revenue
        let itemsQuery = query(
          collection(db, "items"),
          where("status", "==", "sold"),
          where("createdAt", ">=", dateRange.from.toISOString()),
          where("createdAt", "<=", dateRange.to.toISOString()),
        )

        if (selectedBranch !== "all") {
          itemsQuery = query(
            collection(db, "items"),
            where("status", "==", "sold"),
            where("branchId", "==", selectedBranch),
            where("createdAt", ">=", dateRange.from.toISOString()),
            where("createdAt", "<=", dateRange.to.toISOString()),
          )
        }

        const itemsSnapshot = await getDocs(itemsQuery)
        const soldItems = itemsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Fetch expenses
        let expensesQuery = query(
          collection(db, "expenses"),
          where("date", ">=", format(dateRange.from, "yyyy-MM-dd")),
          where("date", "<=", format(dateRange.to, "yyyy-MM-dd")),
        )

        if (selectedBranch !== "all") {
          expensesQuery = query(
            collection(db, "expenses"),
            where("branchId", "==", selectedBranch),
            where("date", ">=", format(dateRange.from, "yyyy-MM-dd")),
            where("date", "<=", format(dateRange.to, "yyyy-MM-dd")),
          )
        }

        const expensesSnapshot = await getDocs(expensesQuery)
        const expenses = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Calculate monthly data
        const today = new Date()
        const sixMonthsAgo = subMonths(today, 5)

        const months = eachMonthOfInterval({
          start: startOfMonth(sixMonthsAgo),
          end: endOfMonth(today),
        })

        const monthlyData = months.map((month) => {
          // Filter items sold in this month
          const monthItems = soldItems.filter((item) => {
            const itemDate = new Date(item.createdAt)
            return itemDate.getMonth() === month.getMonth() && itemDate.getFullYear() === month.getFullYear()
          })

          // Filter expenses in this month
          const monthExpenses = expenses.filter((expense) => {
            const expenseDate = new Date(expense.date)
            return expenseDate.getMonth() === month.getMonth() && expenseDate.getFullYear() === month.getFullYear()
          })

          // Calculate revenue
          const revenue = monthItems.reduce((sum, item) => sum + (item.sellingPrice || 0), 0)

          // Calculate cost of goods sold
          const cogs = monthItems.reduce((sum, item) => {
            const materialCost = item.weight * item.lomNarxi
            const laborCost = item.weight * item.laborCost
            return sum + materialCost + laborCost
          }, 0)

          // Calculate expenses
          const expenseTotal = monthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)

          // Calculate profits
          const grossProfit = revenue - cogs
          const netProfit = grossProfit - expenseTotal
          const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0

          return {
            name: format(month, "MMM yyyy"),
            revenue,
            cogs,
            expenses: expenseTotal,
            grossProfit,
            netProfit,
            profitMargin: Number.parseFloat(profitMargin.toFixed(2)),
          }
        })

        setProfitData(monthlyData)

        // Calculate summary
        const totalRevenue = soldItems.reduce((sum, item) => sum + (item.sellingPrice || 0), 0)
        const totalCost = soldItems.reduce((sum, item) => {
          const materialCost = item.weight * item.lomNarxi
          const laborCost = item.weight * item.laborCost
          return sum + materialCost + laborCost
        }, 0)
        const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
        const grossProfit = totalRevenue - totalCost
        const netProfit = grossProfit - totalExpenses
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

        setSummary({
          totalRevenue,
          totalCost,
          totalExpenses,
          grossProfit,
          netProfit,
          profitMargin,
        })
      } catch (error) {
        console.error("Error fetching profit/loss data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, selectedBranch])

  const exportToExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new()

      // Summary sheet
      const summaryData = [
        { Metric: "Jami tushum", Value: summary.totalRevenue },
        { Metric: "Mahsulot tannarxi", Value: summary.totalCost },
        { Metric: "Yalpi foyda", Value: summary.grossProfit },
        { Metric: "Jami xarajatlar", Value: summary.totalExpenses },
        { Metric: "Sof foyda", Value: summary.netProfit },
        { Metric: "Rentabellik", Value: `${summary.profitMargin.toFixed(2)}%` },
      ]

      const summaryWs = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summaryWs, "Umumiy")

      // Monthly data sheet
      const monthlyWs = XLSX.utils.json_to_sheet(profitData)
      XLSX.utils.book_append_sheet(wb, monthlyWs, "Oylik ma'lumotlar")

      // Generate file name with date range
      let fileName = "Foyda_zarar_hisoboti"
      if (dateRange?.from) {
        fileName += `_${format(dateRange.from, "yyyy-MM-dd")}`
        if (dateRange.to && dateRange.to !== dateRange.from) {
          fileName += `_${format(dateRange.to, "yyyy-MM-dd")}`
        }
      }
      fileName += ".xlsx"

      // Export file
      XLSX.writeFile(wb, fileName)

      // Call the onExport callback
      onExport()
    } catch (error) {
      console.error("Error exporting to Excel:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Foyda va zarar hisoboti</h2>
        <Button onClick={exportToExcel} disabled={loading} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          {loading ? "Yuklanmoqda..." : "Excel formatida yuklash"}
        </Button>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-20 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami tushum</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Sotilgan mahsulotlardan tushgan pul</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mahsulot tannarxi</CardTitle>
              <ArrowDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalCost)}</div>
              <p className="text-xs text-muted-foreground">Material va ishlab chiqarish xarajatlari</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yalpi foyda</CardTitle>
              <ArrowUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.grossProfit)}</div>
              <p className="text-xs text-muted-foreground">Tushum - Mahsulot tannarxi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami xarajatlar</CardTitle>
              <ArrowDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">Operatsion xarajatlar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sof foyda</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(summary.netProfit)}
              </div>
              <p className="text-xs text-muted-foreground">Yalpi foyda - Xarajatlar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rentabellik</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.profitMargin >= 0 ? "text-purple-600" : "text-red-600"}`}>
                {summary.profitMargin.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">Sof foyda / Tushum</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profit/Loss Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Foyda va zarar dinamikasi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(value) => formatCurrency(value).replace(/[^\d.,]/g, "")} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Tushum" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="grossProfit" name="Yalpi foyda" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="netProfit" name="Sof foyda" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue vs Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tushum va xarajatlar taqqoslash</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(value) => formatCurrency(value).replace(/[^\d.,]/g, "")} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="revenue" name="Tushum" fill="#10b981" />
                  <Bar dataKey="cogs" name="Mahsulot tannarxi" fill="#f59e0b" />
                  <Bar dataKey="expenses" name="Xarajatlar" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Oylik foyda va zarar ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oy</TableHead>
                    <TableHead className="text-right">Tushum</TableHead>
                    <TableHead className="text-right">Mahsulot tannarxi</TableHead>
                    <TableHead className="text-right">Yalpi foyda</TableHead>
                    <TableHead className="text-right">Xarajatlar</TableHead>
                    <TableHead className="text-right">Sof foyda</TableHead>
                    <TableHead className="text-right">Rentabellik</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitData.map((month, index) => (
                    <TableRow key={index}>
                      <TableCell>{month.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(month.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(month.cogs)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(month.grossProfit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(month.expenses)}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${month.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCurrency(month.netProfit)}
                      </TableCell>
                      <TableCell
                        className={`text-right ${month.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {month.profitMargin.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

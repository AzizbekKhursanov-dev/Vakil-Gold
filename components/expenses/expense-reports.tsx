"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/currency"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns"
import { Download, TrendingDown, PieChartIcon, BarChartIcon } from "lucide-react"
import * as XLSX from "xlsx"
import type { DateRange } from "react-day-picker"

interface ExpenseReportsProps {
  expenses: any[]
  dateRange: DateRange | undefined
  selectedBranch: string
}

export function ExpenseReports({ expenses, dateRange, selectedBranch }: ExpenseReportsProps) {
  const [activeTab, setActiveTab] = useState("monthly")
  const [loading, setLoading] = useState(false)

  // Generate monthly data for the last 6 months
  const generateMonthlyData = () => {
    const today = new Date()
    const sixMonthsAgo = subMonths(today, 5)

    const months = eachMonthOfInterval({
      start: startOfMonth(sixMonthsAgo),
      end: endOfMonth(today),
    })

    return months.map((month) => {
      const monthExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === month.getMonth() && expenseDate.getFullYear() === month.getFullYear()
      })

      const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)

      return {
        name: format(month, "MMM yyyy"),
        amount: total,
        count: monthExpenses.length,
      }
    })
  }

  // Generate category data
  const generateCategoryData = () => {
    const categoryMap = expenses.reduce((acc, expense) => {
      const category = expense.category || "Boshqa"
      if (!acc[category]) {
        acc[category] = {
          name: category,
          amount: 0,
          count: 0,
        }
      }
      acc[category].amount += expense.amount
      acc[category].count += 1
      return acc
    }, {})

    return Object.values(categoryMap)
  }

  // Generate branch data
  const generateBranchData = () => {
    const branchMap = expenses.reduce((acc, expense) => {
      const branch = expense.branchName || "Markaz"
      if (!acc[branch]) {
        acc[branch] = {
          name: branch,
          amount: 0,
          count: 0,
        }
      }
      acc[branch].amount += expense.amount
      acc[branch].count += 1
      return acc
    }, {})

    return Object.values(branchMap)
  }

  // Generate status data
  const generateStatusData = () => {
    const statusMap = expenses.reduce((acc, expense) => {
      const status = expense.status || "pending"
      if (!acc[status]) {
        acc[status] = {
          name: getStatusName(status),
          amount: 0,
          count: 0,
          status: status,
        }
      }
      acc[status].amount += expense.amount
      acc[status].count += 1
      return acc
    }, {})

    return Object.values(statusMap)
  }

  const getStatusName = (status: string) => {
    switch (status) {
      case "pending":
        return "Kutilayotgan"
      case "approved":
        return "Tasdiqlangan"
      case "paid":
        return "To'langan"
      case "rejected":
        return "Rad etilgan"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59e0b"
      case "approved":
        return "#3b82f6"
      case "paid":
        return "#10b981"
      case "rejected":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#8dd1e1",
    "#a4de6c",
    "#d0ed57",
  ]

  const monthlyData = generateMonthlyData()
  const categoryData = generateCategoryData()
  const branchData = generateBranchData()
  const statusData = generateStatusData()

  const exportToExcel = () => {
    setLoading(true)

    try {
      // Create workbook
      const wb = XLSX.utils.book_new()

      // Format expenses for export
      const formattedExpenses = expenses.map((expense) => ({
        Sana: expense.date,
        Kategoriya: expense.category,
        Tavsif: expense.description,
        Filial: expense.branchName || "Markaz",
        Summa: expense.amount,
        "To'lov usuli": expense.paymentMethod,
        Holat: getStatusName(expense.status),
        "Yaratilgan sana": expense.createdAt,
      }))

      // Create worksheet from data
      const ws = XLSX.utils.json_to_sheet(formattedExpenses)

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Xarajatlar")

      // Generate file name with date range
      let fileName = "Xarajatlar_hisoboti"
      if (dateRange?.from) {
        fileName += `_${format(dateRange.from, "yyyy-MM-dd")}`
        if (dateRange.to && dateRange.to !== dateRange.from) {
          fileName += `_${format(dateRange.to, "yyyy-MM-dd")}`
        }
      }
      fileName += ".xlsx"

      // Export file
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error("Error exporting to Excel:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Xarajatlar hisoboti</h2>
        <Button onClick={exportToExcel} disabled={loading} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          {loading ? "Yuklanmoqda..." : "Excel formatida yuklash"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <BarChartIcon className="h-4 w-4" />
            <span className="hidden md:inline">Oylik tahlil</span>
            <span className="md:hidden">Oylik</span>
          </TabsTrigger>
          <TabsTrigger value="category" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden md:inline">Kategoriyalar</span>
            <span className="md:hidden">Kat.</span>
          </TabsTrigger>
          <TabsTrigger value="branch" className="flex items-center gap-2">
            <BarChartIcon className="h-4 w-4" />
            <span className="hidden md:inline">Filiallar</span>
            <span className="md:hidden">Filial</span>
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden md:inline">Holat bo'yicha</span>
            <span className="md:hidden">Holat</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Oylik xarajatlar dinamikasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                    <YAxis tickFormatter={(value) => formatCurrency(value).replace(/[^\d.,]/g, "")} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="amount" name="Xarajat summasi" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Oylik xarajatlar jadvali</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oy</TableHead>
                    <TableHead>Xarajatlar soni</TableHead>
                    <TableHead className="text-right">Jami summa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((month, index) => (
                    <TableRow key={index}>
                      <TableCell>{month.name}</TableCell>
                      <TableCell>{month.count}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(month.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Kategoriyalar bo'yicha xarajatlar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kategoriyalar bo'yicha tahlil</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategoriya</TableHead>
                      <TableHead>Xarajatlar soni</TableHead>
                      <TableHead className="text-right">Jami summa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryData.map((category, index) => (
                      <TableRow key={index}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{category.count}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(category.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filiallar bo'yicha xarajatlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value).replace(/[^\d.,]/g, "")} />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="amount" name="Xarajat summasi" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filiallar bo'yicha tahlil</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filial</TableHead>
                    <TableHead>Xarajatlar soni</TableHead>
                    <TableHead className="text-right">Jami summa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchData.map((branch, index) => (
                    <TableRow key={index}>
                      <TableCell>{branch.name}</TableCell>
                      <TableCell>{branch.count}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(branch.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Holat bo'yicha xarajatlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {statusData.map((entry) => (
                        <Cell key={`cell-${entry.status}`} fill={getStatusColor(entry.status)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Holat bo'yicha tahlil</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holat</TableHead>
                    <TableHead>Xarajatlar soni</TableHead>
                    <TableHead className="text-right">Jami summa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statusData.map((status, index) => (
                    <TableRow key={index}>
                      <TableCell>{status.name}</TableCell>
                      <TableCell>{status.count}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(status.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

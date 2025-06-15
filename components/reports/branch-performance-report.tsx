"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils/currency"
import { FileSpreadsheet, TrendingUp, Users, DollarSign } from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import type { DateRange } from "react-day-picker"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface BranchPerformanceReportProps {
  dateRange: DateRange | undefined
  onExport: () => void
}

export function BranchPerformanceReport({ dateRange, onExport }: BranchPerformanceReportProps) {
  const [loading, setLoading] = useState(true)
  const [branchData, setBranchData] = useState<any[]>([])
  const [summary, setSummary] = useState({
    totalBranches: 0,
    totalRevenue: 0,
    totalProfit: 0,
    averagePerformance: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange?.from || !dateRange?.to) return

      setLoading(true)
      try {
        // Fetch branches
        const branchesSnapshot = await getDocs(collection(db, "branches"))
        const branches = branchesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Fetch items for each branch
        const itemsSnapshot = await getDocs(
          query(
            collection(db, "items"),
            where("createdAt", ">=", dateRange.from.toISOString()),
            where("createdAt", "<=", dateRange.to.toISOString()),
          ),
        )
        const items = itemsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Fetch expenses for each branch
        const expensesSnapshot = await getDocs(
          query(
            collection(db, "expenses"),
            where("date", ">=", dateRange.from.toISOString().split("T")[0]),
            where("date", "<=", dateRange.to.toISOString().split("T")[0]),
          ),
        )
        const expenses = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Calculate performance for each branch
        const branchPerformance = branches.map((branch) => {
          const branchItems = items.filter((item) => item.branchId === branch.id || item.branch === branch.name)
          const branchExpenses = expenses.filter((expense) => expense.branchId === branch.id)

          const soldItems = branchItems.filter((item) => item.status === "sold")
          const totalRevenue = soldItems.reduce((sum, item) => sum + (item.sellingPrice || 0), 0)

          const totalCost = soldItems.reduce((sum, item) => {
            const materialCost = item.weight * item.lomNarxi
            const laborCost = item.weight * (item.laborCost || 0)
            return sum + materialCost + laborCost
          }, 0)

          const totalExpenses = branchExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
          const grossProfit = totalRevenue - totalCost
          const netProfit = grossProfit - totalExpenses

          const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

          return {
            id: branch.id,
            name: branch.name,
            type: branch.isProvider ? "Markaz" : "Filial",
            totalItems: branchItems.length,
            soldItems: soldItems.length,
            totalRevenue,
            totalCost,
            totalExpenses,
            grossProfit,
            netProfit,
            profitMargin,
            salesConversion: branchItems.length > 0 ? (soldItems.length / branchItems.length) * 100 : 0,
          }
        })

        // Sort by net profit
        branchPerformance.sort((a, b) => b.netProfit - a.netProfit)

        setBranchData(branchPerformance)

        // Calculate summary
        const totalRevenue = branchPerformance.reduce((sum, branch) => sum + branch.totalRevenue, 0)
        const totalProfit = branchPerformance.reduce((sum, branch) => sum + branch.netProfit, 0)
        const averagePerformance =
          branchPerformance.length > 0
            ? branchPerformance.reduce((sum, branch) => sum + branch.profitMargin, 0) / branchPerformance.length
            : 0

        setSummary({
          totalBranches: branchPerformance.length,
          totalRevenue,
          totalProfit,
          averagePerformance,
        })
      } catch (error) {
        console.error("Error fetching branch performance data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Prepare chart data
  const chartData = branchData.map((branch) => ({
    name: branch.name.length > 10 ? branch.name.substring(0, 10) + "..." : branch.name,
    revenue: branch.totalRevenue,
    profit: branch.netProfit,
    expenses: branch.totalExpenses,
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami filiallar</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalBranches}</div>
            <p className="text-xs text-muted-foreground">Faol filiallar soni</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami daromad</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Barcha filiallar bo'yicha</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sof foyda</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(summary.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">Xarajatlardan keyin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O'rtacha rentabellik</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{summary.averagePerformance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Foyda marjasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Filiallar bo'yicha daromad va foyda</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" fill="#10B981" name="Daromad" />
              <Bar dataKey="profit" fill="#3B82F6" name="Foyda" />
              <Bar dataKey="expenses" fill="#EF4444" name="Xarajatlar" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Branch Details Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Filiallar tafsiloti</CardTitle>
          <Button onClick={onExport} variant="outline" size="sm">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel eksport
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Filial</th>
                  <th className="text-center p-2">Turi</th>
                  <th className="text-right p-2">Mahsulotlar</th>
                  <th className="text-right p-2">Sotilgan</th>
                  <th className="text-right p-2">Daromad</th>
                  <th className="text-right p-2">Xarajatlar</th>
                  <th className="text-right p-2">Sof foyda</th>
                  <th className="text-right p-2">Rentabellik</th>
                  <th className="text-right p-2">Konversiya</th>
                </tr>
              </thead>
              <tbody>
                {branchData.map((branch, index) => (
                  <tr key={branch.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{branch.name}</td>
                    <td className="text-center p-2">
                      <Badge variant={branch.type === "Markaz" ? "default" : "secondary"}>{branch.type}</Badge>
                    </td>
                    <td className="text-right p-2">{branch.totalItems}</td>
                    <td className="text-right p-2 text-green-600">{branch.soldItems}</td>
                    <td className="text-right p-2 font-medium">{formatCurrency(branch.totalRevenue)}</td>
                    <td className="text-right p-2 text-red-600">{formatCurrency(branch.totalExpenses)}</td>
                    <td
                      className={`text-right p-2 font-medium ${branch.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(branch.netProfit)}
                    </td>
                    <td className={`text-right p-2 ${branch.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {branch.profitMargin.toFixed(1)}%
                    </td>
                    <td className="text-right p-2">{branch.salesConversion.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Eng yuqori daromad</CardTitle>
          </CardHeader>
          <CardContent>
            {branchData.length > 0 && (
              <div>
                <p className="font-medium">{branchData.sort((a, b) => b.totalRevenue - a.totalRevenue)[0]?.name}</p>
                <p className="text-sm text-green-600">
                  {formatCurrency(branchData.sort((a, b) => b.totalRevenue - a.totalRevenue)[0]?.totalRevenue)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Eng yuqori foyda</CardTitle>
          </CardHeader>
          <CardContent>
            {branchData.length > 0 && (
              <div>
                <p className="font-medium">{branchData.sort((a, b) => b.netProfit - a.netProfit)[0]?.name}</p>
                <p className="text-sm text-blue-600">
                  {formatCurrency(branchData.sort((a, b) => b.netProfit - a.netProfit)[0]?.netProfit)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Eng yuqori rentabellik</CardTitle>
          </CardHeader>
          <CardContent>
            {branchData.length > 0 && (
              <div>
                <p className="font-medium">{branchData.sort((a, b) => b.profitMargin - a.profitMargin)[0]?.name}</p>
                <p className="text-sm text-purple-600">
                  {branchData.sort((a, b) => b.profitMargin - a.profitMargin)[0]?.profitMargin.toFixed(1)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

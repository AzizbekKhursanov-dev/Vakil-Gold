"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils/currency"
import { Chart } from "@/components/ui/chart"
import { Download, TrendingUp, TrendingDown, DollarSign, Target, AlertCircle } from "lucide-react"
import { format, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns"

interface FinancialSummaryReportProps {
  transactions?: any[]
  expenses?: any[]
  dateRange?: { from: Date; to: Date }
  selectedBranch?: string
  onExport?: () => void
}

export function FinancialSummaryReport({
  transactions = [],
  expenses = [],
  dateRange,
  selectedBranch,
  onExport,
}: FinancialSummaryReportProps) {
  const [loading, setLoading] = useState(false)
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [summaryData, setSummaryData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    profitMargin: 0,
    revenueGrowth: 0,
    expenseGrowth: 0,
  })
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [expenseCategoryData, setExpenseCategoryData] = useState<any[]>([])

  useEffect(() => {
    setLoading(true)

    // Filter transactions by date range and branch
    let filteredTransactions = transactions.filter((t) => t.type === "sale")
    let filteredExpenses = expenses

    if (dateRange?.from && dateRange?.to) {
      filteredTransactions = filteredTransactions.filter((t) => {
        const date = new Date(t.createdAt)
        return date >= dateRange.from && date <= dateRange.to
      })

      filteredExpenses = filteredExpenses.filter((e) => {
        const date = new Date(e.date)
        return date >= dateRange.from && date <= dateRange.to
      })
    }

    if (selectedBranch && selectedBranch !== "all") {
      filteredTransactions = filteredTransactions.filter((t) => t.branchId === selectedBranch)
      filteredExpenses = filteredExpenses.filter((e) => e.branchId === selectedBranch)
    }

    // Calculate monthly data
    const months =
      dateRange?.from && dateRange?.to
        ? eachMonthOfInterval({ start: dateRange.from, end: dateRange.to })
        : eachMonthOfInterval({ start: subMonths(new Date(), 11), end: new Date() })

    const monthlyDataMap = months.map((month) => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)

      const monthTransactions = filteredTransactions.filter((t) => {
        const date = new Date(t.createdAt)
        return date >= monthStart && date <= monthEnd
      })

      const monthExpenses = filteredExpenses.filter((e) => {
        const date = new Date(e.date)
        return date >= monthStart && date <= monthEnd
      })

      const revenue = monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      const expense = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
      const profit = revenue - expense

      return {
        month: format(month, "MMM yyyy"),
        revenue,
        expense,
        profit,
      }
    })

    setMonthlyData(monthlyDataMap)

    // Calculate summary data
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const totalProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    // Calculate growth (compare with previous period)
    let revenueGrowth = 0
    let expenseGrowth = 0

    if (dateRange?.from && dateRange?.to) {
      const periodLength = dateRange.to.getTime() - dateRange.from.getTime()
      const previousPeriodStart = new Date(dateRange.from.getTime() - periodLength)
      const previousPeriodEnd = new Date(dateRange.from.getTime() - 1)

      const previousTransactions = transactions
        .filter((t) => t.type === "sale")
        .filter((t) => {
          const date = new Date(t.createdAt)
          return date >= previousPeriodStart && date <= previousPeriodEnd
        })
        .filter((t) => !selectedBranch || selectedBranch === "all" || t.branchId === selectedBranch)

      const previousExpensesData = expenses
        .filter((e) => {
          const date = new Date(e.date)
          return date >= previousPeriodStart && date <= previousPeriodEnd
        })
        .filter((e) => !selectedBranch || selectedBranch === "all" || e.branchId === selectedBranch)

      const previousRevenue = previousTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      const previousExpenses = previousExpensesData.reduce((sum, e) => sum + (e.amount || 0), 0)

      revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
      expenseGrowth = previousExpenses > 0 ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 : 0
    }

    setSummaryData({
      totalRevenue,
      totalExpenses,
      totalProfit,
      profitMargin,
      revenueGrowth,
      expenseGrowth,
    })

    // Calculate category data
    const categoryRevenue: Record<string, number> = {}
    filteredTransactions.forEach((t) => {
      if (t.items && t.items.length > 0) {
        t.items.forEach((item: any) => {
          if (item.category) {
            categoryRevenue[item.category] = (categoryRevenue[item.category] || 0) + (t.amount / t.items.length || 0)
          }
        })
      }
    })

    const categoryChartData = Object.entries(categoryRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    setCategoryData(categoryChartData)

    // Calculate expense category data
    const expenseCategories: Record<string, number> = {}
    filteredExpenses.forEach((e) => {
      if (e.category) {
        expenseCategories[e.category] = (expenseCategories[e.category] || 0) + (e.amount || 0)
      }
    })

    const expenseCategoryChartData = Object.entries(expenseCategories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    setExpenseCategoryData(expenseCategoryChartData)

    setLoading(false)
  }, [transactions, expenses, dateRange, selectedBranch])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami daromad</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(summaryData.totalRevenue)}</div>
                <div className="flex items-center pt-1 text-xs text-muted-foreground">
                  {summaryData.revenueGrowth > 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span className={summaryData.revenueGrowth > 0 ? "text-green-500" : "text-red-500"}>
                    {summaryData.revenueGrowth.toFixed(1)}%
                  </span>
                  <span className="ml-1">o'tgan davrga nisbatan</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami xarajat</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(summaryData.totalExpenses)}</div>
                <div className="flex items-center pt-1 text-xs text-muted-foreground">
                  {summaryData.expenseGrowth > 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-red-500" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
                  )}
                  <span className={summaryData.expenseGrowth > 0 ? "text-red-500" : "text-green-500"}>
                    {summaryData.expenseGrowth.toFixed(1)}%
                  </span>
                  <span className="ml-1">o'tgan davrga nisbatan</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sof foyda</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div
                  className={`text-2xl font-bold ${summaryData.totalProfit >= 0 ? "text-blue-600" : "text-red-600"}`}
                >
                  {formatCurrency(summaryData.totalProfit)}
                </div>
                <p className="text-xs text-muted-foreground">Foyda marjasi: {summaryData.profitMargin.toFixed(1)}%</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moliyaviy holat</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  <Badge
                    className={
                      summaryData.profitMargin > 20
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : summaryData.profitMargin > 10
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                    }
                  >
                    {summaryData.profitMargin > 20
                      ? "Yaxshi"
                      : summaryData.profitMargin > 10
                        ? "O'rtacha"
                        : "Yaxshilash kerak"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Xarajat nisbati:{" "}
                  {summaryData.totalRevenue > 0
                    ? ((summaryData.totalExpenses / summaryData.totalRevenue) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Oylik moliyaviy ko'rsatkichlar</CardTitle>
            <CardDescription>Daromad, xarajat va foyda dinamikasi</CardDescription>
          </div>
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Eksport
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : monthlyData.length > 0 ? (
            <div className="h-[300px]">
              <Chart
                data={monthlyData}
                type="bar"
                xKey="month"
                yKey="value"
                dataKey="revenue"
                colors={["#22c55e", "#ef4444", "#3b82f6"]}
              >
                <Chart.Bar dataKey="revenue" name="Daromad" fill="#22c55e" />
                <Chart.Bar dataKey="expense" name="Xarajat" fill="#ef4444" />
                <Chart.Bar dataKey="profit" name="Foyda" fill="#3b82f6" />
              </Chart>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">Ma'lumot mavjud emas</div>
          )}
        </CardContent>
      </Card>

      {/* Category Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daromad kategoriyalari</CardTitle>
            <CardDescription>Kategoriya bo'yicha daromad taqsimoti</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : categoryData.length > 0 ? (
              <div className="h-[300px]">
                <Chart
                  data={categoryData}
                  type="pie"
                  nameKey="name"
                  valueKey="value"
                  colors={["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Ma'lumot mavjud emas
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Xarajat kategoriyalari</CardTitle>
            <CardDescription>Kategoriya bo'yicha xarajat taqsimoti</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : expenseCategoryData.length > 0 ? (
              <div className="h-[300px]">
                <Chart
                  data={expenseCategoryData}
                  type="pie"
                  nameKey="name"
                  valueKey="value"
                  colors={["#FF8042", "#FFBB28", "#00C49F", "#0088FE", "#8884d8"]}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Ma'lumot mavjud emas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Moliyaviy ko'rsatkichlar</CardTitle>
          <CardDescription>Biznesning moliyaviy holatini baholash</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{summaryData.profitMargin.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Foyda marjasi</div>
                <div className="text-xs mt-2">
                  {summaryData.profitMargin > 20
                    ? "Yuqori foyda marjasi - juda yaxshi"
                    : summaryData.profitMargin > 10
                      ? "O'rtacha foyda marjasi - qoniqarli"
                      : "Past foyda marjasi - yaxshilash kerak"}
                </div>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {summaryData.totalRevenue > 0
                    ? ((summaryData.totalExpenses / summaryData.totalRevenue) * 100).toFixed(1)
                    : 0}
                  %
                </div>
                <div className="text-sm text-muted-foreground">Xarajat nisbati</div>
                <div className="text-xs mt-2">
                  {summaryData.totalRevenue > 0 && summaryData.totalExpenses / summaryData.totalRevenue < 0.7
                    ? "Xarajatlar nazorat ostida - yaxshi"
                    : "Xarajatlar yuqori - nazorat qilish kerak"}
                </div>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div
                  className={`text-2xl font-bold ${summaryData.revenueGrowth > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {summaryData.revenueGrowth.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Daromad o'sishi</div>
                <div className="text-xs mt-2">
                  {summaryData.revenueGrowth > 10
                    ? "Yuqori o'sish - juda yaxshi"
                    : summaryData.revenueGrowth > 0
                      ? "Ijobiy o'sish - qoniqarli"
                      : "Daromad pasaymoqda - e'tibor qaratish kerak"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Moliyaviy tavsiyalar</CardTitle>
          <CardDescription>Moliyaviy holatni yaxshilash uchun tavsiyalar</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {summaryData.profitMargin < 15 && (
                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="mt-0.5">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-900">Foyda marjasini oshirish kerak</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Foyda marjasi {summaryData.profitMargin.toFixed(1)}% - bu ko'rsatkichni oshirish uchun narxlarni
                      qayta ko'rib chiqish yoki xarajatlarni kamaytirish tavsiya etiladi.
                    </p>
                  </div>
                </div>
              )}

              {summaryData.totalRevenue > 0 && summaryData.totalExpenses / summaryData.totalRevenue > 0.7 && (
                <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="mt-0.5">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-red-900">Xarajatlarni kamaytirish kerak</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Xarajatlar daromadning {((summaryData.totalExpenses / summaryData.totalRevenue) * 100).toFixed(1)}
                      % qismini tashkil qilmoqda. Bu ko'rsatkichni 70% dan pastga tushirish tavsiya etiladi.
                    </p>
                  </div>
                </div>
              )}

              {summaryData.revenueGrowth <= 0 && (
                <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="mt-0.5">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-red-900">Daromadni oshirish kerak</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Daromad o'tgan davrga nisbatan {Math.abs(summaryData.revenueGrowth).toFixed(1)}% pasaygan.
                      Marketing strategiyasini qayta ko'rib chiqish va sotuvlarni oshirish choralarini ko'rish tavsiya
                      etiladi.
                    </p>
                  </div>
                </div>
              )}

              {summaryData.profitMargin >= 15 &&
                summaryData.totalRevenue > 0 &&
                summaryData.totalExpenses / summaryData.totalRevenue <= 0.7 &&
                summaryData.revenueGrowth > 0 && (
                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="mt-0.5">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900">Moliyaviy holat yaxshi</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Barcha asosiy moliyaviy ko'rsatkichlar yaxshi. Biznesni shu yo'nalishda davom ettirish va
                        o'sishni barqarorlashtirish tavsiya etiladi.
                      </p>
                    </div>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

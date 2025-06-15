"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranch } from "@/lib/contexts/branch-context"
import { formatCurrency } from "@/lib/utils/currency"
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { format, subDays, subMonths } from "date-fns"

// Import all analytics components
import { ProfitAnalysis } from "@/components/profit-analysis/profit-analysis"
import { MonthlyRevenue } from "@/components/monthly-revenue/monthly-revenue"
import { ReportsSystem } from "@/components/reports/reports-system"
import { AdvancedAnalytics } from "@/components/analytics/advanced-analytics"
import { SmartRecommendations } from "@/components/inventory/smart-recommendations"
import { ProfitByCategory } from "@/components/profit-analysis/profit-by-category"
import { ProfitTrends } from "@/components/profit-analysis/profit-trends"
import { MonthlyRevenueChart } from "@/components/monthly-revenue/monthly-revenue-chart"
import { BranchPerformance } from "@/components/monthly-revenue/branch-performance"

import {
  FileSpreadsheet,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Lightbulb,
  FileText,
  RefreshCw,
  Layers,
} from "lucide-react"

// Define types for our data
interface AnalyticsData {
  profitData: any[]
  revenueData: any[]
  itemsData: any[]
  branchesData: any[]
  transactionsData: any[]
  expensesData: any[]
  suppliersData: any[]
}

interface DateRange {
  from: Date
  to: Date
}

export default function AnalyticsDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { selectedBranch } = useBranch()

  // State for data and UI
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("month")
  const [category, setCategory] = useState("")
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData>({
    profitData: [],
    revenueData: [],
    itemsData: [],
    branchesData: [],
    transactionsData: [],
    expensesData: [],
    suppliersData: [],
  })
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router])

  // Fetch data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      setLoading(true)
      setError(null)

      try {
        // Prepare date filters
        const fromDate = dateRange.from
        const toDate = dateRange.to

        // Fetch profit analysis data
        const profitQuery = query(
          collection(db, "profitAnalysis"),
          where("date", ">=", Timestamp.fromDate(fromDate)),
          where("date", "<=", Timestamp.fromDate(toDate)),
          ...(selectedBranch ? [where("branchId", "==", selectedBranch.id)] : []),
          orderBy("date", "desc"),
        )

        // Fetch revenue data
        const revenueQuery = query(
          collection(db, "monthlyRevenue"),
          where("date", ">=", Timestamp.fromDate(fromDate)),
          where("date", "<=", Timestamp.fromDate(toDate)),
          ...(selectedBranch ? [where("branchId", "==", selectedBranch.id)] : []),
          orderBy("date", "desc"),
        )

        // Fetch transactions data
        const transactionsQuery = query(
          collection(db, "transactions"),
          where("createdAt", ">=", Timestamp.fromDate(fromDate)),
          where("createdAt", "<=", Timestamp.fromDate(toDate)),
          ...(selectedBranch ? [where("branchId", "==", selectedBranch.id)] : []),
          orderBy("createdAt", "desc"),
        )

        // Fetch items data
        const itemsQuery = query(
          collection(db, "items"),
          ...(selectedBranch ? [where("branch", "==", selectedBranch.id)] : []),
          ...(category ? [where("category", "==", category)] : []),
          orderBy("createdAt", "desc"),
        )

        // Fetch branches data
        const branchesQuery = query(collection(db, "branches"), orderBy("name", "asc"))

        // Fetch expenses data
        const expensesQuery = query(
          collection(db, "branchExpenses"),
          where("date", ">=", format(fromDate, "yyyy-MM-dd")),
          where("date", "<=", format(toDate, "yyyy-MM-dd")),
          ...(selectedBranch ? [where("branchId", "==", selectedBranch.id)] : []),
          orderBy("date", "desc"),
        )

        // Fetch suppliers data
        const suppliersQuery = query(
          collection(db, "supplierTransactions"),
          where("transactionDate", ">=", format(fromDate, "yyyy-MM-dd")),
          where("transactionDate", "<=", format(toDate, "yyyy-MM-dd")),
          orderBy("transactionDate", "desc"),
        )

        // Execute all queries in parallel
        const [
          profitSnapshot,
          revenueSnapshot,
          transactionsSnapshot,
          itemsSnapshot,
          branchesSnapshot,
          expensesSnapshot,
          suppliersSnapshot,
        ] = await Promise.all([
          getDocs(profitQuery),
          getDocs(revenueQuery),
          getDocs(transactionsQuery),
          getDocs(itemsQuery),
          getDocs(branchesQuery),
          getDocs(expensesQuery),
          getDocs(suppliersQuery),
        ])

        // Process the results
        const profitData = profitSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        const revenueData = revenueSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        const transactionsData = transactionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        }))

        const itemsData = itemsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        }))

        const branchesData = branchesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        const expensesData = expensesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        const suppliersData = suppliersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Update state with all the data
        setData({
          profitData,
          revenueData,
          itemsData,
          branchesData,
          transactionsData,
          expensesData,
          suppliersData,
        })
      } catch (err) {
        console.error("Error fetching analytics data:", err)
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi")
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    }

    fetchData()
  }, [user, selectedBranch, dateRange, category, timeRange])

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true)
    // The useEffect will handle the actual data refresh
  }

  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range)

    const today = new Date()
    let fromDate: Date

    switch (range) {
      case "week":
        fromDate = subDays(today, 7)
        break
      case "month":
        fromDate = subMonths(today, 1)
        break
      case "quarter":
        fromDate = subMonths(today, 3)
        break
      case "year":
        fromDate = subMonths(today, 12)
        break
      default:
        fromDate = subMonths(today, 1)
    }

    setDateRange({
      from: fromDate,
      to: today,
    })
  }

  // Handle export
  const handleExport = () => {
    // This would be implemented to export data to Excel
    alert("Export functionality would be implemented here")
  }

  // Calculate summary metrics
  const calculateSummaryMetrics = () => {
    const { profitData, revenueData, transactionsData, itemsData, expensesData } = data

    // Total revenue
    const totalRevenue = transactionsData.filter((t) => t.type === "sale").reduce((sum, t) => sum + (t.amount || 0), 0)

    // Total profit
    const totalProfit = profitData.reduce((sum, p) => sum + (p.profit || 0), 0)

    // Total expenses
    const totalExpenses = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0)

    // Items sold
    const itemsSold = transactionsData.filter((t) => t.type === "sale").reduce((sum, t) => sum + (t.itemCount || 1), 0)

    // Average profit margin
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    // Top selling category
    const categorySales: Record<string, number> = {}
    itemsData.forEach((item) => {
      if (item.category) {
        categorySales[item.category] = (categorySales[item.category] || 0) + 1
      }
    })

    let topCategory = ""
    let maxSales = 0
    Object.entries(categorySales).forEach(([category, sales]) => {
      if (sales > maxSales) {
        topCategory = category
        maxSales = sales
      }
    })

    return {
      totalRevenue,
      totalProfit,
      totalExpenses,
      itemsSold,
      profitMargin,
      topCategory,
      netProfit: totalRevenue - totalExpenses,
    }
  }

  // Get summary metrics
  const summaryMetrics = calculateSummaryMetrics()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-muted-foreground font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Let the useEffect handle the redirect
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analitika paneli</h1>
            <p className="text-muted-foreground">
              {selectedBranch
                ? `${selectedBranch.name} filiali uchun tahlillar va hisobotlar`
                : "Barcha filiallar uchun tahlillar va hisobotlar"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} className="w-auto" />

            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Vaqt oralig'i" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Haftalik</SelectItem>
                <SelectItem value="month">Oylik</SelectItem>
                <SelectItem value="quarter">Choraklik</SelectItem>
                <SelectItem value="year">Yillik</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Yangilash
            </Button>

            <Button onClick={handleExport} variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Eksport
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="p-4 text-destructive">{error}</CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami daromad</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    {dateRange.from &&
                      dateRange.to &&
                      `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sof foyda</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(summaryMetrics.netProfit)}</div>
                  <p className="text-xs text-muted-foreground">
                    Foyda marjasi: {summaryMetrics.profitMargin.toFixed(1)}%
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sotilgan mahsulotlar</CardTitle>
              <Layers className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-purple-600">{summaryMetrics.itemsSold}</div>
                  <p className="text-xs text-muted-foreground">Eng ko'p sotilgan: {summaryMetrics.topCategory}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami xarajatlar</CardTitle>
              <PieChart className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(summaryMetrics.totalExpenses)}
                  </div>
                  <p className="text-xs text-muted-foreground">Operatsion xarajatlar</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Umumiy ko'rinish</span>
              <span className="inline md:hidden">Umumiy</span>
            </TabsTrigger>
            <TabsTrigger value="profit" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Foyda tahlili</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Oylik daromad</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Hisobotlar</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span>Chuqur tahlil</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden md:inline">Tavsiyalar</span>
              <span className="inline md:hidden">Tavsiya</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-[200px] w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Foyda tahlili</CardTitle>
                      <CardDescription>Filial va kategoriya bo'yicha foyda</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProfitByCategory data={data.profitData} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Daromad dinamikasi</CardTitle>
                      <CardDescription>Vaqt bo'yicha daromad o'zgarishi</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MonthlyRevenueChart data={data.revenueData} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Filiallar samaradorligi</CardTitle>
                      <CardDescription>Filiallar bo'yicha solishtirma</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BranchPerformance data={data.branchesData} revenueData={data.revenueData} />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Foyda tendensiyalari</CardTitle>
                      <CardDescription>Vaqt bo'yicha foyda o'zgarishi</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProfitTrends data={data.profitData} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Aqlli tavsiyalar</CardTitle>
                      <CardDescription>Biznes samaradorligini oshirish uchun tavsiyalar</CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[300px] overflow-y-auto">
                      <SmartRecommendations
                        items={data.itemsData}
                        transactions={data.transactionsData}
                        branches={data.branchesData}
                        compact={true}
                      />
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Profit Analysis Tab */}
          <TabsContent value="profit" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-[400px] w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ProfitAnalysis data={data.profitData} loading={loading} error={error || null} />
            )}
          </TabsContent>

          {/* Monthly Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-[400px] w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <MonthlyRevenue data={data.revenueData} loading={loading} />
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-[400px] w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ReportsSystem
                items={data.itemsData}
                transactions={data.transactionsData}
                branches={data.branchesData}
                expenses={data.expensesData}
                suppliers={data.suppliersData}
                dateRange={dateRange}
              />
            )}
          </TabsContent>

          {/* Advanced Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-[400px] w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <AdvancedAnalytics
                items={data.itemsData}
                branches={data.branchesData}
                transactions={data.transactionsData}
                timeRange={timeRange}
              />
            )}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-[400px] w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <SmartRecommendations
                items={data.itemsData}
                transactions={data.transactionsData}
                branches={data.branchesData}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

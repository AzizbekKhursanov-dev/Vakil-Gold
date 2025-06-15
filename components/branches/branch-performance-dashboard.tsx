"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { useToast } from "@/hooks/use-toast"
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Target, Download, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"
import type { DateRange } from "react-day-picker"

interface BranchPerformanceDashboardProps {
  branchId: string
  branchName: string
}

interface Item {
  id: string
  model: string
  category: string
  weight: number
  sellingPrice: number
  lomNarxi: number
  lomNarxiKirim: number
  laborCost: number
  status: string
  branchId?: string
  isProvider?: boolean
  soldDate?: string
  purchaseDate?: string
  distributedDate?: string
  createdAt: string
  supplierName?: string
}

interface PerformanceMetrics {
  totalSales: number
  totalProfit: number
  totalItems: number
  soldItems: number
  averageProfitMargin: number
  salesGrowth: number
  inventoryTurnover: number
  topSellingCategories: Array<{ category: string; count: number; revenue: number }>
  salesTrend: Array<{ date: string; sales: number; profit: number }>
  monthlyComparison: Array<{ month: string; sales: number; profit: number; items: number }>
  topProducts: Array<{ id: string; model: string; category: string; profit: number; margin: number }>
  dailyStats: Array<{ date: string; sales: number; transactions: number }>
  categoryPerformance: Array<{ category: string; sales: number; profit: number; margin: number }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export function BranchPerformanceDashboard({ branchId, branchName }: BranchPerformanceDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [items, setItems] = useState<Item[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalSales: 0,
    totalProfit: 0,
    totalItems: 0,
    soldItems: 0,
    averageProfitMargin: 0,
    salesGrowth: 0,
    inventoryTurnover: 0,
    topSellingCategories: [],
    salesTrend: [],
    monthlyComparison: [],
    topProducts: [],
    dailyStats: [],
    categoryPerformance: [],
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchPerformanceData()
  }, [branchId, dateRange])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)

      const itemsQuery = query(collection(db, "items"), orderBy("createdAt", "desc"))

      const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
        const allItems = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt || new Date().toISOString(),
          }
        }) as Item[]

        // Filter items related to this branch
        const branchItems = allItems.filter(
          (item) => item.branchId === branchId || (item.isProvider && item.distributedDate),
        )

        setItems(branchItems)
        calculateMetrics(branchItems)
        setLoading(false)
        setRefreshing(false)
      })

      return () => unsubscribe()
    } catch (error) {
      console.error("Error fetching performance data:", error)
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
      setLoading(false)
      setRefreshing(false)
    }
  }

  const calculateMetrics = (allItems: Item[]) => {
    const fromDate = dateRange?.from || subMonths(new Date(), 1)
    const toDate = dateRange?.to || new Date()

    // Filter items by date range and sold status
    const soldItems = allItems.filter((item) => {
      if (item.status !== "sold" || !item.soldDate) return false
      const soldDate = new Date(item.soldDate)
      return soldDate >= fromDate && soldDate <= toDate
    })

    // Calculate basic metrics
    const totalSales = soldItems.reduce((sum, item) => sum + item.sellingPrice, 0)

    const totalProfit = soldItems.reduce((sum, item) => {
      const materialCost = item.weight * (item.isProvider ? item.lomNarxi : item.lomNarxiKirim)
      const laborCost = item.weight * item.laborCost
      const totalCost = materialCost + laborCost
      return sum + (item.sellingPrice - totalCost)
    }, 0)

    const totalItems = allItems.length
    const soldItemsCount = soldItems.length
    const availableItems = allItems.filter((item) => item.status === "available").length

    // Calculate profit margins
    const profitMargins = soldItems.map((item) => {
      const materialCost = item.weight * (item.isProvider ? item.lomNarxi : item.lomNarxiKirim)
      const laborCost = item.weight * item.laborCost
      const totalCost = materialCost + laborCost
      return totalCost > 0 ? ((item.sellingPrice - totalCost) / item.sellingPrice) * 100 : 0
    })

    const averageProfitMargin =
      profitMargins.length > 0 ? profitMargins.reduce((sum, margin) => sum + margin, 0) / profitMargins.length : 0

    // Calculate growth (compare with previous period)
    const previousPeriodStart = new Date(fromDate)
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1)
    const previousPeriodEnd = new Date(toDate)
    previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1)

    const previousSoldItems = allItems.filter((item) => {
      if (item.status !== "sold" || !item.soldDate) return false
      const soldDate = new Date(item.soldDate)
      return soldDate >= previousPeriodStart && soldDate <= previousPeriodEnd
    })

    const previousSales = previousSoldItems.reduce((sum, item) => sum + item.sellingPrice, 0)
    const salesGrowth = previousSales > 0 ? ((totalSales - previousSales) / previousSales) * 100 : 0

    // Calculate inventory turnover
    const inventoryValue = allItems
      .filter((item) => item.status === "available")
      .reduce((sum, item) => sum + item.sellingPrice, 0)
    const inventoryTurnover = inventoryValue > 0 ? totalSales / inventoryValue : 0

    // Top selling categories
    const categoryStats: Record<string, { count: number; revenue: number }> = {}
    soldItems.forEach((item) => {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = { count: 0, revenue: 0 }
      }
      categoryStats[item.category].count += 1
      categoryStats[item.category].revenue += item.sellingPrice
    })

    const topSellingCategories = Object.entries(categoryStats)
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Sales trend data
    const days = eachDayOfInterval({ start: fromDate, end: toDate })
    const salesTrend = days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd")
      const dayItems = soldItems.filter((item) => format(new Date(item.soldDate!), "yyyy-MM-dd") === dayStr)

      const sales = dayItems.reduce((sum, item) => sum + item.sellingPrice, 0)
      const profit = dayItems.reduce((sum, item) => {
        const materialCost = item.weight * (item.isProvider ? item.lomNarxi : item.lomNarxiKirim)
        const laborCost = item.weight * item.laborCost
        const totalCost = materialCost + laborCost
        return sum + (item.sellingPrice - totalCost)
      }, 0)

      return {
        date: format(day, "MMM dd"),
        sales,
        profit,
      }
    })

    // Monthly comparison
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 6),
      end: new Date(),
    })

    const monthlyComparison = months.map((month) => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)

      const monthItems = allItems.filter((item) => {
        if (item.status !== "sold" || !item.soldDate) return false
        const soldDate = new Date(item.soldDate)
        return soldDate >= monthStart && soldDate <= monthEnd
      })

      const sales = monthItems.reduce((sum, item) => sum + item.sellingPrice, 0)
      const profit = monthItems.reduce((sum, item) => {
        const materialCost = item.weight * (item.isProvider ? item.lomNarxi : item.lomNarxiKirim)
        const laborCost = item.weight * item.laborCost
        const totalCost = materialCost + laborCost
        return sum + (item.sellingPrice - totalCost)
      }, 0)

      return {
        month: format(month, "MMM yyyy"),
        sales,
        profit,
        items: monthItems.length,
      }
    })

    // Top products by profit
    const topProducts = soldItems
      .map((item) => {
        const materialCost = item.weight * (item.isProvider ? item.lomNarxi : item.lomNarxiKirim)
        const laborCost = item.weight * item.laborCost
        const totalCost = materialCost + laborCost
        const profit = item.sellingPrice - totalCost
        const margin = item.sellingPrice > 0 ? (profit / item.sellingPrice) * 100 : 0

        return {
          id: item.id,
          model: item.model,
          category: item.category,
          profit,
          margin,
        }
      })
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)

    // Daily stats
    const dailyStats = days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd")
      const dayItems = soldItems.filter((item) => format(new Date(item.soldDate!), "yyyy-MM-dd") === dayStr)

      return {
        date: format(day, "MMM dd"),
        sales: dayItems.reduce((sum, item) => sum + item.sellingPrice, 0),
        transactions: dayItems.length,
      }
    })

    // Category performance
    const categoryPerformance = Object.entries(categoryStats)
      .map(([category, stats]) => {
        const categoryItems = soldItems.filter((item) => item.category === category)
        const categoryProfit = categoryItems.reduce((sum, item) => {
          const materialCost = item.weight * (item.isProvider ? item.lomNarxi : item.lomNarxiKirim)
          const laborCost = item.weight * item.laborCost
          const totalCost = materialCost + laborCost
          return sum + (item.sellingPrice - totalCost)
        }, 0)

        const margin = stats.revenue > 0 ? (categoryProfit / stats.revenue) * 100 : 0

        return {
          category,
          sales: stats.revenue,
          profit: categoryProfit,
          margin,
        }
      })
      .sort((a, b) => b.sales - a.sales)

    setMetrics({
      totalSales,
      totalProfit,
      totalItems,
      soldItems: soldItemsCount,
      averageProfitMargin,
      salesGrowth,
      inventoryTurnover,
      topSellingCategories,
      salesTrend,
      monthlyComparison,
      topProducts,
      dailyStats,
      categoryPerformance,
    })
  }

  const refreshData = () => {
    setRefreshing(true)
    fetchPerformanceData()
  }

  const exportData = () => {
    toast({
      title: "Eksport",
      description: "Ma'lumotlar eksport qilindi",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{branchName} - Ishlash ko'rsatkichlari</h1>
          <p className="text-muted-foreground">
            {dateRange?.from && dateRange?.to
              ? `${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`
              : "So'nggi oy"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          <Button variant="outline" size="sm" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami sotuv</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalSales)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.salesGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(metrics.salesGrowth).toFixed(1)}% o'sish
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami foyda</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalProfit)}</div>
            <div className="text-xs text-muted-foreground">
              O'rtacha margin: {metrics.averageProfitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sotilgan mahsulotlar</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.soldItems}</div>
            <div className="text-xs text-muted-foreground">Jami: {metrics.totalItems} ta mahsulot</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventar aylanishi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.inventoryTurnover.toFixed(2)}x</div>
            <div className="text-xs text-muted-foreground">Inventar samaradorligi</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Umumiy ko'rinish</TabsTrigger>
          <TabsTrigger value="sales">Sotuv tahlili</TabsTrigger>
          <TabsTrigger value="products">Mahsulotlar</TabsTrigger>
          <TabsTrigger value="categories">Kategoriyalar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sales Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sotuv tendentsiyasi</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area type="monotone" dataKey="sales" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Oylik taqqoslash</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="sales" fill="#8884d8" />
                    <Bar dataKey="profit" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Eng ko'p sotilgan kategoriyalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.topSellingCategories.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-sm text-muted-foreground">{category.count} ta mahsulot</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(category.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Daily Sales */}
            <Card>
              <CardHeader>
                <CardTitle>Kunlik sotuv</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sales vs Profit */}
            <Card>
              <CardHeader>
                <CardTitle>Sotuv va foyda</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="sales" fill="#8884d8" name="Sotuv" />
                    <Bar dataKey="profit" fill="#82ca9d" name="Foyda" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eng foydali mahsulotlar</CardTitle>
              <CardDescription>Foyda bo'yicha eng yaxshi mahsulotlar</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Kategoriya</TableHead>
                      <TableHead>Foyda</TableHead>
                      <TableHead>Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.topProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.model}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{formatCurrency(product.profit)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.margin > 20 ? "default" : product.margin > 10 ? "secondary" : "destructive"
                            }
                          >
                            {product.margin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Category Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Kategoriya bo'yicha sotuv</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.categoryPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sales"
                    >
                      {metrics.categoryPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Kategoriya ishlashi</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategoriya</TableHead>
                        <TableHead>Sotuv</TableHead>
                        <TableHead>Foyda</TableHead>
                        <TableHead>Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.categoryPerformance.map((category) => (
                        <TableRow key={category.category}>
                          <TableCell className="font-medium">{category.category}</TableCell>
                          <TableCell>{formatCurrency(category.sales)}</TableCell>
                          <TableCell>{formatCurrency(category.profit)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                category.margin > 20 ? "default" : category.margin > 10 ? "secondary" : "destructive"
                              }
                            >
                              {category.margin.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

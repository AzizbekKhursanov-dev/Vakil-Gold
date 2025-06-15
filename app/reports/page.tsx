"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDateRangePicker } from "@/components/ui/date-range-picker"
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
import { useItems } from "@/hooks/useItems"
import { formatCurrency } from "@/lib/utils/currency"
import { TrendingUp, DollarSign, Package, Download, Filter } from "lucide-react"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function ReportsPage() {
  const { items, stats } = useItems()
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })

  // Calculate analytics data
  const monthlyRevenue = calculateMonthlyRevenue(items)
  const profitAnalysis = calculateProfitAnalysis(items)
  const categoryDistribution = calculateCategoryDistribution(items)
  const branchPerformance = calculateBranchPerformance(items)

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hisobotlar va Tahlillar</h1>
            <p className="text-muted-foreground">Biznes faoliyati bo'yicha batafsil hisobotlar va statistikalar</p>
          </div>
          <div className="flex gap-2">
            <CalendarDateRangePicker />
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtr
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Eksport
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami Mahsulotlar</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">+{stats.available} mavjud</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami Qiymat</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              <p className="text-xs text-muted-foreground">+12% o'tgan oyga nisbatan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sotilgan</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sold}</div>
              <p className="text-xs text-muted-foreground">+8% o'tgan haftaga nisbatan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami Og'irlik</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWeight.toFixed(1)}g</div>
              <p className="text-xs text-muted-foreground">Barcha mahsulotlar</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Oylik Daromad</TabsTrigger>
            <TabsTrigger value="profit">Foyda Tahlili</TabsTrigger>
            <TabsTrigger value="analytics">Batafsil Tahlil</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Oylik Daromad Trendi</CardTitle>
                  <CardDescription>So'nggi 12 oy bo'yicha daromad dinamikasi</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Filial Bo'yicha Daromad</CardTitle>
                  <CardDescription>Har bir filialning hissasi</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={branchPerformance}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {branchPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profit" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Kategoriya Bo'yicha Foyda</CardTitle>
                  <CardDescription>Har bir kategoriyaning foyda ko'rsatkichi</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={profitAnalysis.byCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="profit" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Foyda Trendi</CardTitle>
                  <CardDescription>Oylik foyda o'zgarishi</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={profitAnalysis.trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line type="monotone" dataKey="profit" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Kategoriya Taqsimoti</CardTitle>
                  <CardDescription>Mahsulotlarning kategoriya bo'yicha taqsimoti</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Eng Ko'p Sotiladigan Mahsulotlar</CardTitle>
                  <CardDescription>Top 10 mahsulotlar ro'yxati</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items
                      .filter((item) => item.status === "sold")
                      .slice(0, 10)
                      .map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">#{index + 1}</span>
                            <div>
                              <p className="text-sm font-medium">{item.model}</p>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(item.sellingPrice)}</p>
                            <p className="text-xs text-muted-foreground">{item.weight}g</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

// Helper functions for calculations
function calculateMonthlyRevenue(items: any[]) {
  const monthlyData = new Map()

  items
    .filter((item) => item.status === "sold")
    .forEach((item) => {
      const date = new Date(item.soldDate || item.updatedAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { month: monthKey, revenue: 0 })
      }

      monthlyData.get(monthKey).revenue += item.sellingPrice
    })

  return Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month))
}

function calculateProfitAnalysis(items: any[]) {
  const byCategory = new Map()
  const monthlyProfit = new Map()

  items
    .filter((item) => item.status === "sold")
    .forEach((item) => {
      const profit = item.sellingPrice - (item.weight * item.lomNarxi + item.weight * item.laborCost)

      // By category
      if (!byCategory.has(item.category)) {
        byCategory.set(item.category, { category: item.category, profit: 0 })
      }
      byCategory.get(item.category).profit += profit

      // Monthly trend
      const date = new Date(item.soldDate || item.updatedAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!monthlyProfit.has(monthKey)) {
        monthlyProfit.set(monthKey, { month: monthKey, profit: 0 })
      }
      monthlyProfit.get(monthKey).profit += profit
    })

  return {
    byCategory: Array.from(byCategory.values()),
    trend: Array.from(monthlyProfit.values()).sort((a, b) => a.month.localeCompare(b.month)),
  }
}

function calculateCategoryDistribution(items: any[]) {
  const distribution = new Map()

  items.forEach((item) => {
    if (!distribution.has(item.category)) {
      distribution.set(item.category, { name: item.category, count: 0 })
    }
    distribution.get(item.category).count += 1
  })

  return Array.from(distribution.values())
}

function calculateBranchPerformance(items: any[]) {
  const performance = new Map()

  items
    .filter((item) => item.status === "sold")
    .forEach((item) => {
      const branchName = item.branchName || "Ombor"

      if (!performance.has(branchName)) {
        performance.set(branchName, { name: branchName, revenue: 0 })
      }
      performance.get(branchName).revenue += item.sellingPrice
    })

  return Array.from(performance.values())
}

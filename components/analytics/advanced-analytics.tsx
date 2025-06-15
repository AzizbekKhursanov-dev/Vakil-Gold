"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils/currency"
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  PieChart,
  LineChart,
  ArrowRight,
  Package,
  DollarSign,
} from "lucide-react"

interface AdvancedAnalyticsProps {
  items?: any[]
  branches?: any[]
  transactions?: any[]
  timeRange?: string
}

export function AdvancedAnalytics({
  items = [],
  branches = [],
  transactions = [],
  timeRange = "month",
}: AdvancedAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("profit")
  const [branch, setBranch] = useState("all")
  const [loading, setLoading] = useState(false)

  // Mock data - in a real app, this would be calculated from the props
  const profitData = {
    total: 125750000,
    byCategory: [
      { category: "Uzuk", profit: 45250000, percentage: 36 },
      { category: "Sirg'a", profit: 32500000, percentage: 26 },
      { category: "Bilakuzuk", profit: 28000000, percentage: 22 },
      { category: "Zanjir", profit: 15000000, percentage: 12 },
      { category: "Boshqa", profit: 5000000, percentage: 4 },
    ],
    trend: "+12.5%",
    trendDirection: "up",
  }

  const inventoryData = {
    totalItems: 1245,
    totalValue: 875000000,
    turnoverRate: 3.2,
    byBranch: [
      { branch: "Bulung'ur", turnover: 4.1, performance: "high" },
      { branch: "Qizil Tepa", turnover: 3.5, performance: "medium" },
      { branch: "Markaziy", turnover: 2.8, performance: "medium" },
      { branch: "Samarqand", turnover: 2.1, performance: "low" },
    ],
  }

  const riskData = {
    slowMoving: 87,
    slowMovingValue: 125000000,
    highConcentration: [
      { category: "Uzuk", percentage: 42, value: 367500000 },
      { category: "Bilakuzuk", percentage: 28, value: 245000000 },
    ],
    lowMargin: 34,
  }

  const seasonalData = {
    quarters: [
      { name: "Q1", value: 215000000 },
      { name: "Q2", value: 187000000 },
      { name: "Q3", value: 310000000 },
      { name: "Q4", value: 425000000 },
    ],
    peakMonths: ["Dekabr", "Mart", "Iyun"],
    lowMonths: ["Fevral", "Iyul", "Avgust"],
  }

  // Calculate real metrics from provided data
  useEffect(() => {
    if (items.length > 0 || transactions.length > 0) {
      setLoading(true)

      // Simulate calculation time
      const timer = setTimeout(() => {
        // Here you would calculate real metrics from the data
        setLoading(false)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [items, transactions, branches, timeRange])

  // Calculate sales by category
  const calculateSalesByCategory = () => {
    const categorySales: Record<string, number> = {}

    transactions.forEach((transaction) => {
      if (transaction.type === "sale" && transaction.items) {
        transaction.items.forEach((item: any) => {
          if (item.category) {
            categorySales[item.category] =
              (categorySales[item.category] || 0) + (transaction.amount / transaction.items.length || 0)
          }
        })
      }
    })

    return Object.entries(categorySales)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }

  // Calculate branch performance
  const calculateBranchPerformance = () => {
    const branchPerformance: Record<string, { sales: number; profit: number; items: number }> = {}

    branches.forEach((branch) => {
      branchPerformance[branch.id] = { sales: 0, profit: 0, items: 0 }
    })

    transactions.forEach((transaction) => {
      if (transaction.type === "sale" && transaction.branchId) {
        if (branchPerformance[transaction.branchId]) {
          branchPerformance[transaction.branchId].sales += transaction.amount || 0
          branchPerformance[transaction.branchId].profit += transaction.profit || 0
          branchPerformance[transaction.branchId].items += transaction.itemCount || 1
        }
      }
    })

    return Object.entries(branchPerformance)
      .map(([branchId, data]) => {
        const branch = branches.find((b) => b.id === branchId)
        return {
          id: branchId,
          name: branch?.name || "Unknown",
          sales: data.sales,
          profit: data.profit,
          items: data.items,
          efficiency: data.items > 0 ? data.profit / data.items : 0,
        }
      })
      .sort((a, b) => b.sales - a.sales)
  }

  // Calculate slow moving inventory
  const calculateSlowMovingInventory = () => {
    // Items that haven't been sold in 90 days
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90)

    return items.filter((item) => {
      const createdAt = new Date(item.createdAt)
      return item.status === "available" && createdAt < threeMonthsAgo
    })
  }

  // Calculate seasonal trends
  const calculateSeasonalTrends = () => {
    const monthlySales: Record<string, number> = {}
    const monthNames = [
      "Yanvar",
      "Fevral",
      "Mart",
      "Aprel",
      "May",
      "Iyun",
      "Iyul",
      "Avgust",
      "Sentabr",
      "Oktabr",
      "Noyabr",
      "Dekabr",
    ]

    // Initialize all months
    monthNames.forEach((month) => {
      monthlySales[month] = 0
    })

    transactions.forEach((transaction) => {
      if (transaction.type === "sale" && transaction.createdAt) {
        const date = new Date(transaction.createdAt)
        const month = monthNames[date.getMonth()]
        monthlySales[month] = (monthlySales[month] || 0) + (transaction.amount || 0)
      }
    })

    return Object.entries(monthlySales).map(([month, amount]) => ({ month, amount }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={timeRange} onValueChange={(value) => console.log(value)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Vaqt oralig'i" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">So'nggi 7 kun</SelectItem>
              <SelectItem value="30">So'nggi 30 kun</SelectItem>
              <SelectItem value="90">So'nggi 3 oy</SelectItem>
              <SelectItem value="365">So'nggi 1 yil</SelectItem>
            </SelectContent>
          </Select>

          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Barcha filiallar" />
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

        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Hisobotni yuklab olish
        </Button>
      </div>

      <Tabs defaultValue="profit" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profit">Foyda tahlili</TabsTrigger>
          <TabsTrigger value="inventory">Inventar aylanishi</TabsTrigger>
          <TabsTrigger value="seasonal">Mavsumiy tendensiyalar</TabsTrigger>
          <TabsTrigger value="risk">Risk tahlili</TabsTrigger>
        </TabsList>

        <TabsContent value="profit" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Umumiy foyda</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(profitData.total)}</div>
                    <div className="flex items-center pt-1 text-xs text-muted-foreground">
                      {profitData.trendDirection === "up" ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                      )}
                      <span className={profitData.trendDirection === "up" ? "text-green-500" : "text-red-500"}>
                        {profitData.trend}
                      </span>
                      <span className="ml-1">o'tgan davrga nisbatan</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {profitData.byCategory.slice(0, 3).map((item) => (
              <Card key={item.category}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.category}</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{formatCurrency(item.profit)}</div>
                      <div className="text-xs text-muted-foreground">Umumiy foydaning {item.percentage}%</div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kategoriya bo'yicha foyda taqsimoti</CardTitle>
              <CardDescription>Har bir mahsulot kategoriyasining umumiy foydaga qo'shgan hissasi</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full flex items-center justify-center">
                  {/* In a real app, you would use a chart library like Recharts */}
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="mx-auto h-16 w-16 opacity-50" />
                    <p>Kategoriya bo'yicha foyda diagrammasi</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jami mahsulotlar</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{inventoryData.totalItems.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Umumiy qiymati: {formatCurrency(inventoryData.totalValue)}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">O'rtacha aylanish</CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{inventoryData.turnoverRate.toFixed(1)}x</div>
                    <p className="text-xs text-muted-foreground">Yillik aylanish koeffitsienti</p>
                  </>
                )}
              </CardContent>
            </Card>

            {inventoryData.byBranch.slice(0, 2).map((item) => (
              <Card key={item.branch}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.branch}</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{item.turnover.toFixed(1)}x</div>
                      <p
                        className={`text-xs ${
                          item.performance === "high"
                            ? "text-green-500"
                            : item.performance === "medium"
                              ? "text-amber-500"
                              : "text-red-500"
                        }`}
                      >
                        {item.performance === "high"
                          ? "Yuqori samaradorlik"
                          : item.performance === "medium"
                            ? "O'rtacha samaradorlik"
                            : "Past samaradorlik"}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filiallar bo'yicha inventar aylanishi</CardTitle>
              <CardDescription>Har bir filialning inventar aylanish ko'rsatkichlari va samaradorligi</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="mx-auto h-16 w-16 opacity-50" />
                    <p>Filiallar bo'yicha inventar aylanishi diagrammasi</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {seasonalData.quarters.map((quarter) => (
              <Card key={quarter.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{quarter.name} chorak</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{formatCurrency(quarter.value)}</div>
                      <p className="text-xs text-muted-foreground">
                        {quarter.name === "Q4" ? "Eng yuqori" : quarter.name === "Q2" ? "Eng past" : ""}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Yuqori daromadli oylar</CardTitle>
                <CardDescription>Yil davomida eng yuqori daromad keltiruvchi oylar</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {seasonalData.peakMonths.map((month, index) => (
                      <div key={month} className="flex items-center">
                        <div className="font-medium">
                          {index + 1}. {month}
                        </div>
                        <div className="ml-auto text-green-500 flex items-center">
                          <TrendingUp className="mr-1 h-4 w-4" />
                          Yuqori
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Past daromadli oylar</CardTitle>
                <CardDescription>Yil davomida eng past daromad keltiruvchi oylar</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {seasonalData.lowMonths.map((month, index) => (
                      <div key={month} className="flex items-center">
                        <div className="font-medium">
                          {index + 1}. {month}
                        </div>
                        <div className="ml-auto text-red-500 flex items-center">
                          <TrendingDown className="mr-1 h-4 w-4" />
                          Past
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mavsumiy tendensiyalar</CardTitle>
              <CardDescription>Yil davomida daromad va sotuvlarning mavsumiy o'zgarishlari</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="mx-auto h-16 w-16 opacity-50" />
                    <p>Mavsumiy tendensiyalar diagrammasi</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sekin aylanadigan mahsulotlar</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{riskData.slowMoving}</div>
                    <p className="text-xs text-muted-foreground">Qiymati: {formatCurrency(riskData.slowMovingValue)}</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Past foydali mahsulotlar</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{riskData.lowMargin}</div>
                    <p className="text-xs text-muted-foreground">10% dan past foyda marjasi bilan</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yuqori konsentratsiya</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{riskData.highConcentration[0].category}</div>
                    <p className="text-xs text-muted-foreground">
                      Inventarning {riskData.highConcentration[0].percentage}% qismi
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Risk tahlili</CardTitle>
              <CardDescription>Inventar va moliyaviy risklarning batafsil tahlili</CardDescription>
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
                  <div>
                    <h3 className="font-medium flex items-center">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                      Yuqori konsentratsiya risklari
                    </h3>
                    <div className="mt-2 space-y-2">
                      {riskData.highConcentration.map((item) => (
                        <div key={item.category} className="flex justify-between text-sm">
                          <span>{item.category}</span>
                          <span>
                            {item.percentage}% ({formatCurrency(item.value)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium flex items-center">
                      <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                      Sekin aylanadigan mahsulotlar
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {riskData.slowMoving} ta mahsulot 90 kundan ortiq sotilmagan, umumiy qiymati{" "}
                      {formatCurrency(riskData.slowMovingValue)}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium flex items-center">
                      <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                      Past foydali mahsulotlar
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {riskData.lowMargin} ta mahsulot 10% dan past foyda marjasi bilan sotilmoqda
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Tahlil xulosalari</CardTitle>
          <CardDescription>Biznes samaradorligini oshirish uchun tavsiyalar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="mt-0.5">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-900">Foyda oshirish imkoniyati</h4>
                <p className="text-sm text-green-700 mt-1">
                  Uzuk kategoriyasidagi mahsulotlar eng yuqori foyda marjasiga ega. Bu kategoriyaga ko'proq e'tibor
                  qaratish va inventarni ko'paytirish tavsiya etiladi.
                </p>
                <Button variant="link" size="sm" className="mt-2 text-green-700 p-0">
                  <span>Batafsil ko'rish</span>
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="mt-0.5">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-medium text-amber-900">Inventar riski</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Sekin aylanadigan mahsulotlar umumiy inventarning 12% qismini tashkil qiladi. Bu mahsulotlarni sotish
                  uchun maxsus aksiyalar o'tkazish tavsiya etiladi.
                </p>
                <Button variant="link" size="sm" className="mt-2 text-amber-700 p-0">
                  <span>Mahsulotlarni ko'rish</span>
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="mt-0.5">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Mavsumiy tavsiyalar</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Dekabr oyida sotuvlar eng yuqori darajaga yetadi. Bu oyga tayyorgarlik ko'rish va inventarni oldindan
                  to'ldirish tavsiya etiladi.
                </p>
                <Button variant="link" size="sm" className="mt-2 text-blue-700 p-0">
                  <span>Mavsumiy tahlilni ko'rish</span>
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

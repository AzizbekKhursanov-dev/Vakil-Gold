"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { InventoryOverview } from "./inventory-overview"
import { RevenueChart } from "./revenue-chart"
import { RecentTransactions } from "./recent-transactions"
import { useItems } from "@/lib/hooks/use-items"
import { useBranches } from "@/lib/hooks/use-branches"
import { useAuth } from "@/lib/hooks/use-auth"
import { formatCurrency } from "@/lib/utils/currency"
import {
  Package,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  Clock,
  Target,
  Zap,
  PieChart,
  BarChart3,
  Calendar,
  FileText,
  Plus,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

interface DashboardMetrics {
  totalItems: number
  availableItems: number
  soldItems: number
  returnedItems: number
  returnedToSupplierItems: number
  reservedItems: number
  transferredItems: number
  totalInventoryValue: number
  totalRevenue: number
  totalProfit: number
  profitMargin: number
  unpaidValue: number
  partiallyPaidValue: number
  lowStockItems: number
  totalWeight: number
  averageItemValue: number
  topCategory: string
  topBranch: string
  monthlyGrowth: number
  weeklyGrowth: number
}

export function Dashboard() {
  const { user } = useAuth()
  const {
    items,
    loading: itemsLoading,
    error: itemsError,
    refreshItems,
  } = useItems({
    realtime: true,
  })
  const {
    branches,
    loading: branchesLoading,
    error: branchesError,
  } = useBranches({
    realtime: true,
  })

  // Calculate comprehensive dashboard metrics
  const metrics = useMemo((): DashboardMetrics => {
    if (!items.length) {
      return {
        totalItems: 0,
        availableItems: 0,
        soldItems: 0,
        returnedItems: 0,
        returnedToSupplierItems: 0,
        reservedItems: 0,
        transferredItems: 0,
        totalInventoryValue: 0,
        totalRevenue: 0,
        totalProfit: 0,
        profitMargin: 0,
        unpaidValue: 0,
        partiallyPaidValue: 0,
        lowStockItems: 0,
        totalWeight: 0,
        averageItemValue: 0,
        topCategory: "N/A",
        topBranch: "N/A",
        monthlyGrowth: 0,
        weeklyGrowth: 0,
      }
    }

    const availableItems = items.filter((item) => item.status === "available")
    const soldItems = items.filter((item) => item.status === "sold")
    const returnedItems = items.filter((item) => item.status === "returned")
    const returnedToSupplierItems = items.filter((item) => item.status === "returned_to_supplier")
    const reservedItems = items.filter((item) => item.status === "reserved")
    const transferredItems = items.filter((item) => item.status === "transferred")

    // Financial calculations
    const totalInventoryValue = availableItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0)
    const totalRevenue = soldItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0)

    const totalCost = soldItems.reduce((sum, item) => {
      const materialCost = item.weight * item.quantity * (item.payedLomNarxi || item.lomNarxi)
      const laborCost = item.weight * item.quantity * item.laborCost
      return sum + materialCost + laborCost
    }, 0)

    const totalProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    // Payment tracking
    const unpaidItems = items.filter((item) => item.paymentStatus === "unpaid")
    const partiallyPaidItems = items.filter((item) => item.paymentStatus === "partially_paid")
    const unpaidValue = unpaidItems.reduce((sum, item) => sum + item.weight * item.quantity * item.lomNarxi, 0)
    const partiallyPaidValue = partiallyPaidItems.reduce(
      (sum, item) => sum + item.weight * item.quantity * item.lomNarxi,
      0,
    )

    // Inventory analysis
    const lowStockItems = availableItems.filter((item) => item.quantity <= 5).length
    const totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0)
    const averageItemValue = items.length > 0 ? totalInventoryValue / availableItems.length : 0

    // Category analysis
    const categoryCount = items.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    const topCategory = Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"

    // Branch analysis
    const branchCount = items.reduce(
      (acc, item) => {
        const branchName = item.isProvider ? "Markaz" : branches.find((b) => b.id === item.branch)?.name || "Noma'lum"
        acc[branchName] = (acc[branchName] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    const topBranch = Object.entries(branchCount).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"

    // Growth calculations (mock data for now)
    const monthlyGrowth = 12.5
    const weeklyGrowth = 3.2

    return {
      totalItems: items.length,
      availableItems: availableItems.length,
      soldItems: soldItems.length,
      returnedItems: returnedItems.length,
      returnedToSupplierItems: returnedToSupplierItems.length,
      reservedItems: reservedItems.length,
      transferredItems: transferredItems.length,
      totalInventoryValue,
      totalRevenue,
      totalProfit,
      profitMargin,
      unpaidValue,
      partiallyPaidValue,
      lowStockItems,
      totalWeight,
      averageItemValue,
      topCategory,
      topBranch,
      monthlyGrowth,
      weeklyGrowth,
    }
  }, [items, branches])

  const isLoading = itemsLoading || branchesLoading
  const hasError = itemsError || branchesError
  const activeBranches = branches.filter((branch) => !branch.isProvider).length

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Boshqaruv paneli</h1>
          <Button
            onClick={() => {
              refreshItems()
            }}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Qayta yuklash
          </Button>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive mb-2">Ma'lumotlarni yuklashda xatolik: {itemsError || branchesError}</p>
              <Button
                onClick={() => {
                  refreshItems()
                }}
              >
                Qayta urinish
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Boshqaruv paneli</h1>
          <p className="text-muted-foreground">
            Xush kelibsiz, {user?.name}! Bu yerda biznesingizning umumiy ko'rinishi.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshItems} variant="outline" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Yangilash
          </Button>
          <Button asChild>
            <Link href="/items/add">
              <Plus className="mr-2 h-4 w-4" />
              Mahsulot qo'shish
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami mahsulotlar</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.totalItems.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.availableItems} mavjud, {metrics.soldItems} sotilgan
                </p>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />+{metrics.weeklyGrowth}% bu hafta
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventar qiymati</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(metrics.totalInventoryValue)}</div>
                <p className="text-xs text-muted-foreground">Mavjud mahsulotlar qiymati</p>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />+{metrics.monthlyGrowth}% bu oy
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami daromad</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Foyda: {formatCurrency(metrics.totalProfit)} ({metrics.profitMargin.toFixed(1)}%)
                </p>
                <Progress value={metrics.profitMargin} className="mt-2 h-1" />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faol filiallar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeBranches}</div>
                <p className="text-xs text-muted-foreground">Jami {branches.length} filial</p>
                <p className="text-xs text-blue-600 mt-1">Eng faol: {metrics.topBranch}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Low Stock Alert */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Kam qolgan mahsulotlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{metrics.lowStockItems}</div>
            <p className="text-xs text-orange-700">5 dan kam qolgan</p>
          </CardContent>
        </Card>

        {/* Unpaid Items */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              To'lanmagan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{formatCurrency(metrics.unpaidValue)}</div>
            <p className="text-xs text-red-700">Ta'minotchilarga qarzi</p>
          </CardContent>
        </Card>

        {/* Reserved Items */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Bron qilingan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{metrics.reservedItems}</div>
            <p className="text-xs text-blue-700">Mijozlar uchun</p>
          </CardContent>
        </Card>

        {/* Top Category */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Eng mashhur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-900">{metrics.topCategory}</div>
            <p className="text-xs text-green-700">Kategoriya bo'yicha</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Tezkor amallar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/items/add">
                <Plus className="h-4 w-4 mr-2" />
                Mahsulot qo'shish
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/items/bulk-import">
                <FileText className="h-4 w-4 mr-2" />
                Ko'p mahsulot yuklash
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/items">
                <Eye className="h-4 w-4 mr-2" />
                Barcha mahsulotlar
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/profit-analysis">
                <BarChart3 className="h-4 w-4 mr-2" />
                Foyda tahlili
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Umumiy ko'rinish</TabsTrigger>
          <TabsTrigger value="analytics">Tahlil</TabsTrigger>
          <TabsTrigger value="transactions">Tranzaksiyalar</TabsTrigger>
          <TabsTrigger value="reports">Hisobotlar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Daromad grafigi</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <RevenueChart />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Inventar ko'rinishi</CardTitle>
              </CardHeader>
              <CardContent>
                <InventoryOverview />
              </CardContent>
            </Card>
          </div>

          {/* Status Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mahsulot holatlari</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mavjud</span>
                  <Badge variant="secondary">{metrics.availableItems}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sotilgan</span>
                  <Badge variant="default">{metrics.soldItems}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Qaytarilgan</span>
                  <Badge variant="destructive">{metrics.returnedItems}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bron qilingan</span>
                  <Badge variant="outline">{metrics.reservedItems}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ta'minotchiga qaytarilgan</span>
                  <Badge variant="secondary">{metrics.returnedToSupplierItems}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">To'lov holatlari</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">To'lanmagan</span>
                  <span className="text-sm font-medium text-red-600">{formatCurrency(metrics.unpaidValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Qisman to'langan</span>
                  <span className="text-sm font-medium text-orange-600">
                    {formatCurrency(metrics.partiallyPaidValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Jami qarzi</span>
                  <span className="text-sm font-bold text-red-700">
                    {formatCurrency(metrics.unpaidValue + metrics.partiallyPaidValue)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Inventar ma'lumotlari</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Jami og'irlik</span>
                  <span className="text-sm font-medium">{metrics.totalWeight.toFixed(2)} gr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">O'rtacha qiymat</span>
                  <span className="text-sm font-medium">{formatCurrency(metrics.averageItemValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Eng mashhur</span>
                  <span className="text-sm font-medium">{metrics.topCategory}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Kategoriya bo'yicha taqsimot</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(
                      items.reduce(
                        (acc, item) => {
                          acc[item.category] = (acc[item.category] || 0) + 1
                          return acc
                        },
                        {} as Record<string, number>,
                      ),
                    ).map(([category, count]) => (
                      <div key={category} className="flex justify-between">
                        <span>{category}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Filial bo'yicha taqsimot</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(
                      items.reduce(
                        (acc, item) => {
                          const branchName = item.isProvider
                            ? "Markaz"
                            : branches.find((b) => b.id === item.branch)?.name || "Noma'lum"
                          acc[branchName] = (acc[branchName] || 0) + 1
                          return acc
                        },
                        {} as Record<string, number>,
                      ),
                    ).map(([branchName, count]) => (
                      <div key={branchName} className="flex justify-between">
                        <span>{branchName}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>So'nggi tranzaksiyalar</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kunlik hisobot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Bugungi kun uchun to'liq hisobot</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/analytics">
                    <Calendar className="h-4 w-4 mr-2" />
                    Ko'rish
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Foyda tahlili</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Mahsulot va filial bo'yicha foyda</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/profit-analysis">
                    <PieChart className="h-4 w-4 mr-2" />
                    Tahlil qilish
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Oylik hisobot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Oylik daromad va xarajatlar</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/monthly-revenue">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ko'rish
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

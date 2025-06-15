"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { ProfitOverview } from "@/components/profit-analysis/profit-overview"
import { ProfitByBranch } from "@/components/profit-analysis/profit-by-branch"
import { ProfitByCategory } from "@/components/profit-analysis/profit-by-category"
import { ProfitTrends } from "@/components/profit-analysis/profit-trends"
import { ProfitFactors } from "@/components/profit-analysis/profit-factors"
import { ProfitItemsList } from "@/components/profit-analysis/profit-items-list"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import { exportProfitAnalysisToExcel } from "@/lib/utils/profit-excel"
import { FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, Calculator } from "lucide-react"
import type { Item } from "@/lib/types/item"
import type { DateRange } from "react-day-picker"
import { subDays, startOfMonth, endOfMonth } from "date-fns"

interface ProfitData {
  supposedProfit: number // Based on lomNarxi to lomNarxiKirim difference
  actualProfit: number // Based on actual selling prices and costs
  totalRevenue: number
  totalCost: number
  profitMargin: number
  itemCount: number
  averageProfit: number
  priceDifferenceImpact: number // Impact of payment price differences
}

export function ProfitAnalysis() {
  const { toast } = useToast()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [timePeriod, setTimePeriod] = useState("current_month")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [branchFilter, setBranchFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")

  // Fetch items from Firebase
  useEffect(() => {
    setLoading(true)

    try {
      const itemsQuery = query(collection(db, "items"), orderBy("createdAt", "desc"))
      const unsubscribe = onSnapshot(
        itemsQuery,
        (snapshot) => {
          const itemsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            paymentStatus: doc.data().paymentStatus || "unpaid",
          })) as Item[]
          setItems(itemsList)
          setLoading(false)
        },
        (error) => {
          console.error("Error fetching items:", error)
          setLoading(false)
          toast({
            title: "Xatolik",
            description: "Ma'lumotlarni yuklashda xatolik yuz berdi",
            variant: "destructive",
          })
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Error setting up listener:", error)
      setLoading(false)
    }
  }, [toast])

  // Set date range based on time period
  useEffect(() => {
    const now = new Date()
    switch (timePeriod) {
      case "last_7_days":
        setDateRange({ from: subDays(now, 7), to: now })
        break
      case "last_30_days":
        setDateRange({ from: subDays(now, 30), to: now })
        break
      case "current_month":
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) })
        break
      case "last_3_months":
        setDateRange({ from: subDays(now, 90), to: now })
        break
      case "current_year":
        setDateRange({ from: new Date(now.getFullYear(), 0, 1), to: now })
        break
      case "all_time":
        setDateRange(undefined)
        break
    }
  }, [timePeriod])

  // Filter items based on criteria
  const filteredItems = items.filter((item) => {
    // Date filter
    if (dateRange?.from && dateRange?.to) {
      const itemDate = item.paymentDate ? new Date(item.paymentDate) : new Date(item.purchaseDate)
      if (itemDate < dateRange.from || itemDate > dateRange.to) return false
    }

    // Branch filter
    if (branchFilter !== "all" && item.branch !== branchFilter) return false

    // Category filter
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false

    // Payment status filter
    if (paymentStatusFilter !== "all" && item.paymentStatus !== paymentStatusFilter) return false

    return true
  })

  // Update the profit calculation to be consistent with item management
  const profitData: ProfitData = filteredItems.reduce(
    (acc, item) => {
      // Supposed profit: difference between lomNarxiKirim and lomNarxi
      const supposedProfitPerGram = item.lomNarxiKirim - item.lomNarxi
      const supposedItemProfit = supposedProfitPerGram * item.weight

      // Actual profit: selling price minus all costs
      const materialCost = item.weight * (item.payedLomNarxi || item.lomNarxi)
      const laborTotal = item.weight * item.laborCost
      const actualCost = materialCost + laborTotal

      // Only count revenue for sold items
      const actualRevenue = item.status === "sold" ? item.sellingPrice * item.weight : 0
      const actualItemProfit = actualRevenue - actualCost

      // Price difference impact (difference between paid and recorded price)
      const priceDifferenceImpact = item.priceDifference ? item.priceDifference * item.weight : 0

      acc.supposedProfit += supposedItemProfit
      acc.actualProfit += actualItemProfit
      acc.totalRevenue += actualRevenue
      acc.totalCost += actualCost
      acc.itemCount += 1
      acc.priceDifferenceImpact += priceDifferenceImpact

      return acc
    },
    {
      supposedProfit: 0,
      actualProfit: 0,
      totalRevenue: 0,
      totalCost: 0,
      profitMargin: 0,
      itemCount: 0,
      averageProfit: 0,
      priceDifferenceImpact: 0,
    },
  )

  // Calculate derived metrics
  profitData.profitMargin = profitData.totalRevenue > 0 ? (profitData.actualProfit / profitData.totalRevenue) * 100 : 0
  profitData.averageProfit = profitData.itemCount > 0 ? profitData.actualProfit / profitData.itemCount : 0

  // Get unique branches and categories
  const branches = Array.from(new Set(items.map((item) => item.branch).filter(Boolean)))
  const categories = Array.from(new Set(items.map((item) => item.category)))

  const handleExportExcel = async () => {
    try {
      await exportProfitAnalysisToExcel({
        items: filteredItems,
        profitData,
        filters: {
          timePeriod,
          dateRange,
          branchFilter: branchFilter === "all" ? undefined : branchFilter,
          categoryFilter: categoryFilter === "all" ? undefined : categoryFilter,
          paymentStatusFilter: paymentStatusFilter === "all" ? undefined : paymentStatusFilter,
        },
      })

      toast({
        title: "Eksport muvaffaqiyatli",
        description: "Foyda tahlili Excel faylga eksport qilindi",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Eksport xatoligi",
        description: "Excel faylga eksport qilishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Foyda tahlili</span>
            <Button onClick={handleExportExcel} variant="outline" size="sm">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel eksport
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vaqt oralig'i</label>
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">So'nggi 7 kun</SelectItem>
                  <SelectItem value="last_30_days">So'nggi 30 kun</SelectItem>
                  <SelectItem value="current_month">Joriy oy</SelectItem>
                  <SelectItem value="last_3_months">So'nggi 3 oy</SelectItem>
                  <SelectItem value="current_year">Joriy yil</SelectItem>
                  <SelectItem value="all_time">Barcha vaqt</SelectItem>
                  <SelectItem value="custom">Maxsus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filial</label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kategoriya</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">To'lov holati</label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="paid">To'langan</SelectItem>
                  <SelectItem value="unpaid">To'lanmagan</SelectItem>
                  <SelectItem value="partially_paid">Qisman to'langan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {timePeriod === "custom" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Maxsus sana oralig'i</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nazariy Foyda</CardTitle>
            <Calculator className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(profitData.supposedProfit)}</div>
            <p className="text-xs text-muted-foreground">Lom narxi farqidan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Haqiqiy Foyda</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(profitData.actualProfit)}</div>
            <p className="text-xs text-muted-foreground">Sotishdan keyin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Foyda Marjasi</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{profitData.profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Daromaddan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Narx Farqi Ta'siri</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${profitData.priceDifferenceImpact >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(profitData.priceDifferenceImpact)}
            </div>
            <p className="text-xs text-muted-foreground">To'lov farqidan</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Umumiy</TabsTrigger>
          <TabsTrigger value="by-branch">Filiallar</TabsTrigger>
          <TabsTrigger value="by-category">Kategoriyalar</TabsTrigger>
          <TabsTrigger value="trends">Tendensiyalar</TabsTrigger>
          <TabsTrigger value="factors">Omillar</TabsTrigger>
          <TabsTrigger value="items">Mahsulotlar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ProfitOverview profitData={profitData} items={filteredItems} />
        </TabsContent>

        <TabsContent value="by-branch" className="space-y-4">
          <ProfitByBranch items={filteredItems} />
        </TabsContent>

        <TabsContent value="by-category" className="space-y-4">
          <ProfitByCategory items={filteredItems} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <ProfitTrends items={filteredItems} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="factors" className="space-y-4">
          <ProfitFactors items={filteredItems} profitData={profitData} />
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <ProfitItemsList items={filteredItems} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

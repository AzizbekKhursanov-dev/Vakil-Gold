"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, Calendar, TrendingUp, DollarSign, Target, BarChart3 } from "lucide-react"
import { MonthlyRevenueChart } from "@/components/monthly-revenue/monthly-revenue-chart"
import { MonthlyComparison } from "@/components/monthly-revenue/monthly-comparison"
import { BranchPerformance } from "@/components/monthly-revenue/branch-performance"
import { RevenueTargets } from "@/components/monthly-revenue/revenue-targets"
import { formatCurrency } from "@/lib/utils/currency"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"

export function MonthlyRevenue() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  // Mock data - in real app this would come from Firebase
  const currentMonthData = {
    totalRevenue: 125000000,
    totalProfit: 31250000,
    profitMargin: 25,
    itemsSold: 156,
    averageOrderValue: 801282,
    growthRate: 12.5,
    target: 150000000,
    targetAchievement: 83.3,
  }

  const months = [
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

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const handleExportReport = async () => {
    try {
      // Prepare monthly data
      const monthlyData = [
        {
          "Ko'rsatkich": "Jami daromad",
          "Qiymat (so'm)": currentMonthData.totalRevenue,
          "O'sish (%)": currentMonthData.growthRate,
        },
        {
          "Ko'rsatkich": "Jami foyda",
          "Qiymat (so'm)": currentMonthData.totalProfit,
          "O'sish (%)": currentMonthData.profitMargin,
        },
        {
          "Ko'rsatkich": "Sotilgan mahsulotlar",
          "Qiymat (so'm)": currentMonthData.itemsSold,
          "O'sish (%)": "—",
        },
        {
          "Ko'rsatkich": "O'rtacha buyurtma qiymati",
          "Qiymat (so'm)": currentMonthData.averageOrderValue,
          "O'sish (%)": "—",
        },
        {
          "Ko'rsatkich": "Maqsad bajarilishi",
          "Qiymat (so'm)": currentMonthData.targetAchievement,
          "O'sish (%)": "—",
        },
      ]

      // Create workbook
      const XLSX = await import("xlsx")
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(monthlyData)

      ws["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, ws, "Oylik hisobot")

      // Add summary
      const summaryData = [
        ["Oylik daromad hisoboti", ""],
        ["", ""],
        ["Hisobot oyi", `${months[selectedMonth - 1]} ${selectedYear}`],
        ["Hisobot sanasi", format(new Date(), "dd/MM/yyyy HH:mm")],
        ["", ""],
        ["Asosiy ko'rsatkichlar", ""],
        ["Jami daromad", formatCurrency(currentMonthData.totalRevenue)],
        ["Jami foyda", formatCurrency(currentMonthData.totalProfit)],
        ["Foyda marjasi", `${currentMonthData.profitMargin}%`],
        ["Sotilgan mahsulotlar", currentMonthData.itemsSold],
        ["O'rtacha buyurtma qiymati", formatCurrency(currentMonthData.averageOrderValue)],
        ["O'sish sur'ati", `${currentMonthData.growthRate}%`],
        ["Maqsad", formatCurrency(currentMonthData.target)],
        ["Maqsad bajarilishi", `${currentMonthData.targetAchievement}%`],
      ]

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
      summaryWs["!cols"] = [{ wch: 25 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, summaryWs, "Xulosa")

      // Download
      const filename = `oylik-hisobot-${selectedYear}-${selectedMonth.toString().padStart(2, "0")}.xlsx`
      XLSX.writeFile(wb, filename)

      toast({
        title: "Hisobot eksport qilindi",
        description: "Oylik daromad hisoboti muvaffaqiyatli eksport qilindi",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Eksport xatosi",
        description: "Hisobotni eksport qilishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number(value))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExportReport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Hisobotni eksport qilish
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami daromad</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">+{currentMonthData.growthRate}% o'tgan oyga nisbatan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami foyda</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthData.totalProfit)}</div>
            <p className="text-xs text-muted-foreground">{currentMonthData.profitMargin}% foyda marjasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sotilgan mahsulotlar</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthData.itemsSold}</div>
            <p className="text-xs text-muted-foreground">
              O'rtacha: {formatCurrency(currentMonthData.averageOrderValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maqsad bajarilishi</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthData.targetAchievement}%</div>
            <p className="text-xs text-muted-foreground">Maqsad: {formatCurrency(currentMonthData.target)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Umumiy ko'rinish</TabsTrigger>
          <TabsTrigger value="comparison">Taqqoslash</TabsTrigger>
          <TabsTrigger value="branches">Filiallar</TabsTrigger>
          <TabsTrigger value="targets">Maqsadlar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <MonthlyRevenueChart year={selectedYear} month={selectedMonth} />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <MonthlyComparison year={selectedYear} />
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <BranchPerformance year={selectedYear} month={selectedMonth} />
        </TabsContent>

        <TabsContent value="targets" className="space-y-4">
          <RevenueTargets year={selectedYear} month={selectedMonth} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

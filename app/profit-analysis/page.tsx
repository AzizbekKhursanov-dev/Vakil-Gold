"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { AppLayout } from "@/components/layout/app-layout"
import { ProfitAnalysis } from "@/components/profit-analysis/profit-analysis"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBranchContext } from "@/lib/contexts/branch-context"
import { formatCurrency } from "@/lib/utils/currency"
import { TrendingUp, TrendingDown, BarChart3, PieChart, Download } from "lucide-react"
import { useBranch } from "@/lib/contexts/branch-context"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/config/firebase"

interface ProfitData {
  id: string
  period: string
  branch: string
  category: string
  revenue: number
  cost: number
  profit: number
  margin: number
  itemsSold: number
  createdAt: string
}

export default function ProfitAnalysisPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { selectedBranch, branchName } = useBranchContext()
  const [timePeriod, setTimePeriod] = useState("month")
  const [category, setCategory] = useState("")
  const [profitData, setProfitData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { selectedBranch: selectedBranchNew } = useBranch()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchProfitData = async () => {
      setLoading(true)
      try {
        let profitQuery

        if (selectedBranchNew) {
          // If a branch is selected, filter profit data by branch
          profitQuery = query(collection(db, "profitAnalysis"), where("branchId", "==", selectedBranchNew.id))
        } else {
          // Otherwise, get all profit data
          profitQuery = collection(db, "profitAnalysis")
        }

        const profitSnapshot = await getDocs(profitQuery)
        const profitList = profitSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setProfitData(profitList)
      } catch (error) {
        console.error("Error fetching profit data:", error)
        setError(error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfitData()
  }, [selectedBranchNew])

  const filters = {
    ...(selectedBranch && { branch: selectedBranch }),
    ...(category && { category }),
    period: timePeriod,
  }

  // Calculate totals and averages
  const totals = profitData.reduce(
    (acc, data) => ({
      revenue: acc.revenue + data.revenue,
      cost: acc.cost + data.cost,
      profit: acc.profit + data.profit,
      itemsSold: acc.itemsSold + data.itemsSold,
    }),
    { revenue: 0, cost: 0, profit: 0, itemsSold: 0 },
  )

  const averageMargin =
    profitData.length > 0 ? profitData.reduce((sum, data) => sum + data.margin, 0) / profitData.length : 0
  const profitGrowth = 12.5 // Mock data - would be calculated from historical data

  const handleExport = () => {
    const csvContent = [
      ["Davr", "Filial", "Kategoriya", "Daromad", "Xarajat", "Foyda", "Margin", "Sotilgan"].join(","),
      ...profitData.map((data) => [
        data.period,
        data.branch,
        data.category,
        data.revenue,
        data.cost,
        data.profit,
        data.margin,
        data.itemsSold,
      ]),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `foyda-tahlili-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
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
    return null
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Foyda tahlili</h1>
            <p className="text-muted-foreground">
              {branchName ? `${branchName} filiali` : "Barcha filiallar"} foyda va zarar tahlili
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Eksport
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Tahlil parametrlari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Davr" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Kunlik</SelectItem>
                  <SelectItem value="week">Haftalik</SelectItem>
                  <SelectItem value="month">Oylik</SelectItem>
                  <SelectItem value="quarter">Choraklik</SelectItem>
                  <SelectItem value="year">Yillik</SelectItem>
                </SelectContent>
              </Select>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Kategoriya" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="barchasi">Barchasi</SelectItem>
                  <SelectItem value="Uzuk">Uzuk</SelectItem>
                  <SelectItem value="Sirg'a">Sirg'a</SelectItem>
                  <SelectItem value="Bilakuzuk">Bilakuzuk</SelectItem>
                  <SelectItem value="Zanjir">Zanjir</SelectItem>
                  <SelectItem value="Boshqa">Boshqa</SelectItem>
                </SelectContent>
              </Select>

              {category && (
                <Button onClick={() => setCategory("")} variant="outline" size="sm">
                  Tozalash
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami foyda</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.profit)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{profitGrowth}%</span> o'sish
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">O'rtacha margin</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{averageMargin.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Rentabellik darajasi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami xarajat</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.cost)}</div>
              <p className="text-xs text-muted-foreground">Ishlab chiqarish xarajati</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Samaradorlik</CardTitle>
              <PieChart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {totals.itemsSold > 0 ? Math.round(totals.profit / totals.itemsSold) : 0}K
              </div>
              <p className="text-xs text-muted-foreground">Mahsulot uchun foyda</p>
            </CardContent>
          </Card>
        </div>

        {/* Profit Analysis Component */}
        <ProfitAnalysis data={profitData} loading={loading} error={error} />
      </div>
    </AppLayout>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Package, TrendingUp, DollarSign, Calendar, Users, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BranchForm } from "@/components/branches/branch-form"
import { BranchTransactionsList } from "@/components/branches/branch-transactions-list"
import { BranchFinancials } from "@/components/branches/branch-financials"
import { branchService } from "@/lib/services/branch.service"
import { formatCurrency } from "@/lib/utils/currency"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import type { Branch } from "@/lib/types/branch"
import { EnhancedBranchInventory } from "@/components/branches/enhanced-branch-inventory"
import { BranchSalesTargets } from "@/components/branches/branch-sales-targets"
import { BranchPerformanceDashboard } from "@/components/branches/branch-performance-dashboard"
import { BranchExpenseManagement } from "@/components/branches/branch-expense-management"

interface BranchDetailsProps {
  branchId: string
  defaultTab?: string
}

interface DetailedStats {
  itemCount: number
  totalValue: number
  monthlyRevenue: number
  availableItems: number
  soldItems: number
  reservedItems: number
  totalWeight: number
  transactionCount: number
  totalProfit: number
  profitMargin: number
  averageItemValue: number
  categoryBreakdown: Record<string, number>
  topCategory: string
}

export function BranchDetails({ branchId, defaultTab = "items" }: BranchDetailsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [branch, setBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DetailedStats>({
    itemCount: 0,
    totalValue: 0,
    monthlyRevenue: 0,
    availableItems: 0,
    soldItems: 0,
    reservedItems: 0,
    totalWeight: 0,
    transactionCount: 0,
    totalProfit: 0,
    profitMargin: 0,
    averageItemValue: 0,
    categoryBreakdown: {},
    topCategory: "N/A",
  })
  const { toast } = useToast()

  useEffect(() => {
    const fetchBranchData = async () => {
      try {
        setLoading(true)

        // Fetch branch details
        const branchData = await branchService.getBranch(branchId)
        if (!branchData) {
          toast({
            title: "Xatolik",
            description: "Filial topilmadi",
            variant: "destructive",
          })
          return
        }
        setBranch(branchData)

        // Fetch branch items for comprehensive statistics
        const items = await branchService.getBranchItems(branchId)

        // Fetch branch transactions
        const transactions = await branchService.getBranchTransactions(branchId)

        // Calculate detailed statistics
        const availableItems = items.filter((item) => item.status === "available").length
        const soldItems = items.filter((item) => item.status === "sold").length
        const reservedItems = items.filter((item) => item.status === "reserved").length

        const totalValue = items
          .filter((item) => item.status === "available")
          .reduce((sum, item) => sum + (item.sellingPrice || 0) * (item.quantity || 1), 0)

        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0) * (item.quantity || 1), 0)

        // Calculate monthly revenue (items sold this month)
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const monthlyRevenue = items
          .filter((item) => {
            if (item.status !== "sold" || !item.soldDate) return false
            const soldDate = new Date(item.soldDate)
            return soldDate.getMonth() === currentMonth && soldDate.getFullYear() === currentYear
          })
          .reduce((sum, item) => sum + (item.sellingPrice || 0) * (item.quantity || 1), 0)

        // Calculate total profit from sold items
        const soldItemsWithProfit = items.filter((item) => item.status === "sold")
        const totalProfit = soldItemsWithProfit.reduce((sum, item) => {
          const profit = (item.sellingPrice || 0) - (item.costPrice || 0)
          return sum + profit * (item.quantity || 1)
        }, 0)

        const soldValue = soldItemsWithProfit.reduce(
          (sum, item) => sum + (item.sellingPrice || 0) * (item.quantity || 1),
          0,
        )
        const profitMargin = soldValue > 0 ? (totalProfit / soldValue) * 100 : 0

        // Calculate average item value
        const averageItemValue = items.length > 0 ? totalValue / items.length : 0

        // Calculate category breakdown
        const categoryBreakdown: Record<string, number> = {}
        items.forEach((item) => {
          if (item.category) {
            categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1
          }
        })

        // Find top category
        const topCategory = Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"

        setStats({
          itemCount: items.length,
          totalValue,
          monthlyRevenue,
          availableItems,
          soldItems,
          reservedItems,
          totalWeight,
          transactionCount: transactions.length,
          totalProfit,
          profitMargin,
          averageItemValue,
          categoryBreakdown,
          topCategory,
        })

        // Update branch stats in database
        await branchService.updateBranchStats(branchId, {
          itemCount: items.length,
          totalValue,
          monthlyRevenue,
        })
      } catch (error) {
        console.error("Error fetching branch data:", error)
        toast({
          title: "Xatolik",
          description: "Filial ma'lumotlarini yuklashda xatolik yuz berdi",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBranchData()
  }, [branchId, toast])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href="/branches">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Filiallarga qaytish
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Filial topilmadi</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/branches">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Filiallarga qaytish
            </Button>
          </Link>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Filialni tahrirlash
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Filialni tahrirlash</DialogTitle>
            </DialogHeader>
            <BranchForm
              branch={branch}
              onSuccess={() => {
                setIsDialogOpen(false)
                // Refresh branch data
                window.location.reload()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{branch.name}</h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {branch.location} • Menejer: {branch.manager}
          {branch.isProvider && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Ta'minotchi</span>
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami mahsulotlar</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itemCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.availableItems} mavjud, {stats.soldItems} sotilgan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami qiymat</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">Mavjud mahsulotlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oylik daromad</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Joriy oy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami og'irlik</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWeight.toFixed(2)}g</div>
            <p className="text-xs text-muted-foreground">Barcha mahsulotlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tranzaksiyalar</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactionCount}</div>
            <p className="text-xs text-muted-foreground">Jami operatsiyalar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Foyda foizi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.totalProfit)} foyda</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="items">Mahsulotlar</TabsTrigger>
          <TabsTrigger value="transactions">Tranzaksiyalar</TabsTrigger>
          <TabsTrigger value="financials">Moliyaviy</TabsTrigger>
          <TabsTrigger value="analytics">Tahlil</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <EnhancedBranchInventory branchId={branchId} branchName={branch.name} />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <BranchTransactionsList branchId={branchId} />
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          <div className="space-y-6">
            <BranchFinancials branchId={branchId} />
            <BranchExpenseManagement branchId={branchId} branchName={branch.name} />
            <BranchSalesTargets branchId={branchId} branchName={branch.name} />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <BranchPerformanceDashboard branchId={branchId} branchName={branch.name} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils/currency"
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  Lightbulb,
  ArrowRight,
  ShoppingBag,
  DollarSign,
  Percent,
  Tag,
} from "lucide-react"

interface SmartRecommendationsProps {
  items?: any[]
  transactions?: any[]
  branches?: any[]
  compact?: boolean
}

export function SmartRecommendations({
  items = [],
  transactions = [],
  branches = [],
  compact = false,
}: SmartRecommendationsProps) {
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<any[]>([])

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      if (items.length > 0 || transactions.length > 0) {
        generateRecommendations()
      }
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [items, transactions, branches])

  const generateRecommendations = () => {
    const generatedRecommendations = []

    // Only generate recommendations if we have data
    if (items.length === 0 && transactions.length === 0) {
      return
    }

    // 1. Low stock recommendations
    const lowStockItems = items.filter((item) => item.status === "available" && item.quantity <= 3)

    if (lowStockItems.length > 0) {
      generatedRecommendations.push({
        id: "low-stock",
        type: "warning",
        title: "Kam qolgan mahsulotlar",
        description: `${lowStockItems.length} ta mahsulot kam qolgan. Yangi mahsulot buyurtma qilish vaqti keldi.`,
        icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
        priority: 1,
        action: "Inventarni ko'rish",
        actionLink: "/items",
        items: lowStockItems.slice(0, 3),
      })
    }

    // 2. Best selling categories
    if (transactions.length > 0) {
      const categorySales: Record<string, number> = {}

      transactions.forEach((transaction) => {
        if (transaction.type === "sale" && transaction.items) {
          transaction.items.forEach((item: any) => {
            if (item.category) {
              categorySales[item.category] = (categorySales[item.category] || 0) + 1
            }
          })
        }
      })

      const sortedCategories = Object.entries(categorySales)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)

      if (sortedCategories.length > 0) {
        generatedRecommendations.push({
          id: "best-selling",
          type: "insight",
          title: "Eng ko'p sotilgan kategoriyalar",
          description: `${sortedCategories[0][0]} eng ko'p sotilgan kategoriya. Bu kategoriyaga ko'proq e'tibor qarating.`,
          icon: <TrendingUp className="h-5 w-5 text-green-500" />,
          priority: 2,
          action: "Tahlilni ko'rish",
          actionLink: "/analytics-dashboard?tab=profit",
          categories: sortedCategories.map(([category, count]) => ({
            name: category,
            count,
          })),
        })
      }
    }

    // 3. Pricing recommendations
    const highMarginItems = items.filter((item) => item.profitPercentage > 30 && item.status === "available")

    if (highMarginItems.length > 0) {
      generatedRecommendations.push({
        id: "pricing",
        type: "opportunity",
        title: "Narxlash imkoniyatlari",
        description: `${highMarginItems.length} ta mahsulotning foyda marjasi yuqori. Raqobatbardosh narxlarni o'rnatish mumkin.`,
        icon: <Percent className="h-5 w-5 text-blue-500" />,
        priority: 3,
        action: "Mahsulotlarni ko'rish",
        actionLink: "/items",
        items: highMarginItems.slice(0, 3),
      })
    }

    // 4. Branch performance insights
    if (branches.length > 1 && transactions.length > 0) {
      const branchPerformance: Record<string, { sales: number; count: number }> = {}

      transactions.forEach((transaction) => {
        if (transaction.type === "sale" && transaction.branchId) {
          if (!branchPerformance[transaction.branchId]) {
            branchPerformance[transaction.branchId] = { sales: 0, count: 0 }
          }
          branchPerformance[transaction.branchId].sales += transaction.amount || 0
          branchPerformance[transaction.branchId].count += 1
        }
      })

      const branchEntries = Object.entries(branchPerformance)
      if (branchEntries.length > 1) {
        const sortedBranches = branchEntries.sort(([, a], [, b]) => b.sales - a.sales)

        const topBranch = sortedBranches[0]
        const bottomBranch = sortedBranches[sortedBranches.length - 1]

        const topBranchData = branches.find((b) => b.id === topBranch[0])
        const bottomBranchData = branches.find((b) => b.id === bottomBranch[0])

        if (topBranchData && bottomBranchData) {
          generatedRecommendations.push({
            id: "branch-performance",
            type: "insight",
            title: "Filiallar samaradorligi",
            description: `${topBranchData.name} eng yuqori savdo ko'rsatkichlariga ega. ${bottomBranchData.name} filialining samaradorligini oshirish uchun choralar ko'ring.`,
            icon: <BarChart3 className="h-5 w-5 text-purple-500" />,
            priority: 4,
            action: "Filiallarni ko'rish",
            actionLink: "/branches",
            branches: [
              { name: topBranchData.name, performance: "high", sales: topBranch[1].sales },
              { name: bottomBranchData.name, performance: "low", sales: bottomBranch[1].sales },
            ],
          })
        }
      }
    }

    // 5. Inventory optimization
    const slowMovingItems = items.filter((item) => {
      // Items that have been in inventory for more than 3 months without selling
      const createdAt = new Date(item.createdAt)
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      return item.status === "available" && createdAt < threeMonthsAgo
    })

    if (slowMovingItems.length > 0) {
      generatedRecommendations.push({
        id: "slow-moving",
        type: "action",
        title: "Sekin harakatlanuvchi inventar",
        description: `${slowMovingItems.length} ta mahsulot 3 oydan ortiq vaqt davomida sotilmagan. Chegirmalar yoki maxsus aksiyalar o'tkazishni o'ylab ko'ring.`,
        icon: <Tag className="h-5 w-5 text-orange-500" />,
        priority: 5,
        action: "Mahsulotlarni ko'rish",
        actionLink: "/items",
        items: slowMovingItems.slice(0, 3),
      })
    }

    // 6. Supplier payment reminders
    const unpaidItems = items.filter((item) => item.paymentStatus === "unpaid" && item.supplierName)

    if (unpaidItems.length > 0) {
      // Group by supplier
      const supplierUnpaid: Record<string, { count: number; total: number }> = {}

      unpaidItems.forEach((item) => {
        const supplier = item.supplierName || "Noma'lum"
        if (!supplierUnpaid[supplier]) {
          supplierUnpaid[supplier] = { count: 0, total: 0 }
        }
        supplierUnpaid[supplier].count += 1
        supplierUnpaid[supplier].total += item.lomNarxi * item.weight
      })

      const supplierEntries = Object.entries(supplierUnpaid)

      if (supplierEntries.length > 0) {
        generatedRecommendations.push({
          id: "supplier-payments",
          type: "reminder",
          title: "Ta'minotchilarga to'lovlar",
          description: `${unpaidItems.length} ta mahsulot uchun to'lovlar amalga oshirilmagan. Ta'minotchilar bilan munosabatlarni yaxshilash uchun to'lovlarni o'z vaqtida amalga oshiring.`,
          icon: <DollarSign className="h-5 w-5 text-red-500" />,
          priority: 6,
          action: "To'lovlarni ko'rish",
          actionLink: "/supplier-accounting",
          suppliers: supplierEntries
            .map(([name, data]) => ({
              name,
              count: data.count,
              total: data.total,
            }))
            .slice(0, 3),
        })
      }
    }

    // Sort recommendations by priority
    setRecommendations(generatedRecommendations.sort((a, b) => a.priority - b.priority))
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-amber-50 border-amber-200"
      case "insight":
        return "bg-green-50 border-green-200"
      case "opportunity":
        return "bg-blue-50 border-blue-200"
      case "action":
        return "bg-orange-50 border-orange-200"
      case "reminder":
        return "bg-red-50 border-red-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "warning":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Ogohlantirish</Badge>
      case "insight":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Tahlil</Badge>
      case "opportunity":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Imkoniyat</Badge>
      case "action":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Harakat</Badge>
      case "reminder":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Eslatma</Badge>
      default:
        return <Badge>Ma'lumot</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Hozircha tavsiyalar yo'q</h3>
          <p className="text-muted-foreground">
            Ko'proq ma'lumotlar to'plangandan so'ng, biznes samaradorligini oshirish uchun tavsiyalar paydo bo'ladi.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Aqlli tavsiyalar</h2>
            <p className="text-muted-foreground">Biznes samaradorligini oshirish uchun tavsiyalar va takliflar</p>
          </div>
        </div>
      )}

      {recommendations.map((recommendation) => (
        <Card key={recommendation.id} className={`${getTypeStyles(recommendation.type)}`}>
          <CardHeader className="pb-2 flex flex-row items-start justify-between">
            <div className="flex items-center gap-2">
              {recommendation.icon}
              <CardTitle className="text-base">{recommendation.title}</CardTitle>
            </div>
            {getTypeBadge(recommendation.type)}
          </CardHeader>
          <CardContent className="space-y-3">
            <p>{recommendation.description}</p>

            {/* Render different content based on recommendation type */}
            {recommendation.items && (
              <div className="space-y-2">
                {recommendation.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 bg-white rounded-md">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {item.model} ({item.category})
                      </span>
                    </div>
                    <div>
                      {item.quantity !== undefined && (
                        <Badge variant="outline" className="mr-2">
                          {item.quantity} dona
                        </Badge>
                      )}
                      {item.sellingPrice && <span className="font-medium">{formatCurrency(item.sellingPrice)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recommendation.categories && (
              <div className="space-y-2">
                {recommendation.categories.map((category: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 bg-white rounded-md">
                    <span>{category.name}</span>
                    <Badge variant="secondary">{category.count} ta sotilgan</Badge>
                  </div>
                ))}
              </div>
            )}

            {recommendation.branches && (
              <div className="space-y-2">
                {recommendation.branches.map((branch: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 bg-white rounded-md">
                    <span>{branch.name}</span>
                    <div className="flex items-center gap-2">
                      {branch.performance === "high" ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{formatCurrency(branch.sales)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recommendation.suppliers && (
              <div className="space-y-2">
                {recommendation.suppliers.map((supplier: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 bg-white rounded-md">
                    <span>{supplier.name}</span>
                    <div>
                      <Badge variant="outline" className="mr-2">
                        {supplier.count} ta mahsulot
                      </Badge>
                      <span className="font-medium">{formatCurrency(supplier.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={recommendation.actionLink}>
                  {recommendation.action}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

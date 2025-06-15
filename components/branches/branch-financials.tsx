"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils/currency"
import { Skeleton } from "@/components/ui/skeleton"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  subMonths,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
} from "date-fns"

interface BranchFinancialsProps {
  branchId: string
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

interface MonthlyData {
  month: string
  revenue: number
  profit: number
  items: number
  cost: number
}

interface CategoryData {
  category: string
  count: number
  value: number
  profit: number
}

interface DailyData {
  date: string
  revenue: number
  profit: number
  items: number
}

export function BranchFinancials({ branchId }: BranchFinancialsProps) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [dailyData, setDailyData] = useState<DailyData[]>([])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // Get all items related to this branch
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
          processFinancialData(branchItems)
          setLoading(false)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("Error fetching items:", error)
        setLoading(false)
      }
    }

    fetchItems()
  }, [branchId])

  const processFinancialData = (items: Item[]) => {
    // Process monthly data for the last 6 months
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    })

    const monthlyStats = months.map((month) => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)

      const monthItems = items.filter((item) => {
        if (item.status !== "sold" || !item.soldDate) return false
        const soldDate = new Date(item.soldDate)
        return soldDate >= monthStart && soldDate <= monthEnd
      })

      const revenue = monthItems.reduce((sum, item) => sum + item.sellingPrice, 0)
      const cost = monthItems.reduce((sum, item) => {
        const materialCost = item.weight * (item.isProvider ? item.lomNarxi : item.lomNarxiKirim)
        const laborCost = item.weight * item.laborCost
        return sum + materialCost + laborCost
      }, 0)
      const profit = revenue - cost

      return {
        month: format(month, "MMM yyyy"),
        revenue,
        profit,
        items: monthItems.length,
        cost,
      }
    })

    setMonthlyData(monthlyStats)

    // Process category data
    const categoryStats: Record<string, { count: number; value: number; profit: number }> = {}

    const soldItems = items.filter((item) => item.status === "sold")

    soldItems.forEach((item) => {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = { count: 0, value: 0, profit: 0 }
      }

      const materialCost = item.weight * (item.isProvider ? item.lomNarxi : item.lomNarxiKirim)
      const laborCost = item.weight * item.laborCost
      const totalCost = materialCost + laborCost
      const profit = item.sellingPrice - totalCost

      categoryStats[item.category].count += 1
      categoryStats[item.category].value += item.sellingPrice
      categoryStats[item.category].profit += profit
    })

    const categoryArray = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      ...stats,
    }))

    setCategoryData(categoryArray)

    // Process daily data for the last 30 days
    const days = eachDayOfInterval({
      start: subMonths(new Date(), 1),
      end: new Date(),
    })

    const dailyStats = days.map((day) => {
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)

      const dayItems = items.filter((item) => {
        if (item.status !== "sold" || !item.soldDate) return false
        const soldDate = new Date(item.soldDate)
        return soldDate >= dayStart && soldDate <= dayEnd
      })

      const revenue = dayItems.reduce((sum, item) => sum + item.sellingPrice, 0)
      const cost = dayItems.reduce((sum, item) => {
        const materialCost = item.weight * (item.isProvider ? item.lomNarxi : item.lomNarxiKirim)
        const laborCost = item.weight * item.laborCost
        return sum + materialCost + laborCost
      }, 0)
      const profit = revenue - cost

      return {
        date: format(day, "MMM dd"),
        revenue,
        profit,
        items: dayItems.length,
      }
    })

    setDailyData(dailyStats)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Daromad va Foyda</TabsTrigger>
          <TabsTrigger value="items">Sotilgan mahsulotlar</TabsTrigger>
          <TabsTrigger value="categories">Kategoriyalar</TabsTrigger>
          <TabsTrigger value="daily">Kunlik statistika</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Oylik daromad va foyda</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), ""]}
                    labelFormatter={(label) => `Oy: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="Daromad"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                    name="Foyda"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Oylik sotilgan mahsulotlar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`${value} ta`, "Mahsulotlar"]}
                    labelFormatter={(label) => `Oy: ${label}`}
                  />
                  <Bar dataKey="items" fill="#8884d8" name="Sotilgan mahsulotlar" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kategoriya bo'yicha sotuv</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryData}>
                  <XAxis dataKey="category" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip
                    formatter={(value: number, name) => [
                      name === "value" || name === "profit" ? formatCurrency(value) : `${value} ta`,
                      name === "value" ? "Qiymat" : name === "profit" ? "Foyda" : "Soni",
                    ]}
                    labelFormatter={(label) => `Kategoriya: ${label}`}
                  />
                  <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Soni" />
                  <Bar yAxisId="right" dataKey="value" fill="#82ca9d" name="Qiymat" />
                  <Bar yAxisId="right" dataKey="profit" fill="#ffc658" name="Foyda" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kunlik sotuv tendentsiyasi (so'nggi 30 kun)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), ""]}
                    labelFormatter={(label) => `Sana: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Daromad"
                    dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Foyda"
                    dot={{ fill: "#82ca9d", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

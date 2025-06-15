"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils/currency"
import { FileSpreadsheet, TrendingUp, TrendingDown, Package, DollarSign } from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import type { DateRange } from "react-day-picker"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface SupplierReportProps {
  dateRange: DateRange | undefined
  selectedBranch: string
  onExport: () => void
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export function SupplierReport({ dateRange, selectedBranch, onExport }: SupplierReportProps) {
  const [loading, setLoading] = useState(true)
  const [supplierData, setSupplierData] = useState<any[]>([])
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    totalReturned: 0,
    averageCost: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange?.from || !dateRange?.to) return

      setLoading(true)
      try {
        // Fetch items for supplier analysis
        let itemsQuery = query(
          collection(db, "items"),
          where("createdAt", ">=", dateRange.from.toISOString()),
          where("createdAt", "<=", dateRange.to.toISOString()),
        )

        if (selectedBranch !== "all") {
          itemsQuery = query(
            collection(db, "items"),
            where("branchId", "==", selectedBranch),
            where("createdAt", ">=", dateRange.from.toISOString()),
            where("createdAt", "<=", dateRange.to.toISOString()),
          )
        }

        const itemsSnapshot = await getDocs(itemsQuery)
        const items = itemsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Group items by supplier
        const supplierMap = items.reduce((acc: any, item) => {
          const supplier = item.supplierName || item.supplier || "Noma'lum"

          if (!acc[supplier]) {
            acc[supplier] = {
              name: supplier,
              totalItems: 0,
              totalCost: 0,
              paidItems: 0,
              paidAmount: 0,
              unpaidItems: 0,
              unpaidAmount: 0,
              returnedItems: 0,
              returnedAmount: 0,
            }
          }

          // Calculate item cost
          const materialCost = item.weight * item.lomNarxi
          const laborCost = item.weight * (item.laborCost || 0)
          const totalCost = materialCost + laborCost

          acc[supplier].totalItems += 1
          acc[supplier].totalCost += totalCost

          // Track payment status
          if (item.paymentStatus === "paid") {
            acc[supplier].paidItems += 1
            acc[supplier].paidAmount += totalCost
          } else if (item.paymentStatus === "unpaid") {
            acc[supplier].unpaidItems += 1
            acc[supplier].unpaidAmount += totalCost
          }

          // Track returned items
          if (item.status === "returned_to_supplier") {
            acc[supplier].returnedItems += 1
            acc[supplier].returnedAmount += totalCost
          }

          return acc
        }, {})

        const supplierList = Object.values(supplierMap)

        // Calculate averages and percentages
        supplierList.forEach((supplier: any) => {
          supplier.averageCost = supplier.totalItems > 0 ? supplier.totalCost / supplier.totalItems : 0
          supplier.paidPercentage = supplier.totalItems > 0 ? (supplier.paidItems / supplier.totalItems) * 100 : 0
          supplier.unpaidPercentage = supplier.totalItems > 0 ? (supplier.unpaidItems / supplier.totalItems) * 100 : 0
          supplier.returnedPercentage =
            supplier.totalItems > 0 ? (supplier.returnedItems / supplier.totalItems) * 100 : 0
        })

        // Sort by total cost
        supplierList.sort((a: any, b: any) => b.totalCost - a.totalCost)

        setSupplierData(supplierList)

        // Calculate summary
        const totalItems = items.length
        const totalPaid = items
          .filter((item) => item.paymentStatus === "paid")
          .reduce((sum, item) => {
            const materialCost = item.weight * item.lomNarxi
            const laborCost = item.weight * (item.laborCost || 0)
            return sum + materialCost + laborCost
          }, 0)
        const totalUnpaid = items
          .filter((item) => item.paymentStatus === "unpaid")
          .reduce((sum, item) => {
            const materialCost = item.weight * item.lomNarxi
            const laborCost = item.weight * (item.laborCost || 0)
            return sum + materialCost + laborCost
          }, 0)
        const totalReturned = items
          .filter((item) => item.status === "returned_to_supplier")
          .reduce((sum, item) => {
            const materialCost = item.weight * item.lomNarxi
            const laborCost = item.weight * (item.laborCost || 0)
            return sum + materialCost + laborCost
          }, 0)
        const averageCost = totalItems > 0 ? (totalPaid + totalUnpaid) / totalItems : 0

        setSummary({
          totalItems,
          totalPaid,
          totalUnpaid,
          totalReturned,
          averageCost,
        })
      } catch (error) {
        console.error("Error fetching supplier data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, selectedBranch])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Prepare chart data
  const chartData = supplierData.slice(0, 10).map((supplier) => ({
    name: supplier.name.length > 15 ? supplier.name.substring(0, 15) + "..." : supplier.name,
    totalCost: supplier.totalCost,
    paidAmount: supplier.paidAmount,
    unpaidAmount: supplier.unpaidAmount,
  }))

  const pieData = supplierData.slice(0, 6).map((supplier) => ({
    name: supplier.name,
    value: supplier.totalCost,
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami mahsulotlar</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalItems}</div>
            <p className="text-xs text-muted-foreground">O'rtacha qiymat: {formatCurrency(summary.averageCost)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To'langan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</div>
            <p className="text-xs text-muted-foreground">Ta'minotchilarga to'langan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To'lanmagan</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalUnpaid)}</div>
            <p className="text-xs text-muted-foreground">To'lanishi kerak</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qaytarilgan</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalReturned)}</div>
            <p className="text-xs text-muted-foreground">Ta'minotchiga qaytarilgan</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ta'minotchilar bo'yicha xarajatlar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="paidAmount" stackId="a" fill="#10B981" name="To'langan" />
                <Bar dataKey="unpaidAmount" stackId="a" fill="#EF4444" name="To'lanmagan" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ta'minotchilar ulushi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Details Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ta'minotchilar tafsiloti</CardTitle>
          <Button onClick={onExport} variant="outline" size="sm">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel eksport
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Ta'minotchi</th>
                  <th className="text-right p-2">Mahsulotlar</th>
                  <th className="text-right p-2">Jami qiymat</th>
                  <th className="text-right p-2">To'langan</th>
                  <th className="text-right p-2">To'lanmagan</th>
                  <th className="text-right p-2">Qaytarilgan</th>
                  <th className="text-center p-2">To'lov holati</th>
                </tr>
              </thead>
              <tbody>
                {supplierData.map((supplier, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{supplier.name}</td>
                    <td className="text-right p-2">{supplier.totalItems}</td>
                    <td className="text-right p-2 font-medium">{formatCurrency(supplier.totalCost)}</td>
                    <td className="text-right p-2 text-green-600">{formatCurrency(supplier.paidAmount)}</td>
                    <td className="text-right p-2 text-red-600">{formatCurrency(supplier.unpaidAmount)}</td>
                    <td className="text-right p-2 text-orange-600">{formatCurrency(supplier.returnedAmount)}</td>
                    <td className="text-center p-2">
                      <div className="space-y-1">
                        <Progress value={supplier.paidPercentage} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{supplier.paidPercentage.toFixed(0)}% to'langan</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Eng ko'p qarzli ta'minotchi</CardTitle>
          </CardHeader>
          <CardContent>
            {supplierData.length > 0 && (
              <div>
                <p className="font-medium">{supplierData.sort((a, b) => b.unpaidAmount - a.unpaidAmount)[0]?.name}</p>
                <p className="text-sm text-red-600">
                  {formatCurrency(supplierData.sort((a, b) => b.unpaidAmount - a.unpaidAmount)[0]?.unpaidAmount)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Eng yaxshi hamkor</CardTitle>
          </CardHeader>
          <CardContent>
            {supplierData.length > 0 && (
              <div>
                <p className="font-medium">{supplierData.sort((a, b) => b.totalCost - a.totalCost)[0]?.name}</p>
                <p className="text-sm text-blue-600">
                  {formatCurrency(supplierData.sort((a, b) => b.totalCost - a.totalCost)[0]?.totalCost)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Eng ko'p qaytarish</CardTitle>
          </CardHeader>
          <CardContent>
            {supplierData.length > 0 && (
              <div>
                <p className="font-medium">
                  {supplierData.sort((a, b) => b.returnedAmount - a.returnedAmount)[0]?.name}
                </p>
                <p className="text-sm text-orange-600">
                  {supplierData.sort((a, b) => b.returnedAmount - a.returnedAmount)[0]?.returnedItems} ta mahsulot
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

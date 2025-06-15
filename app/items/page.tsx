"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { AppLayout } from "@/components/layout/app-layout"
import { ItemsTable } from "@/components/items/items-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Upload, Download, Filter, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranch } from "@/lib/contexts/branch-context"
import { formatCurrency } from "@/lib/utils/currency"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { format, startOfDay, endOfDay } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import type { DateRange } from "react-day-picker"
import { exportItemsToExcel } from "@/lib/utils/excel"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/config/firebase"

interface Item {
  id: string
  name?: string
  model: string
  category: string
  weight: number
  price?: number
  sellingPrice: number
  lomNarxi: number
  lomNarxiKirim: number
  laborCost: number
  profitPercentage: number
  quantity: number
  status: string
  branch?: string
  branchId?: string
  branchName?: string
  isProvider?: boolean
  color?: string
  purity?: string
  stoneType?: string
  stoneWeight?: number
  manufacturer?: string
  notes?: string
  paymentStatus?: string
  supplierName?: string
  purchaseDate?: string
  distributedDate?: string
  soldDate?: string
  returnedDate?: string
  createdAt: string
  updatedAt: string
}

interface ItemFilters {
  search: string
  category: string
  status: string
  branch: string
  paymentStatus: string
  supplierName: string
  dateRange: DateRange | undefined
  dateField: string
}

const INITIAL_FILTERS: ItemFilters = {
  search: "",
  category: "all",
  status: "all",
  branch: "all",
  paymentStatus: "all",
  supplierName: "",
  dateRange: undefined,
  dateField: "createdAt",
}

export default function ItemsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { selectedBranch } = useBranch()
  const { toast } = useToast()

  // State management
  const [filters, setFilters] = useState<ItemFilters>(INITIAL_FILTERS)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem("items-page-filters")
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters)
        setFilters({ ...INITIAL_FILTERS, ...parsed })
      } catch (error) {
        console.warn("Failed to parse saved filters:", error)
      }
    }
  }, [])

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem("items-page-filters", JSON.stringify(filters))
  }, [filters])

  // Firebase data fetching with optimization
  useEffect(() => {
    if (!user) return

    let unsubscribe: (() => void) | undefined

    const setupFirebaseListener = async () => {
      setLoading(true)
      try {
        // Build query constraints
        const constraints = [orderBy("createdAt", "desc")]

        // Add branch filtering
        if (selectedBranch) {
          if (selectedBranch.isProvider) {
            constraints.unshift(where("isProvider", "==", true))
          } else {
            constraints.unshift(where("branchId", "==", selectedBranch.id))
          }
        }

        // Add category filter if specified
        if (filters.category && filters.category !== "all") {
          constraints.unshift(where("category", "==", filters.category))
        }

        // Add status filter if specified
        if (filters.status && filters.status !== "all") {
          constraints.unshift(where("status", "==", filters.status))
        }

        const itemsQuery = query(collection(db, "items"), ...constraints)

        unsubscribe = onSnapshot(
          itemsQuery,
          (snapshot) => {
            const itemsList = snapshot.docs.map((doc) => {
              const data = doc.data()
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
              }
            }) as Item[]

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
      } catch (error) {
        console.error("Error setting up items listener:", error)
        setLoading(false)
      }
    }

    setupFirebaseListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [selectedBranch, user, filters.category, filters.status, toast])

  // Memoized filtered items for client-side filtering
  const filteredItems = useMemo(() => {
    let result = items

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      result = result.filter(
        (item) =>
          item.model?.toLowerCase().includes(searchTerm) ||
          item.category?.toLowerCase().includes(searchTerm) ||
          item.id?.toLowerCase().includes(searchTerm) ||
          item.supplierName?.toLowerCase().includes(searchTerm) ||
          item.notes?.toLowerCase().includes(searchTerm),
      )
    }

    // Payment status filter
    if (filters.paymentStatus && filters.paymentStatus !== "all") {
      result = result.filter((item) => item.paymentStatus === filters.paymentStatus)
    }

    // Supplier name filter
    if (filters.supplierName) {
      result = result.filter((item) => item.supplierName?.toLowerCase().includes(filters.supplierName.toLowerCase()))
    }

    // Date range filter
    if (filters.dateRange?.from) {
      const fromDate = startOfDay(filters.dateRange.from)
      const toDate = filters.dateRange.to ? endOfDay(filters.dateRange.to) : endOfDay(filters.dateRange.from)

      result = result.filter((item) => {
        const itemDate = new Date(item[filters.dateField as keyof Item] as string)
        return itemDate >= fromDate && itemDate <= toDate
      })
    }

    return result
  }, [items, filters])

  // Memoized statistics calculation
  const statistics = useMemo(() => {
    const totalItems = filteredItems.length
    const lowStockItems = filteredItems.filter((item) => item.quantity <= 5).length
    const totalValue = filteredItems.reduce(
      (sum, item) => sum + (item.sellingPrice || item.price || 0) * item.quantity,
      0,
    )
    const availableItems = filteredItems.filter((item) => item.status === "available").length
    const soldItems = filteredItems.filter((item) => item.status === "sold").length
    const totalWeight = filteredItems.reduce((sum, item) => sum + item.weight * item.quantity, 0)

    return {
      totalItems,
      lowStockItems,
      totalValue,
      availableItems,
      soldItems,
      totalWeight,
    }
  }, [filteredItems])

  // Event handlers
  const handleAddItem = useCallback(() => {
    router.push("/items/add")
  }, [router])

  const handleBulkImport = useCallback(() => {
    router.push("/items/bulk-import")
  }, [router])

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true)
      const filename = `mahsulotlar-${format(new Date(), "yyyy-MM-dd-HH-mm")}.xlsx`
      await exportItemsToExcel(filteredItems, filename)

      toast({
        title: "Eksport muvaffaqiyatli",
        description: `${filteredItems.length} ta mahsulot eksport qilindi`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Eksport xatosi",
        description: "Faylni eksport qilishda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }, [filteredItems, toast])

  const updateFilters = useCallback((updates: Partial<ItemFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS)
  }, [])

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search ||
      filters.category !== "all" ||
      filters.status !== "all" ||
      filters.branch !== "all" ||
      filters.paymentStatus !== "all" ||
      filters.supplierName ||
      filters.dateRange
    )
  }, [filters])

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [authLoading, user, router])

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mahsulotlar</h1>
            <p className="text-muted-foreground">
              {selectedBranch
                ? selectedBranch.isProvider
                  ? "Ombor inventari mahsulotlari"
                  : `${selectedBranch.name} filiali mahsulotlari`
                : "Barcha filiallar mahsulotlari"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAddItem} className="gap-2">
              <Plus className="h-4 w-4" />
              Yangi mahsulot
            </Button>
            <Button variant="outline" onClick={handleBulkImport} className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={isExporting} className="gap-2">
              <Download className="h-4 w-4" />
              {isExporting ? "Eksport qilinmoqda..." : "Eksport"}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filtrlash va qidirish</CardTitle>
              {hasActiveFilters && (
                <Badge variant="secondary" className="gap-1">
                  <Filter className="h-3 w-3" />
                  Filtrlar faol
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and basic filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Qidirish</Label>
                <Input
                  placeholder="Model, kategoriya, ID..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Kategoriya</Label>
                <Select value={filters.category} onValueChange={(value) => updateFilters({ category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                    <SelectItem value="Uzuk">Uzuk</SelectItem>
                    <SelectItem value="Sirg'a">Sirg'a</SelectItem>
                    <SelectItem value="Bilakuzuk">Bilakuzuk</SelectItem>
                    <SelectItem value="Zanjir">Zanjir</SelectItem>
                    <SelectItem value="Boshqa">Boshqa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Holat</Label>
                <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha holatlar</SelectItem>
                    <SelectItem value="available">Mavjud</SelectItem>
                    <SelectItem value="sold">Sotilgan</SelectItem>
                    <SelectItem value="returned">Qaytarilgan</SelectItem>
                    <SelectItem value="transferred">Ko'chirilgan</SelectItem>
                    <SelectItem value="reserved">Zahirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To'lov holati</Label>
                <Select
                  value={filters.paymentStatus}
                  onValueChange={(value) => updateFilters({ paymentStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha holatlar</SelectItem>
                    <SelectItem value="paid">To'langan</SelectItem>
                    <SelectItem value="partially_paid">Qisman to'langan</SelectItem>
                    <SelectItem value="unpaid">To'lanmagan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Ta'minotchi</Label>
                <Input
                  placeholder="Ta'minotchi nomi..."
                  value={filters.supplierName}
                  onChange={(e) => updateFilters({ supplierName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Sana turi</Label>
                <Select value={filters.dateField} onValueChange={(value) => updateFilters({ dateField: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Yaratilgan sana</SelectItem>
                    <SelectItem value="purchaseDate">Sotib olingan sana</SelectItem>
                    <SelectItem value="soldDate">Sotilgan sana</SelectItem>
                    <SelectItem value="distributedDate">Tarqatilgan sana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sana oralig'i</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(dateRange) => updateFilters({ dateRange })}
                />
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Filtrlarni tozalash
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{statistics.totalItems}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mavjud</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-600">{statistics.availableItems}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sotilgan</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-blue-600">{statistics.soldItems}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kam qolgan</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-orange-600">{statistics.lowStockItems}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami og'irlik</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{statistics.totalWeight.toFixed(2)}g</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami qiymat</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(statistics.totalValue)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Mahsulotlar ro'yxati</CardTitle>
            <CardDescription>
              {hasActiveFilters
                ? `Filtrlangan natijalar: ${filteredItems.length} ta mahsulot`
                : `Jami ${filteredItems.length} ta mahsulot`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ItemsTable
              items={filteredItems}
              loading={loading}
              onAddItem={handleAddItem}
              onBulkImport={handleBulkImport}
              onItemsUpdated={() => {
                // Trigger a refetch by updating a timestamp or similar
                setLoading(true)
                setTimeout(() => setLoading(false), 100)
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

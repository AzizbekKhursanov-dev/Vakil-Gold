"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { branchService } from "@/lib/services/branch.service"
import { itemService } from "@/lib/services/item.service"
import { formatCurrency } from "@/lib/utils/currency"
import { exportItemsToExcel } from "@/lib/utils/excel"
import {
  Search,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Package,
  ArrowLeft,
  DollarSign,
  RotateCcw,
  Clock,
  Percent,
  CheckCircle,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ItemDetailsModal } from "@/components/items/item-details-modal"
import { ItemEditForm } from "@/components/items/item-edit-form"
import { ReturnToSupplierForm } from "@/components/items/return-to-supplier-form"
import { ProfitMarginUpdateForm } from "@/components/items/profit-margin-update-form"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { format, parseISO, isValid } from "date-fns"

interface EnhancedBranchInventoryProps {
  branchId: string
  branchName: string
}

interface Item {
  id: string
  model: string
  category: string
  weight: number
  size?: number
  quantity: number
  lomNarxi: number
  lomNarxiKirim: number
  laborCost: number
  profitPercentage: number
  sellingPrice: number
  status: string
  isProvider?: boolean
  branch?: string
  branchId?: string
  branchName?: string
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
  returnReason?: string
  returnDate?: string
  createdAt: string
  updatedAt: string
}

export function EnhancedBranchInventory({ branchId, branchName }: EnhancedBranchInventoryProps) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [returnItem, setReturnItem] = useState<Item | null>(null)
  const [returnReason, setReturnReason] = useState("")
  const [returnToSupplierItem, setReturnToSupplierItem] = useState<Item | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showProfitMarginDialog, setShowProfitMarginDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchItems()
  }, [branchId])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const branchItems = await branchService.getBranchItems(branchId)
      setItems(branchItems)
    } catch (error) {
      console.error("Error fetching branch items:", error)
      toast({
        title: "Xatolik",
        description: "Mahsulotlarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map((item) => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId])
    } else {
      setSelectedItems(selectedItems.filter((id) => id !== itemId))
    }
  }

  const handleStatusChange = async (
    itemId: string,
    newStatus: "sold" | "returned" | "available" | "transferred" | "reserved" | "returned_to_supplier",
    additionalData?: any,
  ) => {
    try {
      await itemService.updateItemStatus(itemId, newStatus, additionalData)
      toast({
        title: "Holat yangilandi",
        description: `Mahsulot holati "${getStatusText(newStatus)}" ga o'zgartirildi`,
      })
      fetchItems()
    } catch (error: any) {
      console.error("Error updating item status:", error)
      toast({
        title: "Xatolik",
        description: "Holat yangilashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleReturnToInventory = async (itemId: string) => {
    try {
      await itemService.returnToInventory(itemId)
      toast({
        title: "Omborga qaytarildi",
        description: "Mahsulot markaziy omborga muvaffaqiyatli qaytarildi",
      })
      fetchItems()
    } catch (error: any) {
      console.error("Error returning to inventory:", error)
      toast({
        title: "Xatolik",
        description: "Mahsulotni omborga qaytarishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleReturn = async () => {
    if (!returnItem || !returnReason.trim()) {
      toast({
        title: "Xatolik",
        description: "Qaytarish sababini kiriting",
        variant: "destructive",
      })
      return
    }

    try {
      await handleStatusChange(returnItem.id, "returned", {
        returnReason: returnReason.trim(),
      })
      setReturnItem(null)
      setReturnReason("")
      toast({
        title: "Mahsulot qaytarildi",
        description: "Mahsulot muvaffaqiyatli qaytarildi va yana mavjud holatga o'tkazildi",
      })
    } catch (error: any) {
      console.error("Error returning item:", error)
      toast({
        title: "Xatolik",
        description: "Mahsulotni qaytarishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Mahsulotni o'chirishni tasdiqlaysizmi?")) return

    try {
      await itemService.deleteItem(itemId)
      setItems(items.filter((item) => item.id !== itemId))
      toast({
        title: "Muvaffaqiyat",
        description: "Mahsulot o'chirildi",
      })
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Mahsulotni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedItems.length === 0) {
      toast({
        title: "Ogohlantirish",
        description: "Hech qanday mahsulot tanlanmagan",
        variant: "destructive",
      })
      return
    }

    try {
      switch (action) {
        case "delete":
          if (confirm(`${selectedItems.length} ta mahsulotni o'chirishni tasdiqlaysizmi?`)) {
            await itemService.bulkDeleteItems(selectedItems)
            toast({
              title: "Muvaffaqiyat",
              description: `${selectedItems.length} ta mahsulot o'chirildi`,
            })
            setSelectedItems([])
            fetchItems()
          }
          break
        case "mark_sold":
          for (const itemId of selectedItems) {
            await itemService.updateItemStatus(itemId, "sold", { soldDate: new Date().toISOString() })
          }
          toast({
            title: "Muvaffaqiyat",
            description: `${selectedItems.length} ta mahsulot sotilgan deb belgilandi`,
          })
          setSelectedItems([])
          fetchItems()
          break
        case "return_to_inventory":
          for (const itemId of selectedItems) {
            await itemService.returnToInventory(itemId)
          }
          toast({
            title: "Muvaffaqiyat",
            description: `${selectedItems.length} ta mahsulot omborga qaytarildi`,
          })
          setSelectedItems([])
          fetchItems()
          break
      }
    } catch (error) {
      console.error("Error performing bulk action:", error)
      toast({
        title: "Xatolik",
        description: "Amalni bajarishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleExportToExcel = async () => {
    try {
      const filename = `${branchName.replace(/\s+/g, "_")}_mahsulotlar_${new Date().toISOString().split("T")[0]}.xlsx`
      await exportItemsToExcel(filteredItems, filename)
      toast({
        title: "Eksport qilindi",
        description: "Mahsulotlar ma'lumotlari Excel formatiga eksport qilindi",
      })
    } catch (error) {
      console.error("Excel export error:", error)
      toast({
        title: "Xatolik",
        description: "Excel faylini yaratishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: "Mavjud", variant: "default" as const, className: "bg-green-100 text-green-800" },
      sold: { label: "Sotilgan", variant: "secondary" as const, className: "bg-blue-100 text-blue-800" },
      returned: { label: "Qaytarilgan", variant: "destructive" as const },
      transferred: { label: "Ko'chirilgan", variant: "outline" as const, className: "bg-purple-100 text-purple-800" },
      reserved: { label: "Zahirada", variant: "outline" as const, className: "bg-yellow-100 text-yellow-800" },
      returned_to_supplier: {
        label: "Ta'minotchiga qaytarilgan",
        variant: "outline" as const,
        className: "bg-orange-100 text-orange-800",
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "outline" as const }
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Mavjud"
      case "sold":
        return "Sotilgan"
      case "returned":
        return "Qaytarilgan"
      case "transferred":
        return "Ko'chirilgan"
      case "reserved":
        return "Zahirada"
      case "returned_to_supplier":
        return "Ta'minotchiga qaytarilgan"
      default:
        return status
    }
  }

  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            To'langan
          </Badge>
        )
      case "partially_paid":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Qisman
          </Badge>
        )
      case "unpaid":
        return <Badge variant="destructive">To'lanmagan</Badge>
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-600">
            Noma'lum
          </Badge>
        )
    }
  }

  const calculateItemProfit = (item: Item) => {
    // Calculate material cost (weight * price per gram)
    const materialCost = item.weight * (item.isProvider ? item.lomNarxi : item.lomNarxiKirim)
    // Calculate labor cost (weight * labor cost per gram)
    const laborTotal = item.weight * item.laborCost
    // Total cost
    const totalCost = materialCost + laborTotal
    // Profit amount
    return item.sellingPrice - totalCost
  }

  const calculateItemProfitMargin = (item: Item) => {
    const profit = calculateItemProfit(item)
    const totalCost =
      item.weight * (item.isProvider ? item.lomNarxi : item.lomNarxiKirim) + item.weight * item.laborCost
    return totalCost > 0 ? (profit / totalCost) * 100 : 0
  }

  const formatSafeDate = (dateString?: string, formatStr = "dd/MM/yyyy") => {
    if (!dateString) return "—"
    try {
      // Try parsing as ISO string first
      let date = parseISO(dateString)

      // If that fails, try creating a new Date
      if (!isValid(date)) {
        date = new Date(dateString)
      }

      // If still invalid, return fallback
      if (!isValid(date)) {
        return "—"
      }

      return format(date, formatStr)
    } catch (error) {
      return "—"
    }
  }

  const getSelectedItemsData = () => {
    return items.filter((item) => selectedItems.includes(item.id))
  }

  // Calculate statistics
  const totalItems = filteredItems.length
  const availableItems = filteredItems.filter((item) => item.status === "available").length
  const soldItems = filteredItems.filter((item) => item.status === "sold").length
  const totalValue = filteredItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0)
  const totalWeight = filteredItems.reduce((sum, item) => sum + item.weight * item.quantity, 0)
  const totalCost = filteredItems.reduce((sum, item) => {
    const materialCost = item.weight * (item.isProvider ? item.lomNarxi : item.lomNarxiKirim)
    const laborCost = item.weight * item.laborCost
    return sum + (materialCost + laborCost) * item.quantity
  }, 0)
  const totalProfit = filteredItems.reduce((sum, item) => sum + calculateItemProfit(item) * item.quantity, 0)
  const averageProfitMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Filial mahsulotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mavjud</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{availableItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sotilgan</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{soldItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami og'irlik</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWeight.toFixed(2)}g</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami qiymat</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Foyda</CardTitle>
              <Percent className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{averageProfitMargin.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{formatCurrency(totalProfit)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filial mahsulotlari ({filteredItems.length})</CardTitle>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/items/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Yangi mahsulot
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleExportToExcel}>
                  <Download className="mr-2 h-4 w-4" />
                  Eksport
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Mahsulot qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Holat" />
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Kategoriya" />
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

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">{selectedItems.length} ta mahsulot tanlangan</span>
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("return_to_inventory")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Omborga qaytarish
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("mark_sold")}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Sotilgan deb belgilash
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowProfitMarginDialog(true)}>
                    <Percent className="mr-2 h-4 w-4" />
                    Foyda foizini o'zgartirish
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    O'chirish
                  </Button>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="min-w-[120px]">Model</TableHead>
                    <TableHead>Kategoriya</TableHead>
                    <TableHead>Ma'lumotlar</TableHead>
                    <TableHead>Narxlash</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Qo'shimcha</TableHead>
                    <TableHead>Sanalar</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                            ? "Filtr shartlariga mos mahsulot topilmadi"
                            : "Bu filialda hali mahsulotlar yo'q"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                          />
                        </TableCell>

                        {/* Model */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{item.model}</div>
                            <div className="text-xs text-muted-foreground">ID: {item.id.slice(-6)}</div>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>

                        {/* Physical Data */}
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{item.weight}g</span>
                              {item.size && <span className="text-muted-foreground">• {item.size}</span>}
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              <span>{item.quantity} dona</span>
                            </div>
                            {item.stoneType && (
                              <div className="text-xs text-muted-foreground">
                                {item.stoneType} {item.stoneWeight && `(${item.stoneWeight}k)`}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Pricing */}
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="font-medium text-green-600">{formatCurrency(item.sellingPrice)}</div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-xs flex items-center cursor-help">
                                  <Percent className="h-3 w-3 mr-1" />
                                  Foyda: {item.profitPercentage.toFixed(1)}%
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Hisoblangan foyda: {calculateItemProfitMargin(item).toFixed(1)}%</p>
                                <p>Mahsulotda belgilangan: {item.profitPercentage.toFixed(1)}%</p>
                              </TooltipContent>
                            </Tooltip>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(calculateItemProfit(item))}
                            </div>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <div className="space-y-2">
                            {getStatusBadge(item.status)}
                            {getPaymentStatusBadge(item.paymentStatus)}
                            {item.returnReason && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Qaytarilgan
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Sabab: {item.returnReason}</p>
                                  {item.returnDate && <p>Sana: {formatSafeDate(item.returnDate)}</p>}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>

                        {/* Additional Info */}
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {item.color && <div className="text-xs">{item.color}</div>}
                            {item.purity && (
                              <Badge variant="outline" className="text-xs">
                                {item.purity}
                              </Badge>
                            )}
                            {item.supplierName && (
                              <div className="text-xs text-muted-foreground">{item.supplierName}</div>
                            )}
                          </div>
                        </TableCell>

                        {/* Dates */}
                        <TableCell>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div>Yaratilgan: {formatSafeDate(item.createdAt, "dd/MM/yy")}</div>
                            {item.soldDate && (
                              <div className="text-green-600">
                                Sotilgan: {formatSafeDate(item.soldDate, "dd/MM/yy")}
                              </div>
                            )}
                            {item.purchaseDate && (
                              <div>Sotib olingan: {formatSafeDate(item.purchaseDate, "dd/MM/yy")}</div>
                            )}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedItem(item)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Batafsil ko'rish
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingItem(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Tahrirlash
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />

                              {item.status === "available" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, "sold")}>
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Sotilgan deb belgilash
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, "reserved")}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    Zahirada deb belgilash
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleReturnToInventory(item.id)}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Omborga qaytarish
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}

                              {item.status === "sold" && (
                                <>
                                  <DropdownMenuItem onClick={() => setReturnItem(item)}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Qaytarish
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}

                              {(item.status === "reserved" || item.status === "transferred") && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, "available")}>
                                    Mavjud deb belgilash
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}

                              {item.status === "available" && item.supplierName && (
                                <DropdownMenuItem onClick={() => setReturnToSupplierItem(item)}>
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Ta'minotchiga qaytarish
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem onClick={() => handleDeleteItem(item.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                O'chirish
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        {selectedItem && (
          <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Mahsulot tafsilotlari</DialogTitle>
              </DialogHeader>
              <ItemDetailsModal item={selectedItem} />
            </DialogContent>
          </Dialog>
        )}

        {editingItem && (
          <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Mahsulotni tahrirlash</DialogTitle>
              </DialogHeader>
              <ItemEditForm
                item={editingItem}
                onSuccess={() => {
                  setEditingItem(null)
                  toast({
                    title: "Yangilandi",
                    description: "Mahsulot muvaffaqiyatli yangilandi",
                  })
                  fetchItems()
                }}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Return Modal */}
        {returnItem && (
          <Dialog open={!!returnItem} onOpenChange={() => setReturnItem(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mahsulotni qaytarish</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Mahsulot ma'lumotlari</h4>
                  <p className="text-sm">
                    <span className="font-medium">Model:</span> {returnItem.model}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Kategoriya:</span> {returnItem.category}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Sotuv narxi:</span> {formatCurrency(returnItem.sellingPrice)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="returnReason">Qaytarish sababi *</Label>
                  <Textarea
                    id="returnReason"
                    placeholder="Mahsulot nima uchun qaytarilayotganini tushuntiring..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setReturnItem(null)}>
                    Bekor qilish
                  </Button>
                  <Button onClick={handleReturn} disabled={!returnReason.trim()}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Qaytarish
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Return to Supplier Modal */}
        {returnToSupplierItem && (
          <Dialog open={!!returnToSupplierItem} onOpenChange={() => setReturnToSupplierItem(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mahsulotni ta'minotchiga qaytarish</DialogTitle>
              </DialogHeader>
              <ReturnToSupplierForm
                item={returnToSupplierItem}
                onSuccess={() => {
                  setReturnToSupplierItem(null)
                  toast({
                    title: "Muvaffaqiyatli qaytarildi",
                    description: "Mahsulot ta'minotchiga muvaffaqiyatli qaytarildi",
                  })
                  fetchItems()
                }}
                onCancel={() => setReturnToSupplierItem(null)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Profit Margin Update Dialog */}
        <Dialog open={showProfitMarginDialog} onOpenChange={setShowProfitMarginDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Foyda foizini o'zgartirish</DialogTitle>
            </DialogHeader>
            <ProfitMarginUpdateForm
              items={getSelectedItemsData()}
              onSuccess={() => {
                setShowProfitMarginDialog(false)
                setSelectedItems([])
                toast({
                  title: "Muvaffaqiyatli yangilandi",
                  description: `${selectedItems.length} ta mahsulotning foyda foizi yangilandi`,
                })
                fetchItems()
              }}
              onCancel={() => setShowProfitMarginDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

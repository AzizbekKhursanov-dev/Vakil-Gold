"use client"

import React, { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import {
  Upload,
  Trash2,
  Edit,
  Eye,
  MoreHorizontal,
  Plus,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  User,
  Palette,
  Gem,
  RotateCcw,
  ArrowLeftRight,
  Clock,
  FileDown,
  Percent,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ItemDetailsModal } from "./item-details-modal"
import { ItemEditForm } from "./item-edit-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { itemService } from "@/lib/services/item.service"
import { format, isValid, parseISO } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ReturnToSupplierForm } from "@/components/items/return-to-supplier-form"
import { exportItemsToExcel } from "@/lib/utils/excel"
import { ProfitMarginUpdateForm } from "./profit-margin-update-form"

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
  returnReason?: string
  returnDate?: string
  createdAt: string
  updatedAt: string
}

interface ItemsTableProps {
  items: Item[]
  loading: boolean
  onAddItem?: () => void
  onBulkImport?: () => void
  onItemsUpdated?: () => void
}

// Safe date formatting function
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
    console.warn("Invalid date:", dateString)
    return "—"
  }
}

export const ItemsTable = React.memo<ItemsTableProps>(({ items, loading, onAddItem, onBulkImport, onItemsUpdated }) => {
  const { toast } = useToast()

  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Modal state
  const [detailsItem, setDetailsItem] = useState<Item | null>(null)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [returnItem, setReturnItem] = useState<Item | null>(null)
  const [returnReason, setReturnReason] = useState("")
  const [returnToSupplierItem, setReturnToSupplierItem] = useState<Item | null>(null)

  // Profit margin state
  const [showProfitMarginDialog, setShowProfitMarginDialog] = useState(false)

  const memoizedItems = useMemo(() => {
    return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [items])

  const selectedItemsData = useMemo(() => {
    return items.filter((item) => selectedItems.includes(item.id))
  }, [items, selectedItems])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedItems(items.map((item) => item.id))
      } else {
        setSelectedItems([])
      }
    },
    [items],
  )

  const handleSelectItem = useCallback((itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, itemId])
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId))
    }
  }, [])

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
      if (onItemsUpdated) {
        onItemsUpdated()
      }
    } catch (error: any) {
      console.error("Error updating item status:", error)
      toast({
        title: "Xatolik",
        description: "Holat yangilashda xatolik yuz berdi",
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
      if (onItemsUpdated) {
        onItemsUpdated()
      }
    } catch (error: any) {
      console.error("Error returning item:", error)
      toast({
        title: "Xatolik",
        description: "Mahsulotni qaytarishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (itemId: string) => {
    try {
      await itemService.deleteItem(itemId)
      toast({
        title: "O'chirildi",
        description: "Mahsulot muvaffaqiyatli o'chirildi",
      })
      if (onItemsUpdated) {
        onItemsUpdated()
      }
    } catch (error: any) {
      console.error("Error deleting item:", error)
      toast({
        title: "Xatolik",
        description: "Mahsulot o'chirishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return

    try {
      await Promise.all(selectedItems.map((itemId) => itemService.deleteItem(itemId)))
      setSelectedItems([])
      toast({
        title: "O'chirildi",
        description: `${selectedItems.length} ta mahsulot o'chirildi`,
      })
      if (onItemsUpdated) {
        onItemsUpdated()
      }
    } catch (error: any) {
      console.error("Error bulk deleting items:", error)
      toast({
        title: "Xatolik",
        description: "Mahsulotlarni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleExportToExcel = async () => {
    try {
      const filename = `mahsulotlar_${new Date().toISOString().split("T")[0]}.xlsx`
      await exportItemsToExcel(items, filename)
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
    switch (status) {
      case "available":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Mavjud
          </Badge>
        )
      case "sold":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Sotilgan
          </Badge>
        )
      case "returned":
        return <Badge variant="destructive">Qaytarilgan</Badge>
      case "transferred":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            Ko'chirilgan
          </Badge>
        )
      case "reserved":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Zahirada
          </Badge>
        )
      case "returned_to_supplier":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            Ta'minotchiga qaytarilgan
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
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

  const calculateProfit = (item: Item) => {
    const materialCost = item.weight * item.lomNarxi
    const laborTotal = item.weight * item.laborCost
    const totalCost = materialCost + laborTotal
    return item.sellingPrice - totalCost
  }

  const calculateProfitMargin = (item: Item) => {
    const profit = calculateProfit(item)
    return item.sellingPrice > 0 ? (profit / item.sellingPrice) * 100 : 0
  }

  const getSelectedItemsData = () => {
    return items.filter((item) => selectedItems.includes(item.id))
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {onAddItem && (
              <Button onClick={onAddItem} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Qo'shish
              </Button>
            )}
            {onBulkImport && (
              <Button onClick={onBulkImport} variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Ommaviy import
              </Button>
            )}
            <Button onClick={handleExportToExcel} variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Eksport (Excel)
            </Button>
          </div>

          {selectedItems.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={() => setShowProfitMarginDialog(true)} variant="secondary" size="sm">
                <Percent className="mr-2 h-4 w-4" />
                Foyda foizini o'zgartirish ({selectedItems.length})
              </Button>
              <Button onClick={handleBulkDelete} variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                O'chirish ({selectedItems.length})
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedItems.length === items.length && items.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="min-w-[120px]">Model</TableHead>
                      <TableHead>Kategoriya</TableHead>
                      <TableHead>Ma'lumotlar</TableHead>
                      <TableHead>Narxlash</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Joylashuv</TableHead>
                      <TableHead>Qo'shimcha</TableHead>
                      <TableHead>Sanalar</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <div className="text-muted-foreground">
                            <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">Mahsulotlar topilmadi</p>
                            <p className="text-sm mb-4">
                              Hozircha hech qanday mahsulot yo'q yoki filtr shartlariga mos keluvchi mahsulot topilmadi
                            </p>
                            {onAddItem && (
                              <Button onClick={onAddItem} variant="outline" className="mt-2">
                                <Plus className="mr-2 h-4 w-4" />
                                Birinchi mahsulotni qo'shing
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      memoizedItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50 content-visibility-auto">
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
                                <div className="flex items-center gap-1">
                                  <Gem className="h-3 w-3" />
                                  <span className="text-xs">{item.stoneType}</span>
                                  {item.stoneWeight && <span className="text-xs">({item.stoneWeight}k)</span>}
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
                                  <p>Hisoblangan foyda: {calculateProfitMargin(item).toFixed(1)}%</p>
                                  <p>Mahsulotda belgilangan: {item.profitPercentage.toFixed(1)}%</p>
                                </TooltipContent>
                              </Tooltip>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(calculateProfit(item))}
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

                          {/* Location */}
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{item.isProvider ? "Ombor" : item.branchName || "Noma'lum"}</span>
                              </div>
                              {item.supplierName && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span className="text-xs">{item.supplierName}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Additional Info */}
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              {item.color && (
                                <div className="flex items-center gap-1">
                                  <Palette className="h-3 w-3" />
                                  <span className="text-xs">{item.color}</span>
                                </div>
                              )}
                              {item.purity && (
                                <Badge variant="outline" className="text-xs">
                                  {item.purity}
                                </Badge>
                              )}
                              {item.manufacturer && (
                                <div className="text-xs text-muted-foreground">{item.manufacturer}</div>
                              )}
                            </div>
                          </TableCell>

                          {/* Dates */}
                          <TableCell>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatSafeDate(item.createdAt, "dd/MM/yy")}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Yaratilgan: {formatSafeDate(item.createdAt, "dd/MM/yyyy HH:mm")}</p>
                                </TooltipContent>
                              </Tooltip>

                              {item.soldDate && (
                                <div className="text-green-600">
                                  Sotilgan: {formatSafeDate(item.soldDate, "dd/MM/yy")}
                                </div>
                              )}

                              {item.purchaseDate && (
                                <div>Sotib olingan: {formatSafeDate(item.purchaseDate, "dd/MM/yy")}</div>
                              )}

                              {item.returnDate && (
                                <div className="text-orange-600">
                                  Qaytarilgan: {formatSafeDate(item.returnDate, "dd/MM/yy")}
                                </div>
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
                                <DropdownMenuItem onClick={() => setDetailsItem(item)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Batafsil ko'rish
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditItem(item)}>
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
                                    <DropdownMenuItem onClick={() => handleStatusChange(item.id, "transferred")}>
                                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                                      Ko'chirilgan deb belgilash
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

                                <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">
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
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        {detailsItem && (
          <Dialog open={!!detailsItem} onOpenChange={() => setDetailsItem(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Mahsulot tafsilotlari</DialogTitle>
              </DialogHeader>
              <ItemDetailsModal item={detailsItem} />
            </DialogContent>
          </Dialog>
        )}

        {editItem && (
          <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Mahsulotni tahrirlash</DialogTitle>
              </DialogHeader>
              <ItemEditForm
                item={editItem}
                onSuccess={() => {
                  setEditItem(null)
                  toast({
                    title: "Yangilandi",
                    description: "Mahsulot muvaffaqiyatli yangilandi",
                  })
                  if (onItemsUpdated) {
                    onItemsUpdated()
                  }
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
                  if (onItemsUpdated) {
                    onItemsUpdated()
                  }
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
              items={selectedItemsData}
              onSuccess={() => {
                setShowProfitMarginDialog(false)
                setSelectedItems([])
                toast({
                  title: "Muvaffaqiyatli yangilandi",
                  description: `${selectedItems.length} ta mahsulotning foyda foizi yangilandi`,
                })
                if (onItemsUpdated) {
                  onItemsUpdated()
                }
              }}
              onCancel={() => setShowProfitMarginDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
})

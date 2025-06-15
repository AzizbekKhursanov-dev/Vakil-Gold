"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, Plus, Eye, Edit, Trash2 } from "lucide-react"
import { branchService } from "@/lib/services/branch.service"
import { itemService } from "@/lib/services/item.service"
import { formatCurrency } from "@/lib/utils/currency"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ItemDetailsModal } from "@/components/items/item-details-modal"
import { ItemEditForm } from "@/components/items/item-edit-form"
import Link from "next/link"
import { format } from "date-fns"

interface BranchItemsListProps {
  branchId: string
}

export function BranchItemsList({ branchId }: BranchItemsListProps) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
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

    fetchItems()
  }, [branchId, toast])

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: "Mavjud", variant: "default" as const },
      sold: { label: "Sotilgan", variant: "secondary" as const },
      returned: { label: "Qaytarilgan", variant: "destructive" as const },
      transferred: { label: "Ko'chirilgan", variant: "outline" as const },
      reserved: { label: "Zahirada", variant: "secondary" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "outline" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
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

  const handleUpdateItem = async (itemId: string, data: any) => {
    try {
      await itemService.updateItem(itemId, data)
      // Refresh items list
      const updatedItems = await branchService.getBranchItems(branchId)
      setItems(updatedItems)
      setEditingItem(null)
      toast({
        title: "Muvaffaqiyat",
        description: "Mahsulot yangilandi",
      })
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Mahsulotni yangilashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleExportItems = async () => {
    try {
      // Prepare data for export
      const exportData = filteredItems.map((item, index) => ({
        "№": index + 1,
        Model: item.model,
        Kategoriya: item.category,
        "Og'irlik (g)": item.weight,
        "Sotuv narxi (so'm)": item.sellingPrice,
        "Lom narxi (so'm/g)": item.lomNarxi,
        "Ishchi haqi (so'm/g)": item.laborCost,
        "Foyda (%)": item.profitPercentage,
        Holati: getStatusText(item.status),
        "To'lov holati": getPaymentStatusText(item.paymentStatus),
        "Ta'minotchi": item.supplierName || "—",
        "Yaratilgan sana": format(new Date(item.createdAt), "dd/MM/yyyy HH:mm"),
        "Sotilgan sana": item.soldDate ? format(new Date(item.soldDate), "dd/MM/yyyy") : "—",
      }))

      // Create workbook
      const XLSX = await import("xlsx")
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Set column widths
      ws["!cols"] = [
        { wch: 5 },
        { wch: 15 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
      ]

      XLSX.utils.book_append_sheet(wb, ws, "Filial mahsulotlari")

      // Add summary
      const summary = {
        "Jami mahsulotlar": filteredItems.length,
        "Mavjud mahsulotlar": filteredItems.filter((i) => i.status === "available").length,
        "Sotilgan mahsulotlar": filteredItems.filter((i) => i.status === "sold").length,
        "Jami qiymat": formatCurrency(filteredItems.reduce((sum, i) => sum + i.sellingPrice, 0)),
        "Eksport sanasi": format(new Date(), "dd/MM/yyyy HH:mm"),
      }

      const summaryData = Object.entries(summary).map(([key, value]) => ({
        "Ko'rsatkich": key,
        Qiymat: value,
      }))

      const summaryWs = XLSX.utils.json_to_sheet(summaryData)
      summaryWs["!cols"] = [{ wch: 25 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, summaryWs, "Xulosa")

      // Download
      const filename = `filial-mahsulotlari-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`
      XLSX.writeFile(wb, filename)

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
      default:
        return status
    }
  }

  const getPaymentStatusText = (status?: string) => {
    switch (status) {
      case "paid":
        return "To'langan"
      case "partially_paid":
        return "Qisman to'langan"
      case "unpaid":
        return "To'lanmagan"
      default:
        return "Noma'lum"
    }
  }

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
            <Button variant="outline" onClick={handleExportItems}>
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

        {/* Items Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Kategoriya</TableHead>
                <TableHead>Og'irlik</TableHead>
                <TableHead>Narx</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                        ? "Filtr shartlariga mos mahsulot topilmadi"
                        : "Bu filialda hali mahsulotlar yo'q"}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.model}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.weight}g</TableCell>
                    <TableCell>{formatCurrency(item.sellingPrice)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedItem(item)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Mahsulot tafsilotlari</DialogTitle>
                            </DialogHeader>
                            {selectedItem && <ItemDetailsModal item={selectedItem} />}
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Mahsulotni tahrirlash</DialogTitle>
                            </DialogHeader>
                            {editingItem && (
                              <ItemEditForm
                                item={editingItem}
                                onSave={(data) => handleUpdateItem(editingItem.id, data)}
                                onCancel={() => setEditingItem(null)}
                              />
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

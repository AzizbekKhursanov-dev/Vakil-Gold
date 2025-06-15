"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { branchService } from "@/lib/services/branch.service"
import { useBranches } from "@/lib/hooks/use-branches"
import { useItems } from "@/lib/hooks/use-items"
import { Loader2, Search, ArrowRight, ArrowLeft, Package, Plus, Truck, CheckCircle, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { BranchTransfer, BranchTransferItem } from "@/lib/types/branch"

interface BranchTransferManagementProps {
  branchId: string
  branchName: string
}

export function BranchTransferManagement({ branchId, branchName }: BranchTransferManagementProps) {
  const [transfers, setTransfers] = useState<BranchTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [currentTransfer, setCurrentTransfer] = useState<BranchTransfer | null>(null)
  const { toast } = useToast()
  const { branches } = useBranches()
  const { items } = useItems()

  useEffect(() => {
    fetchTransfers()
  }, [branchId])

  const fetchTransfers = async () => {
    try {
      setLoading(true)
      const transfersList = await branchService.getBranchTransfers(branchId, "all")
      setTransfers(transfersList)
    } catch (error) {
      console.error("Error fetching transfers:", error)
      toast({
        title: "Xatolik",
        description: "Ko'chirishlar ro'yxatini yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      transfer.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || transfer.status === statusFilter

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "incoming" && transfer.toBranchId === branchId) ||
      (typeFilter === "outgoing" && transfer.fromBranchId === branchId)

    return matchesSearch && matchesStatus && matchesType
  })

  const handleCreateTransfer = async (data: Omit<BranchTransfer, "id">) => {
    try {
      await branchService.createBranchTransfer(data)
      toast({
        title: "Ko'chirish yaratildi",
        description: "Yangi ko'chirish muvaffaqiyatli yaratildi",
      })
      setShowCreateDialog(false)
      fetchTransfers()
    } catch (error) {
      console.error("Error creating transfer:", error)
      toast({
        title: "Xatolik",
        description: "Ko'chirishni yaratishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleCompleteTransfer = async (transferId: string, receivedBy: string, notes?: string) => {
    try {
      await branchService.completeBranchTransfer(transferId, receivedBy, notes)
      toast({
        title: "Ko'chirish yakunlandi",
        description: "Ko'chirish muvaffaqiyatli yakunlandi",
      })
      fetchTransfers()
    } catch (error) {
      console.error("Error completing transfer:", error)
      toast({
        title: "Xatolik",
        description: "Ko'chirishni yakunlashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTransferStatus = async (transferId: string, status: string, notes?: string) => {
    try {
      await branchService.updateBranchTransfer(transferId, { status: status as any, notes })
      toast({
        title: "Ko'chirish yangilandi",
        description: "Ko'chirish holati muvaffaqiyatli yangilandi",
      })
      fetchTransfers()
    } catch (error) {
      console.error("Error updating transfer:", error)
      toast({
        title: "Xatolik",
        description: "Ko'chirishni yangilashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Kutilmoqda
          </Badge>
        )
      case "in_transit":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            <Truck className="mr-1 h-3 w-3" />
            Yo'lda
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Yakunlangan
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive">
            <X className="mr-1 h-3 w-3" />
            Bekor qilingan
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <X className="mr-1 h-3 w-3" />
            Rad etilgan
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getBranchName = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId)
    return branch ? branch.name : "Noma'lum filial"
  }

  const pendingTransfers = transfers.filter((t) => t.status === "pending")
  const inTransitTransfers = transfers.filter((t) => t.status === "in_transit")
  const completedTransfers = transfers.filter((t) => t.status === "completed")

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami ko'chirishlar</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transfers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kutilayotgan</CardTitle>
            <ArrowRight className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingTransfers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yo'lda</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inTransitTransfers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yakunlangan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTransfers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filiallar o'rtasida ko'chirish</CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yangi ko'chirish
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Yangi ko'chirish yaratish</DialogTitle>
                </DialogHeader>
                <CreateTransferForm
                  fromBranchId={branchId}
                  fromBranchName={branchName}
                  branches={branches}
                  items={items.filter((item) => item.branchId === branchId && item.status === "available")}
                  onSubmit={handleCreateTransfer}
                  onCancel={() => setShowCreateDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ko'chirish qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Turi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="incoming">Kiruvchi</SelectItem>
                <SelectItem value="outgoing">Chiquvchi</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="pending">Kutilmoqda</SelectItem>
                <SelectItem value="in_transit">Yo'lda</SelectItem>
                <SelectItem value="completed">Yakunlangan</SelectItem>
                <SelectItem value="cancelled">Bekor qilingan</SelectItem>
                <SelectItem value="rejected">Rad etilgan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transfers Table */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Yo'nalish</TableHead>
                    <TableHead>Mahsulotlar</TableHead>
                    <TableHead>Sabab</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Kuzatuv raqami</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                            ? "Filtr shartlariga mos ko'chirish topilmadi"
                            : "Hali ko'chirishlar yo'q"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell>{new Date(transfer.initiatedDate).toLocaleDateString("uz-UZ")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{getBranchName(transfer.fromBranchId)}</span>
                            {transfer.toBranchId === branchId ? (
                              <ArrowLeft className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowRight className="h-4 w-4 text-blue-600" />
                            )}
                            <span className="text-sm">{getBranchName(transfer.toBranchId)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transfer.items.length} ta mahsulot</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{transfer.reason}</TableCell>
                        <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                        <TableCell>{transfer.trackingNumber || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog
                              open={showDetailsDialog && currentTransfer?.id === transfer.id}
                              onOpenChange={(open) => {
                                setShowDetailsDialog(open)
                                if (!open) setCurrentTransfer(null)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setCurrentTransfer(transfer)}>
                                  Batafsil
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Ko'chirish tafsilotlari</DialogTitle>
                                </DialogHeader>
                                {currentTransfer && (
                                  <TransferDetailsDialog
                                    transfer={currentTransfer}
                                    branches={branches}
                                    items={items}
                                    onComplete={handleCompleteTransfer}
                                    onUpdateStatus={handleUpdateTransferStatus}
                                    canComplete={transfer.toBranchId === branchId && transfer.status === "in_transit"}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
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
    </div>
  )
}

interface CreateTransferFormProps {
  fromBranchId: string
  fromBranchName: string
  branches: any[]
  items: any[]
  onSubmit: (data: Omit<BranchTransfer, "id">) => void
  onCancel: () => void
}

function CreateTransferForm({
  fromBranchId,
  fromBranchName,
  branches,
  items,
  onSubmit,
  onCancel,
}: CreateTransferFormProps) {
  const [formData, setFormData] = useState({
    fromBranchId,
    toBranchId: "",
    reason: "",
    notes: "",
    transportMethod: "",
    estimatedArrival: "",
  })

  const [selectedItems, setSelectedItems] = useState<BranchTransferItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedItems.length === 0) {
      alert("Kamida bitta mahsulot tanlang")
      return
    }

    setIsSubmitting(true)

    try {
      const transferData: Omit<BranchTransfer, "id"> = {
        ...formData,
        items: selectedItems,
        initiatedBy: "Current User", // This should come from auth context
        initiatedDate: new Date().toISOString(),
        status: "pending",
        trackingNumber: `TR-${Date.now()}`,
      }

      await onSubmit(transferData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleItemSelect = (itemId: string, selected: boolean) => {
    if (selected) {
      setSelectedItems((prev) => [
        ...prev,
        {
          itemId,
          quantity: 1,
          condition: "excellent",
        },
      ])
    } else {
      setSelectedItems((prev) => prev.filter((item) => item.itemId !== itemId))
    }
  }

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setSelectedItems((prev) => prev.map((item) => (item.itemId === itemId ? { ...item, quantity } : item)))
  }

  const updateItemCondition = (itemId: string, condition: string) => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.itemId === itemId ? { ...item, condition: condition as any } : item)),
    )
  }

  const targetBranches = branches.filter((b) => b.id !== fromBranchId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Qayerdan</Label>
          <Input value={fromBranchName} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toBranchId">Qayerga *</Label>
          <Select
            value={formData.toBranchId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, toBranchId: value }))}
          >
            <SelectTrigger id="toBranchId">
              <SelectValue placeholder="Maqsad filialni tanlang" />
            </SelectTrigger>
            <SelectContent>
              {targetBranches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name} - {branch.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Ko'chirish sababi *</Label>
        <Input
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
          placeholder="Masalan: Filialda talab yuqori"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="transportMethod">Transport usuli</Label>
          <Select
            value={formData.transportMethod}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, transportMethod: value }))}
          >
            <SelectTrigger id="transportMethod">
              <SelectValue placeholder="Transport usulini tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="courier">Kuryer</SelectItem>
              <SelectItem value="company_transport">Kompaniya transporti</SelectItem>
              <SelectItem value="postal_service">Pochta xizmati</SelectItem>
              <SelectItem value="personal_pickup">Shaxsiy olib ketish</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedArrival">Taxminiy yetib borish vaqti</Label>
          <Input
            id="estimatedArrival"
            type="datetime-local"
            value={formData.estimatedArrival}
            onChange={(e) => setFormData((prev) => ({ ...prev, estimatedArrival: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label>Ko'chiriladigan mahsulotlar *</Label>
        <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Bu filialda mavjud mahsulotlar yo'q</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const isSelected = selectedItems.some((si) => si.itemId === item.id)
                const selectedItem = selectedItems.find((si) => si.itemId === item.id)

                return (
                  <div key={item.id} className="flex items-center gap-4 p-2 border rounded">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.model}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.category} • {item.weight}g • {item.sellingPrice?.toLocaleString()} so'm
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={selectedItem?.quantity || 1}
                          onChange={(e) => updateItemQuantity(item.id, Number(e.target.value))}
                          className="w-20"
                        />
                        <Select
                          value={selectedItem?.condition || "excellent"}
                          onValueChange={(value) => updateItemCondition(item.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">A'lo</SelectItem>
                            <SelectItem value="good">Yaxshi</SelectItem>
                            <SelectItem value="fair">O'rtacha</SelectItem>
                            <SelectItem value="poor">Yomon</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {selectedItems.length > 0 && (
          <p className="text-sm text-muted-foreground">Tanlangan: {selectedItems.length} ta mahsulot</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Qo'shimcha izohlar</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Ko'chirish haqida qo'shimcha ma'lumot..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isSubmitting || selectedItems.length === 0}>
          {isSubmitting ? "Yaratilmoqda..." : "Ko'chirishni yaratish"}
        </Button>
      </div>
    </form>
  )
}

interface TransferDetailsDialogProps {
  transfer: BranchTransfer
  branches: any[]
  items: any[]
  onComplete: (transferId: string, receivedBy: string, notes?: string) => void
  onUpdateStatus: (transferId: string, status: string, notes?: string) => void
  canComplete: boolean
}

function TransferDetailsDialog({
  transfer,
  branches,
  items,
  onComplete,
  onUpdateStatus,
  canComplete,
}: TransferDetailsDialogProps) {
  const [receivedBy, setReceivedBy] = useState("")
  const [completionNotes, setCompletionNotes] = useState("")
  const [isCompleting, setIsCompleting] = useState(false)

  const getBranchName = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId)
    return branch ? branch.name : "Noma'lum filial"
  }

  const getItemDetails = (itemId: string) => {
    const item = items.find((i) => i.id === itemId)
    return item || { model: "Noma'lum mahsulot", category: "", weight: 0 }
  }

  const handleComplete = async () => {
    if (!receivedBy.trim()) {
      alert("Qabul qiluvchi ismini kiriting")
      return
    }

    setIsCompleting(true)
    try {
      await onComplete(transfer.id, receivedBy, completionNotes)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Qayerdan:</Label>
          <p>{getBranchName(transfer.fromBranchId)}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Qayerga:</Label>
          <p>{getBranchName(transfer.toBranchId)}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Boshlangan sana:</Label>
          <p>{new Date(transfer.initiatedDate).toLocaleString("uz-UZ")}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Boshlagan:</Label>
          <p>{transfer.initiatedBy}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Kuzatuv raqami:</Label>
          <p>{transfer.trackingNumber || "-"}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Transport:</Label>
          <p>{transfer.transportMethod || "-"}</p>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Sabab:</Label>
        <p>{transfer.reason}</p>
      </div>

      {transfer.notes && (
        <div>
          <Label className="text-sm font-medium">Izohlar:</Label>
          <p>{transfer.notes}</p>
        </div>
      )}

      <div>
        <Label className="text-sm font-medium">Ko'chiriladigan mahsulotlar:</Label>
        <div className="mt-2 space-y-2">
          {transfer.items.map((transferItem, index) => {
            const item = getItemDetails(transferItem.itemId)
            return (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium">{item.model}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.category} • {item.weight}g
                  </div>
                </div>
                <div className="text-right">
                  <div>Miqdor: {transferItem.quantity}</div>
                  <div className="text-sm text-muted-foreground">Holat: {transferItem.condition}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {canComplete && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Ko'chirishni yakunlash</h4>
          <div className="space-y-2">
            <Label htmlFor="receivedBy">Qabul qiluvchi *</Label>
            <Input
              id="receivedBy"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              placeholder="Qabul qiluvchi ism-sharifi"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="completionNotes">Qo'shimcha izohlar</Label>
            <Textarea
              id="completionNotes"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Qabul qilish haqida izohlar..."
              rows={3}
            />
          </div>
          <Button onClick={handleComplete} disabled={isCompleting || !receivedBy.trim()} className="w-full">
            {isCompleting ? "Yakunlanmoqda..." : "Ko'chirishni yakunlash"}
          </Button>
        </div>
      )}
    </div>
  )
}

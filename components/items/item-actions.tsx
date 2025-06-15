"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ItemBranchTransfer } from "./item-branch-transfer"
import { ItemEditForm } from "./item-edit-form"
import { ReturnToSupplierForm } from "./return-to-supplier-form"
import { itemService } from "@/lib/services/item.service"
import { useToast } from "@/hooks/use-toast"
import { useBranches } from "@/lib/hooks/use-branches"
import type { Item } from "@/lib/types/item"
import { MoreHorizontal, Edit, ArrowRight, ShoppingCart, RotateCcw, Trash2, Package, Building2 } from "lucide-react"

interface ItemActionsProps {
  item: Item
  onUpdate?: () => void
}

export function ItemActions({ item, onUpdate }: ItemActionsProps) {
  const { toast } = useToast()
  const { getBranchName } = useBranches()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusUpdate = async (status: Item["status"], additionalData?: any) => {
    setIsLoading(true)
    try {
      await itemService.updateItemStatus(item.id, status, additionalData)
      toast({
        title: "Muvaffaqiyatli",
        description: "Mahsulot holati yangilandi",
      })
      onUpdate?.()
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Mahsulot holatini yangilashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Bu mahsulotni o'chirishni xohlaysizmi?")) return

    setIsLoading(true)
    try {
      await itemService.deleteItem(item.id)
      toast({
        title: "Muvaffaqiyatli",
        description: "Mahsulot o'chirildi",
      })
      onUpdate?.()
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Mahsulotni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: Item["status"]) => {
    const statusConfig = {
      available: { label: "Mavjud", variant: "default" as const },
      sold: { label: "Sotilgan", variant: "secondary" as const },
      returned: { label: "Qaytarilgan", variant: "destructive" as const },
      transferred: { label: "Ko'chirilgan", variant: "outline" as const },
      reserved: { label: "Band qilingan", variant: "secondary" as const },
      returned_to_supplier: { label: "Ta'minotchiga qaytarilgan", variant: "destructive" as const },
    }

    const config = statusConfig[status] || statusConfig.available
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getLocationBadge = () => {
    if (item.isProvider) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          Markaziy inventar
        </Badge>
      )
    } else {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {getBranchName(item.branch || "")}
        </Badge>
      )
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {getStatusBadge(item.status)}
        {getLocationBadge()}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Amallar</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Tahrirlash
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setShowTransferDialog(true)}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Ko'chirish/Joylashuvni o'zgartirish
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {item.status === "available" && (
              <DropdownMenuItem onClick={() => handleStatusUpdate("sold", { soldDate: new Date().toISOString() })}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Sotilgan deb belgilash
              </DropdownMenuItem>
            )}

            {item.status === "sold" && (
              <DropdownMenuItem onClick={() => handleStatusUpdate("returned", { returnReason: "Mijoz qaytardi" })}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Qaytarilgan deb belgilash
              </DropdownMenuItem>
            )}

            {(item.status === "available" || item.status === "returned") && (
              <DropdownMenuItem onClick={() => setShowReturnDialog(true)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Ta'minotchiga qaytarish
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              O'chirish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mahsulotni tahrirlash</DialogTitle>
            <DialogDescription>
              {item.model} - {item.category}
            </DialogDescription>
          </DialogHeader>
          <ItemEditForm
            item={item}
            onSave={() => {
              setShowEditDialog(false)
              onUpdate?.()
            }}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mahsulotni ko'chirish</DialogTitle>
            <DialogDescription>
              {item.model} mahsulotini boshqa joyga ko'chirish yoki joylashuvini o'zgartirish
            </DialogDescription>
          </DialogHeader>
          <ItemBranchTransfer
            item={item}
            onTransferComplete={() => {
              setShowTransferDialog(false)
              onUpdate?.()
            }}
            onCancel={() => setShowTransferDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Return to Supplier Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ta'minotchiga qaytarish</DialogTitle>
            <DialogDescription>{item.model} mahsulotini ta'minotchiga qaytarish</DialogDescription>
          </DialogHeader>
          <ReturnToSupplierForm
            item={item}
            onReturn={() => {
              setShowReturnDialog(false)
              onUpdate?.()
            }}
            onCancel={() => setShowReturnDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

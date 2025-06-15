"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useBranches } from "@/lib/hooks/use-branches"
import { itemService } from "@/lib/services/item.service"
import { useToast } from "@/hooks/use-toast"
import type { Item } from "@/lib/types/item"
import { ArrowRight, Building2, Package } from "lucide-react"

interface ItemBranchTransferProps {
  item: Item
  onTransferComplete?: () => void
  onCancel?: () => void
}

export function ItemBranchTransfer({ item, onTransferComplete, onCancel }: ItemBranchTransferProps) {
  const { branches, getBranchName } = useBranches()
  const { toast } = useToast()
  const [selectedBranch, setSelectedBranch] = useState("")
  const [transferReason, setTransferReason] = useState("")
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter out current branch from available options
  const availableBranches = branches.filter((branch) => branch.id !== item.branch)

  const handleTransfer = async () => {
    if (!selectedBranch) {
      toast({
        title: "Xatolik",
        description: "Yangi filialni tanlang",
        variant: "destructive",
      })
      return
    }

    if (!transferReason.trim()) {
      toast({
        title: "Xatolik",
        description: "Transfer sababini kiriting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Update item with new branch
      await itemService.updateItem(item.id, {
        branch: selectedBranch,
        branchId: selectedBranch,
      })

      // Update status to transferred with additional data
      await itemService.updateItemStatus(item.id, "transferred", {
        transferredTo: selectedBranch,
        transferReason,
        transferDate,
        transferredBy: "current_user", // In real app, get from auth context
        previousBranch: item.branch,
      })

      toast({
        title: "Muvaffaqiyatli",
        description: `Mahsulot ${getBranchName(selectedBranch)} filialiga ko'chirildi`,
      })

      onTransferComplete?.()
    } catch (error) {
      console.error("Transfer error:", error)
      toast({
        title: "Xatolik",
        description: "Mahsulotni ko'chirishda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveFromBranch = async () => {
    setIsSubmitting(true)
    try {
      // Convert to central inventory
      await itemService.updateItem(item.id, {
        isProvider: true,
        branch: undefined,
        branchId: undefined,
      })

      await itemService.updateItemStatus(item.id, "available", {
        removedFromBranch: item.branch,
        removalReason: transferReason || "Markaziy inventarga qaytarildi",
        removalDate: transferDate,
        removedBy: "current_user",
      })

      toast({
        title: "Muvaffaqiyatli",
        description: "Mahsulot markaziy inventarga qaytarildi",
      })

      onTransferComplete?.()
    } catch (error) {
      console.error("Remove from branch error:", error)
      toast({
        title: "Xatolik",
        description: "Mahsulotni filialdan olib tashlashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="w-5 h-5" />
          Mahsulotni ko'chirish
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Item Info */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">{item.model}</h4>
            <Badge variant="outline">{item.category}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Og'irlik:</span> {item.weight}g
            </div>
            <div>
              <span className="text-muted-foreground">Narx:</span> {item.sellingPrice.toLocaleString()} so'm
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Joriy joylashuv:</span>{" "}
              {item.isProvider ? (
                <Badge variant="secondary">
                  <Package className="w-3 h-3 mr-1" />
                  Markaziy inventar
                </Badge>
              ) : (
                <Badge variant="default">
                  <Building2 className="w-3 h-3 mr-1" />
                  {getBranchName(item.branch || "")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Transfer Options */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transferDate">Transfer sanasi</Label>
            <Input
              id="transferDate"
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transferReason">Transfer sababi *</Label>
            <Textarea
              id="transferReason"
              placeholder="Nima uchun bu mahsulot ko'chirilmoqda?"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              rows={3}
            />
          </div>

          {!item.isProvider && (
            <>
              <div className="space-y-2">
                <Label htmlFor="targetBranch">Yangi filial</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filialni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} - {branch.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleTransfer}
                  disabled={isSubmitting || !selectedBranch || !transferReason.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? "Ko'chirilmoqda..." : "Boshqa filialga ko'chirish"}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleRemoveFromBranch}
                  disabled={isSubmitting || !transferReason.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? "Olib tashlanmoqda..." : "Markaziy inventarga qaytarish"}
                </Button>
              </div>
            </>
          )}

          {item.isProvider && (
            <div className="space-y-2">
              <Label htmlFor="targetBranch">Filialga yuborish</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Filialni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} - {branch.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={async () => {
                  if (!selectedBranch || !transferReason.trim()) return

                  setIsSubmitting(true)
                  try {
                    await itemService.updateItem(item.id, {
                      isProvider: false,
                      branch: selectedBranch,
                      branchId: selectedBranch,
                      distributedDate: transferDate,
                    })

                    await itemService.updateItemStatus(item.id, "transferred", {
                      transferredTo: selectedBranch,
                      transferReason,
                      transferDate,
                      transferredBy: "current_user",
                      fromCentral: true,
                    })

                    toast({
                      title: "Muvaffaqiyatli",
                      description: `Mahsulot ${getBranchName(selectedBranch)} filialiga yuborildi`,
                    })

                    onTransferComplete?.()
                  } catch (error) {
                    toast({
                      title: "Xatolik",
                      description: "Mahsulotni yuborishda xatolik yuz berdi",
                      variant: "destructive",
                    })
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
                disabled={isSubmitting || !selectedBranch || !transferReason.trim()}
                className="w-full"
              >
                {isSubmitting ? "Yuborilmoqda..." : "Filialga yuborish"}
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Bekor qilish
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

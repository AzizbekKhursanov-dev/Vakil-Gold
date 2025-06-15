"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils/currency"
import { itemService } from "@/lib/services/item.service"
import { Calculator, DollarSign, Package, Calendar } from "lucide-react"
import { format } from "date-fns"

interface Item {
  id: string
  model: string
  category: string
  weight: number
  lomNarxi: number
  supplierName: string
  purchaseDate: string
  paymentStatus: string
}

interface SupplierPaymentFormProps {
  onSuccess?: (data: any) => void
  onCancel?: () => void
}

export function SupplierPaymentForm({ onSuccess, onCancel }: SupplierPaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [payedLomNarxi, setPayedLomNarxi] = useState("")
  const [selectedItems, setSelectedItems] = useState<Item[]>([])
  const [availableItems, setAvailableItems] = useState<Item[]>([])
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      paymentDate: new Date().toISOString().split("T")[0],
      reference: "",
      notes: "",
    },
  })

  // Load suppliers and items
  useEffect(() => {
    loadSuppliers()
  }, [])

  // Load items when supplier is selected
  useEffect(() => {
    if (selectedSupplier) {
      loadSupplierItems(selectedSupplier)
    }
  }, [selectedSupplier])

  // Auto-select items when payment amount changes
  useEffect(() => {
    if (selectedSupplier && paymentAmount && payedLomNarxi && availableItems.length > 0) {
      autoSelectItems()
    }
  }, [selectedSupplier, paymentAmount, payedLomNarxi, availableItems])

  const loadSuppliers = async () => {
    try {
      // Get all items to extract unique suppliers
      const allItems = await itemService.getItems({ paymentStatus: "unpaid" })
      const uniqueSuppliers = Array.from(new Set(allItems.map((item) => item.supplierName).filter(Boolean))) as string[]
      setSuppliers(uniqueSuppliers)
    } catch (error) {
      console.error("Error loading suppliers:", error)
      toast({
        title: "Xatolik",
        description: "Ta'minotchilarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const loadSupplierItems = async (supplierName: string) => {
    try {
      const items = await itemService.getUnpaidItemsBySupplier(supplierName)
      setAvailableItems(items)
    } catch (error) {
      console.error("Error loading supplier items:", error)
      toast({
        title: "Xatolik",
        description: "Ta'minotchi mahsulotlarini yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const autoSelectItems = () => {
    const amount = Number(paymentAmount)
    const pricePerGram = Number(payedLomNarxi)

    if (!amount || !pricePerGram) return

    // Sort items by purchase date (oldest first)
    const sortedItems = [...availableItems].sort(
      (a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime(),
    )

    const selected: Item[] = []
    let remainingAmount = amount

    for (const item of sortedItems) {
      const itemCost = item.weight * pricePerGram
      if (remainingAmount >= itemCost) {
        selected.push(item)
        remainingAmount -= itemCost
      } else {
        break
      }
    }

    setSelectedItems(selected)
  }

  const calculateTotals = () => {
    const pricePerGram = Number(payedLomNarxi) || 0
    const totalWeight = selectedItems.reduce((sum, item) => sum + item.weight, 0)
    const totalOriginalCost = selectedItems.reduce((sum, item) => sum + item.weight * item.lomNarxi, 0)
    const totalPaymentCost = totalWeight * pricePerGram
    const priceDifference = totalPaymentCost - totalOriginalCost

    return {
      totalWeight,
      totalOriginalCost,
      totalPaymentCost,
      priceDifference,
      itemCount: selectedItems.length,
    }
  }

  const onSubmit = async (data: any) => {
    if (!selectedSupplier) {
      toast({
        title: "Xatolik",
        description: "Ta'minotchini tanlang",
        variant: "destructive",
      })
      return
    }

    if (selectedItems.length === 0) {
      toast({
        title: "Xatolik",
        description: "To'lov miqdori va narxni kiriting",
        variant: "destructive",
      })
      return
    }

    if (!payedLomNarxi) {
      toast({
        title: "Xatolik",
        description: "To'langan lom narxini kiriting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const totals = calculateTotals()

      const paymentData = {
        itemIds: selectedItems.map((item) => item.id),
        totalAmount: totals.totalPaymentCost,
        payedLomNarxi: Number(payedLomNarxi),
        originalLomNarxi: totals.totalOriginalCost / totals.totalWeight,
        priceDifference: Number(payedLomNarxi) - totals.totalOriginalCost / totals.totalWeight,
        supplierName: selectedSupplier,
        paymentDate: data.paymentDate,
        reference: data.reference,
        notes: data.notes,
      }

      if (onSuccess) {
        await onSuccess(paymentData)
      }

      reset()
      setSelectedSupplier("")
      setPaymentAmount("")
      setPayedLomNarxi("")
      setSelectedItems([])
      setAvailableItems([])
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message || "To'lovni amalga oshirishda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totals = calculateTotals()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Supplier Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            To'lov ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ta'minotchi *</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Ta'minotchini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">To'lov sanasi *</Label>
              <Input id="paymentDate" type="date" {...register("paymentDate", { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentAmount">To'lov miqdori (so'm) *</Label>
              <Input
                id="paymentAmount"
                type="number"
                placeholder="masalan: 50000000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payedLomNarxi">To'langan lom narxi (so'm/g) *</Label>
              <Input
                id="payedLomNarxi"
                type="number"
                placeholder="masalan: 850000"
                value={payedLomNarxi}
                onChange={(e) => setPayedLomNarxi(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Ma'lumotnoma</Label>
              <Input id="reference" {...register("reference")} placeholder="Hujjat raqami yoki ma'lumotnoma" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Izohlar</Label>
              <Textarea id="notes" {...register("notes")} placeholder="Qo'shimcha izohlar" rows={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-selected Items */}
      {selectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Tanlangan mahsulotlar ({selectedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Items List */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.model}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.category} • {item.weight}g • {formatCurrency(item.lomNarxi)}/g
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.purchaseDate), "dd/MM/yyyy")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(item.weight * Number(payedLomNarxi))}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.weight}g × {formatCurrency(Number(payedLomNarxi))}/g
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Jami mahsulotlar:</span>
                    <div className="font-medium">{totals.itemCount} ta</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Jami og'irlik:</span>
                    <div className="font-medium">{totals.totalWeight.toFixed(2)}g</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">To'lov miqdori:</span>
                    <div className="font-medium text-green-600">{formatCurrency(totals.totalPaymentCost)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Narx farqi:</span>
                    <div className={`font-medium ${totals.priceDifference >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {totals.priceDifference >= 0 ? "+" : ""}
                      {formatCurrency(totals.priceDifference)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculation Info */}
      {selectedSupplier && paymentAmount && payedLomNarxi && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Calculator className="h-5 w-5" />
              Hisoblash ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Tizim avtomatik ravishda</span> eng eski mahsulotlardan boshlab to'lov
                miqdoriga mos kelguncha mahsulotlarni tanlaydi.
              </p>
              <p>
                <span className="font-medium">To'lov miqdori:</span> {formatCurrency(Number(paymentAmount))}
              </p>
              <p>
                <span className="font-medium">Lom narxi:</span> {formatCurrency(Number(payedLomNarxi))}/g
              </p>
              <p>
                <span className="font-medium">Maksimal og'irlik:</span>{" "}
                {((Number(paymentAmount) || 0) / (Number(payedLomNarxi) || 1)).toFixed(2)}g
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Bekor qilish
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || selectedItems.length === 0}>
          {isSubmitting ? "To'lov amalga oshirilmoqda..." : `${selectedItems.length} ta mahsulot uchun to'lov qilish`}
        </Button>
      </div>
    </form>
  )
}

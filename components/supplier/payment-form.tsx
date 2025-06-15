"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { paymentTransactionSchema } from "@/lib/types/schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import type { Item } from "@/lib/types/item"
import { Calculator, AlertTriangle } from "lucide-react"

interface PaymentFormProps {
  items: Item[]
  onSuccess?: (data: any) => void
  onCancel?: () => void
}

export function PaymentForm({ items, onSuccess, onCancel }: PaymentFormProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [payedLomNarxi, setPayedLomNarxi] = useState<number>(0)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentTransactionSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split("T")[0],
    },
  })

  // Group items by supplier
  const itemsBySupplier = items.reduce(
    (acc, item) => {
      const supplier = item.supplierName || "Noma'lum ta'minotchi"
      if (!acc[supplier]) {
        acc[supplier] = []
      }
      acc[supplier].push(item)
      return acc
    },
    {} as Record<string, Item[]>,
  )

  // Calculate totals for selected items
  const selectedItemsData = items.filter((item) => selectedItems.includes(item.id))
  const originalTotal = selectedItemsData.reduce((sum, item) => sum + item.weight * item.lomNarxi, 0)
  const payedTotal = selectedItemsData.reduce((sum, item) => sum + item.weight * payedLomNarxi, 0)
  const priceDifference = payedTotal - originalTotal
  const averageOriginalPrice =
    selectedItemsData.length > 0 ? originalTotal / selectedItemsData.reduce((sum, item) => sum + item.weight, 0) : 0

  // Set default payed price to average original price
  useEffect(() => {
    if (averageOriginalPrice > 0 && payedLomNarxi === 0) {
      setPayedLomNarxi(averageOriginalPrice)
    }
  }, [averageOriginalPrice, payedLomNarxi])

  const handleItemSelection = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId])
    } else {
      setSelectedItems(selectedItems.filter((id) => id !== itemId))
    }
  }

  const handleSelectAllForSupplier = (supplier: string, checked: boolean) => {
    const supplierItemIds = itemsBySupplier[supplier].map((item) => item.id)
    if (checked) {
      setSelectedItems([...new Set([...selectedItems, ...supplierItemIds])])
    } else {
      setSelectedItems(selectedItems.filter((id) => !supplierItemIds.includes(id)))
    }
  }

  const onSubmit = async (data: any) => {
    if (selectedItems.length === 0) {
      toast({
        title: "Xatolik",
        description: "Kamida bitta mahsulot tanlash kerak",
        variant: "destructive",
      })
      return
    }

    if (payedLomNarxi <= 0) {
      toast({
        title: "Xatolik",
        description: "To'langan lom narxi 0 dan katta bo'lishi kerak",
        variant: "destructive",
      })
      return
    }

    const paymentData = {
      itemIds: selectedItems,
      totalAmount: payedTotal,
      payedLomNarxi,
      originalLomNarxi: averageOriginalPrice,
      priceDifference,
      supplierName: data.supplierName,
      paymentDate: data.paymentDate,
      reference: data.reference,
      notes: data.notes,
    }

    if (onSuccess) {
      await onSuccess(paymentData)
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            To'lov xulosasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Tanlangan mahsulotlar</Label>
              <div className="text-2xl font-bold">{selectedItems.length}</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Asl qiymat</Label>
              <div className="text-2xl font-bold">{formatCurrency(originalTotal)}</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">To'lanadigan qiymat</Label>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(payedTotal)}</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Narx farqi</Label>
              <div className={`text-2xl font-bold ${priceDifference >= 0 ? "text-green-600" : "text-red-600"}`}>
                {priceDifference >= 0 ? "+" : ""}
                {formatCurrency(priceDifference)}
              </div>
            </div>
          </div>

          {Math.abs(priceDifference) > originalTotal * 0.1 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Narx farqi asl qiymatning 10% dan ko'p. Iltimos, tekshiring.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>To'lov ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payedLomNarxi">To'langan lom narxi (so'm/g) *</Label>
                <Input
                  id="payedLomNarxi"
                  type="number"
                  value={payedLomNarxi}
                  onChange={(e) => setPayedLomNarxi(Number(e.target.value))}
                  placeholder="masalan: 820000"
                />
                <p className="text-xs text-muted-foreground">
                  O'rtacha asl narx: {formatCurrency(averageOriginalPrice)}/g
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierName">Ta'minotchi nomi *</Label>
                <Input id="supplierName" {...register("supplierName")} placeholder="Ta'minotchi nomi" />
                {errors.supplierName && <p className="text-sm text-red-500">{errors.supplierName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">To'lov sanasi *</Label>
                <Input id="paymentDate" type="date" {...register("paymentDate")} />
                {errors.paymentDate && <p className="text-sm text-red-500">{errors.paymentDate.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Ma'lumotnoma</Label>
                <Input id="reference" {...register("reference")} placeholder="Hujjat raqami" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Izohlar</Label>
              <Textarea id="notes" {...register("notes")} placeholder="Qo'shimcha izohlar" rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Item Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Mahsulotlarni tanlash</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(itemsBySupplier).map(([supplier, supplierItems]) => (
              <div key={supplier} className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{supplier}</h4>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`supplier-${supplier}`}
                      checked={supplierItems.every((item) => selectedItems.includes(item.id))}
                      onCheckedChange={(checked) => handleSelectAllForSupplier(supplier, checked as boolean)}
                    />
                    <Label htmlFor={`supplier-${supplier}`} className="text-sm">
                      Barchasini tanlash ({supplierItems.length})
                    </Label>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Kategoriya</TableHead>
                      <TableHead>Og'irlik</TableHead>
                      <TableHead>Lom narxi</TableHead>
                      <TableHead>Jami qiymat</TableHead>
                      <TableHead>Sana</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => handleItemSelection(item.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.model}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{item.weight}g</TableCell>
                        <TableCell>{formatCurrency(item.lomNarxi)}/g</TableCell>
                        <TableCell className="font-medium">{formatCurrency(item.weight * item.lomNarxi)}</TableCell>
                        <TableCell>{new Date(item.purchaseDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}

            {Object.keys(itemsBySupplier).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">To'lanmagan mahsulotlar topilmadi</div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button type="submit" disabled={selectedItems.length === 0}>
            To'lovni amalga oshirish ({formatCurrency(payedTotal)})
          </Button>
        </div>
      </form>
    </div>
  )
}

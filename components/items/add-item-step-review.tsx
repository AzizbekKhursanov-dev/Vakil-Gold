"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils/currency"
import { calculateSellingPrice } from "@/lib/calculations/pricing"
import { Loader2 } from "lucide-react"

interface AddItemStepReviewProps {
  onSubmit: () => void
  onPrevious: () => void
  formData: any
  isSubmitting?: boolean
}

export function AddItemStepReview({ onSubmit, onPrevious, formData, isSubmitting = false }: AddItemStepReviewProps) {
  // Calculate selling price
  const sellingPrice = calculateSellingPrice(
    formData.weight,
    formData.lomNarxi,
    formData.lomNarxiKirim,
    formData.laborCost,
    formData.profitPercentage,
    formData.isProvider,
  )

  const materialCost = formData.weight * (formData.isProvider ? formData.lomNarxi : formData.lomNarxiKirim)
  const laborTotal = formData.weight * formData.laborCost
  const totalCost = materialCost + laborTotal
  const profit = sellingPrice - totalCost

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Ma'lumotlarni ko'rib chiqish</h2>
        <p className="text-muted-foreground">Barcha ma'lumotlarni tekshiring va tasdiqlang</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Asosiy ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model:</span>
              <span className="font-medium">{formData.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kategoriya:</span>
              <Badge variant="secondary">{formData.category}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Og'irlik:</span>
              <span className="font-medium">{formData.weight} g</span>
            </div>
            {formData.size && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">O'lcham:</span>
                <span className="font-medium">{formData.size}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Miqdor:</span>
              <span className="font-medium">{formData.quantity} dona</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Xarid sanasi:</span>
              <span className="font-medium">{formData.purchaseDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Markaziy inventar:</span>
              <Badge variant={formData.isProvider ? "default" : "outline"}>{formData.isProvider ? "Ha" : "Yo'q"}</Badge>
            </div>
            {formData.branch && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filial:</span>
                <span className="font-medium">{formData.branch}</span>
              </div>
            )}
            {formData.supplierName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ta'minotchi:</span>
                <span className="font-medium">{formData.supplierName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">To'lov holati:</span>
              <Badge variant={formData.paymentStatus === "paid" ? "default" : "secondary"}>
                {formData.paymentStatus === "paid"
                  ? "To'langan"
                  : formData.paymentStatus === "partially_paid"
                    ? "Qisman to'langan"
                    : "To'lanmagan"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Narxlash ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lom narxi:</span>
              <span className="font-medium">{formatCurrency(formData.lomNarxi)}/g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lom narxi (kirim):</span>
              <span className="font-medium">{formatCurrency(formData.lomNarxiKirim)}/g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ishchi haqi:</span>
              <span className="font-medium">{formatCurrency(formData.laborCost)}/g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Foyda foizi:</span>
              <span className="font-medium">{formData.profitPercentage}%</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Material xarajati:</span>
              <span>{formatCurrency(materialCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ishchi haqi jami:</span>
              <span>{formatCurrency(laborTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Jami xarajat:</span>
              <span>{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Foyda:</span>
              <span className="text-green-600">{formatCurrency(profit)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Sotuv narxi:</span>
              <span className="text-lg text-primary">{formatCurrency(sellingPrice)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Qo'shimcha ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.color && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rang:</span>
                <span className="font-medium">{formData.color}</span>
              </div>
            )}
            {formData.purity && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tozalik:</span>
                <Badge variant="outline">{formData.purity}</Badge>
              </div>
            )}
            {formData.stoneType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tosh turi:</span>
                <span className="font-medium">{formData.stoneType}</span>
              </div>
            )}
            {formData.stoneWeight && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tosh og'irligi:</span>
                <span className="font-medium">{formData.stoneWeight} g</span>
              </div>
            )}
            {formData.manufacturer && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ishlab chiqaruvchi:</span>
                <span className="font-medium">{formData.manufacturer}</span>
              </div>
            )}
            {formData.notes && (
              <div>
                <span className="text-muted-foreground">Izohlar:</span>
                <p className="mt-1 text-sm bg-muted p-2 rounded">{formData.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Xulosa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">{formatCurrency(sellingPrice)}</div>
              <div className="text-sm text-muted-foreground">Sotuv narxi</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="font-bold text-green-600">{formatCurrency(profit)}</div>
                <div className="text-green-700">Foyda</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="font-bold text-blue-600">{((profit / totalCost) * 100).toFixed(1)}%</div>
                <div className="text-blue-700">Foyda darajasi</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={isSubmitting}>
          Orqaga
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting} className="min-w-[150px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            "Mahsulotni saqlash"
          )}
        </Button>
      </div>
    </div>
  )
}

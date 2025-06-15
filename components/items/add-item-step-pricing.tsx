"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { itemPricingSchema } from "@/lib/zod-schemas/item-schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateItemCosts } from "@/lib/calculations/pricing"
import { formatCurrency } from "@/lib/utils/currency"
import { useMemo } from "react"

interface AddItemStepPricingProps {
  onNext: (data: any) => void
  onPrevious: () => void
  initialData?: any
}

export function AddItemStepPricing({ onNext, onPrevious, initialData }: AddItemStepPricingProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(itemPricingSchema),
    defaultValues: {
      lomNarxi: initialData?.lomNarxi || 800000,
      lomNarxiKirim: initialData?.lomNarxiKirim || 850000,
      laborCost: initialData?.laborCost || 70000,
      profitPercentage: initialData?.profitPercentage || 20,
    },
  })

  const formValues = watch()
  const calculations = useMemo(() => {
    const combinedData = { ...initialData, ...formValues }
    if (combinedData.weight && combinedData.lomNarxi && combinedData.lomNarxiKirim && combinedData.laborCost) {
      return calculateItemCosts(combinedData)
    }
    return null
  }, [formValues, initialData])

  const onSubmit = (data: any) => {
    onNext(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Narx ma'lumotlari</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lomNarxi">Lom Narxi (so'm/g) *</Label>
              <Input
                id="lomNarxi"
                type="number"
                {...register("lomNarxi", { valueAsNumber: true })}
                placeholder="masalan: 800000"
              />
              {errors.lomNarxi && <p className="text-sm text-red-500">{errors.lomNarxi.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lomNarxiKirim">Lom Narxi Kirim (so'm/g) *</Label>
              <Input
                id="lomNarxiKirim"
                type="number"
                {...register("lomNarxiKirim", { valueAsNumber: true })}
                placeholder="masalan: 850000"
              />
              {errors.lomNarxiKirim && <p className="text-sm text-red-500">{errors.lomNarxiKirim.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="laborCost">Ishchi haqi (so'm/g) *</Label>
              <Input
                id="laborCost"
                type="number"
                {...register("laborCost", { valueAsNumber: true })}
                placeholder="masalan: 70000"
              />
              {errors.laborCost && <p className="text-sm text-red-500">{errors.laborCost.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profitPercentage">Foyda foizi (%) *</Label>
              <Input
                id="profitPercentage"
                type="number"
                step="0.1"
                {...register("profitPercentage", { valueAsNumber: true })}
                placeholder="masalan: 20"
              />
              {errors.profitPercentage && <p className="text-sm text-red-500">{errors.profitPercentage.message}</p>}
            </div>
          </div>

          {calculations && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Markaziy inventar narxlash</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Material xarajati:</span>
                    <span className="font-medium">{formatCurrency(calculations.central.materialCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ishchi haqi:</span>
                    <span className="font-medium">{formatCurrency(calculations.central.laborTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jami xarajat:</span>
                    <span className="font-medium">{formatCurrency(calculations.central.totalCost)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Sotuv narxi:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(calculations.central.sellingPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Foyda:</span>
                    <span className="font-medium text-green-600">{formatCurrency(calculations.central.profit)}</span>
                  </div>
                  {calculations.central.transferProfit && (
                    <div className="flex justify-between">
                      <span>Transfer foydasi:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(calculations.central.transferProfit)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filial inventar narxlash</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Material xarajati:</span>
                    <span className="font-medium">{formatCurrency(calculations.branch.materialCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ishchi haqi:</span>
                    <span className="font-medium">{formatCurrency(calculations.branch.laborTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jami xarajat:</span>
                    <span className="font-medium">{formatCurrency(calculations.branch.totalCost)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Sotuv narxi:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(calculations.branch.sellingPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Filial foydasi:</span>
                    <span className="font-medium text-green-600">{formatCurrency(calculations.branch.profit)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onPrevious}>
              Oldingi
            </Button>
            <Button type="submit">Keyingi qadam</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

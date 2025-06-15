"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { itemService } from "@/lib/services/item.service"
import { calculateSellingPrice } from "@/lib/calculations/pricing"
import { formatCurrency } from "@/lib/utils/currency"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"

interface Item {
  id: string
  model: string
  category: string
  weight: number
  lomNarxi: number
  lomNarxiKirim: number
  laborCost: number
  sellingPrice: number
  profitPercentage: number
  isProvider?: boolean
}

interface ProfitMarginUpdateFormProps {
  items: Item[]
  onSuccess: () => void
  onCancel: () => void
}

interface FormData {
  profitPercentage: number
}

export function ProfitMarginUpdateForm({ items, onSuccess, onCancel }: ProfitMarginUpdateFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // Use the average profit margin as the starting point
  const averageProfitMargin =
    items.length > 0 ? items.reduce((sum, item) => sum + item.profitPercentage, 0) / items.length : 30 // Default value if no items

  const { register, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      profitPercentage: averageProfitMargin,
    },
  })

  const currentProfitPercentage = watch("profitPercentage")

  // Calculate new selling prices based on the current profit percentage value
  const calculateNewPrices = (profitPercentage: number) => {
    return items.map((item) => {
      const newSellingPrice = calculateSellingPrice(
        item.weight,
        item.lomNarxi,
        item.lomNarxiKirim,
        item.laborCost,
        profitPercentage,
        item.isProvider,
      )

      const priceDifference = newSellingPrice - item.sellingPrice
      const percentageDifference = item.sellingPrice > 0 ? (priceDifference / item.sellingPrice) * 100 : 0

      return {
        ...item,
        newSellingPrice,
        priceDifference,
        percentageDifference,
      }
    })
  }

  const previewData = calculateNewPrices(currentProfitPercentage)

  const onSubmit = async (data: FormData) => {
    if (!previewMode) {
      setPreviewMode(true)
      return
    }

    setLoading(true)
    try {
      // Update each item with new profit percentage and recalculate selling price
      await Promise.all(
        items.map((item) => {
          const newSellingPrice = calculateSellingPrice(
            item.weight,
            item.lomNarxi,
            item.lomNarxiKirim,
            item.laborCost,
            data.profitPercentage,
            item.isProvider,
          )

          return itemService.updateItem(item.id, {
            profitPercentage: data.profitPercentage,
            sellingPrice: newSellingPrice,
          })
        }),
      )

      onSuccess()
    } catch (error) {
      console.error("Error updating profit margins:", error)
      toast({
        title: "Xatolik",
        description: "Foyda foizini yangilashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getPriceChangeIcon = (difference: number) => {
    if (difference > 0) return <ArrowUp className="h-3 w-3 text-green-600" />
    if (difference < 0) return <ArrowDown className="h-3 w-3 text-red-600" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  const getPriceChangeColor = (difference: number) => {
    if (difference > 0) return "text-green-600"
    if (difference < 0) return "text-red-600"
    return "text-gray-500"
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!previewMode ? (
        <>
          <div className="bg-muted p-4 rounded-md mb-4">
            <h3 className="font-medium mb-2">Tanlangan mahsulotlar: {items.length} ta</h3>
            <ul className="text-sm space-y-1 max-h-[150px] overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.model} - {item.category} ({item.weight}g)
                  </span>
                  <span className="font-medium">{formatCurrency(item.sellingPrice)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profitPercentage">Yangi foyda foizi (%)</Label>
            <Input
              id="profitPercentage"
              type="number"
              min="0"
              max="100"
              step="0.1"
              {...register("profitPercentage", {
                required: true,
                valueAsNumber: true,
              })}
            />
            <p className="text-sm text-muted-foreground">
              Joriy o'rtacha foyda foizi: {averageProfitMargin.toFixed(1)}%
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="bg-amber-50 p-4 rounded-md mb-4 border border-amber-200">
            <h3 className="font-medium mb-2 text-amber-800">Diqqat! Narxlar quyidagicha o'zgaradi:</h3>
            <p className="text-sm mb-4 text-amber-700">
              Foyda foizi: <strong>{currentProfitPercentage.toFixed(1)}%</strong>
            </p>
          </div>

          <div className="max-h-[300px] overflow-y-auto border rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joriy narx
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yangi narx
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    O'zgarish
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <div>
                        <div className="font-medium">{item.model}</div>
                        <div className="text-gray-500">
                          {item.category} ({item.weight}g)
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                      {formatCurrency(item.sellingPrice)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                      {formatCurrency(item.newSellingPrice)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <div className={`flex items-center ${getPriceChangeColor(item.priceDifference)}`}>
                        {getPriceChangeIcon(item.priceDifference)}
                        <span className="ml-1">{formatCurrency(Math.abs(item.priceDifference))}</span>
                        <span className="ml-1 text-xs">
                          ({item.percentageDifference > 0 ? "+" : ""}
                          {item.percentageDifference.toFixed(1)}%)
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Jami o'zgarishlar:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Jami joriy qiymat:</span>
                <div className="font-medium">
                  {formatCurrency(items.reduce((sum, item) => sum + item.sellingPrice, 0))}
                </div>
              </div>
              <div>
                <span className="text-blue-700">Jami yangi qiymat:</span>
                <div className="font-medium">
                  {formatCurrency(previewData.reduce((sum, item) => sum + item.newSellingPrice, 0))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Bekor qilish
        </Button>
        {previewMode && (
          <Button type="button" variant="outline" onClick={() => setPreviewMode(false)}>
            Orqaga
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Yangilanmoqda..." : previewMode ? "Tasdiqlash va yangilash" : "Ko'rib chiqish"}
        </Button>
      </div>
    </form>
  )
}

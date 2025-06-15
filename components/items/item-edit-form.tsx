"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { itemService } from "@/lib/services/item.service"
import { calculateItemCosts } from "@/lib/calculations/pricing"
import { formatCurrency } from "@/lib/utils/currency"
import { CATEGORIES, BRANCHES, COLORS, PURITIES } from "@/lib/config/constants"
import type { Item, ItemFormData } from "@/lib/types/item"
import { z } from "zod"

const itemEditSchema = z.object({
  model: z.string().min(1, "Model kiritish majburiy"),
  category: z.string().min(1, "Kategoriya tanlash majburiy"),
  weight: z.number().positive("Og'irlik 0 dan katta bo'lishi kerak"),
  lomNarxi: z.number().positive("Lom narxi 0 dan katta bo'lishi kerak"),
  lomNarxiKirim: z.number().positive("Lom narxi kirim 0 dan katta bo'lishi kerak"),
  laborCost: z.number().min(0, "Mehnat haqi 0 dan kichik bo'lmasligi kerak"),
  profitPercentage: z.number().min(0, "Foyda foizi 0 dan kichik bo'lmasligi kerak"),
  size: z.number().optional(),
  quantity: z.number().int().positive("Miqdor 1 dan katta bo'lishi kerak"),
  isProvider: z.boolean(),
  branch: z.string().optional(),
  color: z.string().optional(),
  purity: z.string().optional(),
  stoneType: z.string().optional(),
  stoneWeight: z.number().optional(),
  manufacturer: z.string().optional(),
  notes: z.string().optional(),
})

interface ItemEditFormProps {
  item: Item
  onSuccess: () => void
}

export function ItemEditForm({ item, onSuccess }: ItemEditFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemEditSchema),
    defaultValues: {
      model: item.model,
      category: item.category,
      weight: item.weight,
      lomNarxi: item.lomNarxi,
      lomNarxiKirim: item.lomNarxiKirim,
      laborCost: item.laborCost,
      profitPercentage: item.profitPercentage,
      size: item.size,
      quantity: item.quantity,
      isProvider: item.isProvider,
      branch: item.branch,
      color: item.color,
      purity: item.purity,
      stoneType: item.stoneType,
      stoneWeight: item.stoneWeight,
      manufacturer: item.manufacturer,
      notes: item.notes,
    },
  })

  const watchedValues = watch()
  const isProvider = watch("isProvider")
  const costs = calculateItemCosts(watchedValues)

  const onSubmit = async (data: ItemFormData) => {
    try {
      setIsLoading(true)
      await itemService.updateItem(item.id, data)

      toast({
        title: "Muvaffaqiyatli yangilandi",
        description: "Mahsulot ma'lumotlari yangilandi",
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Asosiy ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input id="model" {...register("model")} placeholder="Masalan: D MJ" />
              {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategoriya *</Label>
              <Select onValueChange={(value) => setValue("category", value)} defaultValue={item.category}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategoriya tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.nameUz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Og'irligi (gram) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                {...register("weight", { valueAsNumber: true })}
                placeholder="Masalan: 3.62"
              />
              {errors.weight && <p className="text-sm text-destructive">{errors.weight.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">O'lchami</Label>
              <Input
                id="size"
                type="number"
                step="0.5"
                {...register("size", { valueAsNumber: true })}
                placeholder="Masalan: 18.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Miqdori *</Label>
              <Input id="quantity" type="number" min="1" {...register("quantity", { valueAsNumber: true })} />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Information */}
        <Card>
          <CardHeader>
            <CardTitle>Narx ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lomNarxi">Lom Narxi (so'm/g) *</Label>
              <Input
                id="lomNarxi"
                type="number"
                {...register("lomNarxi", { valueAsNumber: true })}
                placeholder="800000"
              />
              {errors.lomNarxi && <p className="text-sm text-destructive">{errors.lomNarxi.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lomNarxiKirim">Lom Narxi Kirim (so'm/g) *</Label>
              <Input
                id="lomNarxiKirim"
                type="number"
                {...register("lomNarxiKirim", { valueAsNumber: true })}
                placeholder="850000"
              />
              {errors.lomNarxiKirim && <p className="text-sm text-destructive">{errors.lomNarxiKirim.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="laborCost">Mehnat haqi (so'm/g) *</Label>
              <Input
                id="laborCost"
                type="number"
                {...register("laborCost", { valueAsNumber: true })}
                placeholder="70000"
              />
              {errors.laborCost && <p className="text-sm text-destructive">{errors.laborCost.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profitPercentage">Foyda foizi (%) *</Label>
              <Input
                id="profitPercentage"
                type="number"
                {...register("profitPercentage", { valueAsNumber: true })}
                placeholder="20"
              />
              {errors.profitPercentage && <p className="text-sm text-destructive">{errors.profitPercentage.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Branch Information */}
        <Card>
          <CardHeader>
            <CardTitle>Filial ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isProvider"
                checked={isProvider}
                onCheckedChange={(checked) => setValue("isProvider", checked)}
              />
              <Label htmlFor="isProvider">Markaz (Ta'minotchi)</Label>
            </div>

            {!isProvider && (
              <div className="space-y-2">
                <Label htmlFor="branch">Filial *</Label>
                <Select onValueChange={(value) => setValue("branch", value)} defaultValue={item.branch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filial tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.filter((b) => !b.isProvider).map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Qo'shimcha ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="color">Rangi</Label>
              <Select onValueChange={(value) => setValue("color", value)} defaultValue={item.color}>
                <SelectTrigger>
                  <SelectValue placeholder="Rang tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((color) => (
                    <SelectItem key={color.id} value={color.id}>
                      {color.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purity">Tozaligi</Label>
              <Select onValueChange={(value) => setValue("purity", value)} defaultValue={item.purity}>
                <SelectTrigger>
                  <SelectValue placeholder="Tozalik tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {PURITIES.map((purity) => (
                    <SelectItem key={purity.id} value={purity.id}>
                      {purity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stoneType">Tosh turi</Label>
              <Input id="stoneType" {...register("stoneType")} placeholder="Masalan: Olmos, Yoqut" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stoneWeight">Tosh og'irligi (karat)</Label>
              <Input
                id="stoneWeight"
                type="number"
                step="0.01"
                {...register("stoneWeight", { valueAsNumber: true })}
                placeholder="Masalan: 0.50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Ishlab chiqaruvchi</Label>
              <Input id="manufacturer" {...register("manufacturer")} placeholder="Masalan: Vakil Gold Works" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Izohlar</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Mahsulot haqida qo'shimcha ma'lumotlar..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Preview */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Narx hisob-kitobi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">Markaz inventari</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Material narxi:</span>
                    <span>{formatCurrency(costs.central.materialCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mehnat haqi:</span>
                    <span>{formatCurrency(costs.central.laborTotal)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Jami xarajat:</span>
                    <span>{formatCurrency(costs.central.totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-primary">
                    <span>Sotuv narxi:</span>
                    <span>{formatCurrency(costs.central.sellingPrice)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Foyda:</span>
                    <span>{formatCurrency(costs.central.profit)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Filial inventari</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Material narxi (Kirim):</span>
                    <span>{formatCurrency(costs.branch.materialCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mehnat haqi:</span>
                    <span>{formatCurrency(costs.branch.laborTotal)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Jami xarajat:</span>
                    <span>{formatCurrency(costs.branch.totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-primary">
                    <span>Sotuv narxi:</span>
                    <span>{formatCurrency(costs.branch.sellingPrice)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Filial foydasi:</span>
                    <span>{formatCurrency(costs.branch.profit)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Transfer foydasi:</span>
                    <span>{formatCurrency(costs.central.transferProfit || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </form>
  )
}

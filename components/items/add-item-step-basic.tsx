"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { itemBasicSchema } from "@/lib/types/schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBranches } from "@/lib/hooks/use-branches"
import { useState, useEffect } from "react"

interface AddItemStepBasicProps {
  onNext: (data: any) => void
  initialData?: any
}

export function AddItemStepBasic({ onNext, initialData }: AddItemStepBasicProps) {
  const { branches, loading: branchesLoading } = useBranches()
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || "")
  const [selectedBranch, setSelectedBranch] = useState(initialData?.branch || "")
  const [isProvider, setIsProvider] = useState(initialData?.isProvider || false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(itemBasicSchema),
    defaultValues: {
      model: initialData?.model || "",
      category: initialData?.category || "",
      weight: initialData?.weight || 0,
      size: initialData?.size || undefined,
      quantity: initialData?.quantity || 1,
      purchaseDate: initialData?.purchaseDate || new Date().toISOString().split("T")[0],
      isProvider: initialData?.isProvider || false,
      branch: initialData?.branch || "",
      distributedDate: initialData?.distributedDate || "",
      supplierName: initialData?.supplierName || "",
      paymentStatus: initialData?.paymentStatus || "unpaid",
    },
  })

  const watchedIsProvider = watch("isProvider")

  useEffect(() => {
    setIsProvider(watchedIsProvider)
    if (watchedIsProvider) {
      setSelectedBranch("")
      setValue("branch", "")
    }
  }, [watchedIsProvider, setValue])

  const onSubmit = (data: any) => {
    const formData = {
      ...data,
      category: selectedCategory,
      branch: isProvider ? "" : selectedBranch,
      isProvider: isProvider,
    }
    console.log("Form data being submitted:", formData)
    onNext(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asosiy ma'lumotlar</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategoriya *</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value)
                  setValue("category", value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategoriyani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uzuk">Uzuk</SelectItem>
                  <SelectItem value="Sirg'a">Sirg'a</SelectItem>
                  <SelectItem value="Bilakuzuk">Bilakuzuk</SelectItem>
                  <SelectItem value="Zanjir">Zanjir</SelectItem>
                  <SelectItem value="Boshqa">Boshqa</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input id="model" {...register("model")} placeholder="masalan: D MJ" />
              {errors.model && <p className="text-sm text-red-500">{errors.model.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Og'irlik (gramm) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                {...register("weight", { valueAsNumber: true })}
                placeholder="masalan: 3.62"
              />
              {errors.weight && <p className="text-sm text-red-500">{errors.weight.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">O'lcham (ixtiyoriy)</Label>
              <Input
                id="size"
                type="number"
                step="0.5"
                {...register("size", { valueAsNumber: true })}
                placeholder="masalan: 18.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Miqdor *</Label>
              <Input id="quantity" type="number" min="1" {...register("quantity", { valueAsNumber: true })} />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Sotib olish sanasi *</Label>
              <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
              {errors.purchaseDate && <p className="text-sm text-red-500">{errors.purchaseDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierName">Ta'minotchi nomi</Label>
              <Input id="supplierName" {...register("supplierName")} placeholder="masalan: Oltin Bozor" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">To'lov holati</Label>
              <Select
                defaultValue="unpaid"
                onValueChange={(value) => setValue("paymentStatus", value as "unpaid" | "partially_paid" | "paid")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="To'lov holatini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">To'lanmagan</SelectItem>
                  <SelectItem value="partially_paid">Qisman to'langan</SelectItem>
                  <SelectItem value="paid">To'langan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
              <Switch
                id="isProvider"
                checked={isProvider}
                onCheckedChange={(checked) => {
                  setIsProvider(checked)
                  setValue("isProvider", checked)
                }}
              />
              <div className="flex-1">
                <Label htmlFor="isProvider" className="text-base font-medium">
                  Ombor inventari
                </Label>
                <p className="text-sm text-muted-foreground">
                  Agar bu mahsulot omborda saqlanayotgan bo'lsa, bu tugmani yoqing
                </p>
              </div>
            </div>

            {!isProvider && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-blue-50/50">
                <div className="space-y-2">
                  <Label htmlFor="branch">Filial * (majburiy)</Label>
                  {branchesLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-muted-foreground">Filiallar yuklanmoqda...</span>
                    </div>
                  ) : (
                    <Select
                      value={selectedBranch}
                      onValueChange={(value) => {
                        setSelectedBranch(value)
                        setValue("branch", value)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filialni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.length === 0 ? (
                          <SelectItem value="" disabled>
                            Filiallar topilmadi
                          </SelectItem>
                        ) : (
                          branches
                            .filter((branch) => !branch.isProvider) // Filter out provider/inventory branches
                            .map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.name} - {branch.location}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.branch && <p className="text-sm text-red-500">{errors.branch.message}</p>}
                  {!isProvider && !selectedBranch && (
                    <p className="text-sm text-amber-600">⚠️ Filial tanlash majburiy</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distributedDate">Taqsimlangan sana</Label>
                  <Input id="distributedDate" type="date" {...register("distributedDate")} />
                  <p className="text-xs text-muted-foreground">Mahsulot filialga qachon yuborilgani</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!isProvider && !selectedBranch}>
              Keyingi qadam
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

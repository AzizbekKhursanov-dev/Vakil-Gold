"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { branchService } from "@/lib/services/branch.service"
import { useBranches } from "@/lib/hooks/use-branches"
import type { Branch, BranchFormData } from "@/lib/types/branch"
import { useState } from "react"

interface BranchFormProps {
  branch?: Branch
  onSuccess?: () => void
}

export function BranchForm({ branch, onSuccess }: BranchFormProps) {
  const { toast } = useToast()
  const { branches } = useBranches()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BranchFormData>({
    defaultValues: {
      name: branch?.name || "",
      location: branch?.location || "",
      manager: branch?.manager || "",
      isProvider: branch?.isProvider || false,
      contactPhone: branch?.contactPhone || "",
      email: branch?.email || "",
      address: branch?.address || "",
      openingHours: branch?.openingHours || "",
      status: branch?.status || "active",
      description: branch?.description || "",
      salesTarget: branch?.salesTarget || 0,
      assistantManager: branch?.assistantManager || "",
      parentBranchId: branch?.parentBranchId || "",
    },
  })

  const isProvider = watch("isProvider")
  const status = watch("status")

  const onSubmit = async (data: BranchFormData) => {
    try {
      setIsSubmitting(true)

      if (branch) {
        await branchService.updateBranch(branch.id, data)
        toast({
          title: "Filial yangilandi",
          description: `"${data.name}" filiali muvaffaqiyatli yangilandi.`,
        })
      } else {
        await branchService.createBranch(data)
        toast({
          title: "Filial yaratildi",
          description: `"${data.name}" filiali muvaffaqiyatli yaratildi.`,
        })
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter out current branch from parent branch options
  const parentBranchOptions = branches.filter((b) => !branch || b.id !== branch.id)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Filial nomi *</Label>
            <Input
              id="name"
              placeholder="Masalan: Toshkent shahri"
              {...register("name", { required: "Filial nomi kiritish majburiy" })}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Joylashuv *</Label>
            <Input
              id="location"
              placeholder="Masalan: Toshkent"
              {...register("location", { required: "Joylashuv kiritish majburiy" })}
            />
            {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="manager">Boshqaruvchi *</Label>
            <Input
              id="manager"
              placeholder="Masalan: Alisher Usmanov"
              {...register("manager", { required: "Boshqaruvchi nomi kiritish majburiy" })}
            />
            {errors.manager && <p className="text-sm text-destructive">{errors.manager.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assistantManager">Yordamchi boshqaruvchi</Label>
            <Input id="assistantManager" placeholder="Masalan: Aziz Rahimov" {...register("assistantManager")} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Telefon raqami</Label>
            <Input id="contactPhone" placeholder="+998 90 123 45 67" {...register("contactPhone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Elektron pochta</Label>
            <Input id="email" type="email" placeholder="filial@example.com" {...register("email")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Manzil</Label>
          <Input id="address" placeholder="To'liq manzil" {...register("address")} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="openingHours">Ish vaqti</Label>
            <Input id="openingHours" placeholder="Masalan: 09:00 - 18:00" {...register("openingHours")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Holat</Label>
            <Select
              value={status}
              onValueChange={(value) => setValue("status", value as "active" | "inactive" | "maintenance")}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Holatni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="inactive">Faol emas</SelectItem>
                <SelectItem value="maintenance">Ta'mirlash</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salesTarget">Oylik sotuv maqsadi (so'm)</Label>
          <Input id="salesTarget" type="number" placeholder="0" {...register("salesTarget", { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentBranchId">Asosiy filial</Label>
          <Select
            value={watch("parentBranchId") || ""}
            onValueChange={(value) => setValue("parentBranchId", value === "none" ? "" : value)}
          >
            <SelectTrigger id="parentBranchId">
              <SelectValue placeholder="Asosiy filialni tanlang (ixtiyoriy)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Asosiy filial yo'q</SelectItem>
              {parentBranchOptions.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} - {b.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Agar bu filial boshqa filialga bo'ysunsa, asosiy filialni tanlang
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Tavsif</Label>
          <Textarea
            id="description"
            placeholder="Filial haqida qo'shimcha ma'lumot..."
            {...register("description")}
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="isProvider" checked={isProvider} onCheckedChange={(checked) => setValue("isProvider", checked)} />
          <Label htmlFor="isProvider">Bu ta'minotchi filiali (Markaz inventari)</Label>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saqlanmoqda..." : branch ? "Filialni yangilash" : "Filial yaratish"}
        </Button>
      </div>
    </form>
  )
}

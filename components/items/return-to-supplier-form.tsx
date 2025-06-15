"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils/currency"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { useToast } from "@/hooks/use-toast"
import type { Item } from "@/lib/types/item"

const returnReasons = ["defective", "wrong_item", "quality_issues", "price_dispute", "payment_issues", "other"] as const

const FormSchema = z.object({
  returnReason: z.enum(returnReasons, {
    required_error: "Qaytarish sababini tanlang",
  }),
  returnDate: z.string().min(1, {
    message: "Qaytarish sanasini kiriting",
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

interface ReturnToSupplierFormProps {
  item: Item
  onSuccess: () => void
  onCancel: () => void
}

export function ReturnToSupplierForm({ item, onSuccess, onCancel }: ReturnToSupplierFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      returnReason: "defective",
      returnDate: new Date().toISOString().split("T")[0],
      reference: "",
      notes: "",
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setIsSubmitting(true)

      // Update item status in Firestore
      const itemRef = doc(db, "items", item.id)
      await updateDoc(itemRef, {
        status: "returned_to_supplier",
        returnToSupplierDate: data.returnDate,
        returnToSupplierReason: data.returnReason,
        returnToSupplierReference: data.reference || null,
        returnToSupplierNotes: data.notes || null,
        updatedAt: new Date().toISOString(),
      })

      toast({
        title: "Mahsulot ta'minotchiga qaytarildi",
        description: "Mahsulot muvaffaqiyatli qaytarildi va inventarizatsiyadan olib tashlandi",
      })

      onSuccess()
    } catch (error) {
      console.error("Error returning item to supplier:", error)
      toast({
        title: "Xatolik",
        description: "Mahsulotni qaytarishda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "defective":
        return "Nuqsonli mahsulot"
      case "wrong_item":
        return "Noto'g'ri mahsulot"
      case "quality_issues":
        return "Sifat muammolari"
      case "price_dispute":
        return "Narx kelishmovchiligi"
      case "payment_issues":
        return "To'lov muammolari"
      case "other":
        return "Boshqa sabab"
      default:
        return reason
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Mahsulot ma'lumotlari</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-sm text-muted-foreground">Model:</span>
                <p className="font-medium">{item.model}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Kategoriya:</span>
                <p>{item.category}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Ta'minotchi:</span>
                <p>{item.supplierName || "—"}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Og'irlik:</span>
                <p>{item.weight} g</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Lom narxi:</span>
                <p>{formatCurrency(item.lomNarxi)}/g</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Jami qiymat:</span>
                <p className="font-medium">{formatCurrency(item.weight * item.lomNarxi)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="returnReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qaytarish sababi</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Qaytarish sababini tanlang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {returnReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {getReasonLabel(reason)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="returnDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qaytarish sanasi</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ma'lumotnoma (ixtiyoriy)</FormLabel>
                  <FormControl>
                    <Input placeholder="Hujjat raqami yoki ma'lumotnoma" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Izohlar (ixtiyoriy)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Qo'shimcha ma'lumotlar..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Bekor qilish
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Qaytarilmoqda..." : "Ta'minotchiga qaytarish"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

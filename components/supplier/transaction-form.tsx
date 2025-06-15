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
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { useToast } from "@/hooks/use-toast"

const transactionTypes = ["sale", "purchase", "transfer", "payment", "expense", "adjustment"] as const

const FormSchema = z.object({
  type: z.enum(transactionTypes, {
    required_error: "Tranzaksiya turini tanlang",
  }),
  amount: z.string().min(1, {
    message: "Summani kiriting",
  }),
  date: z.string().min(1, {
    message: "Sanani kiriting",
  }),
  description: z.string().min(1, {
    message: "Tavsifni kiriting",
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

interface TransactionFormProps {
  branchId: string
  branchName: string
  onSuccess: () => void
  onCancel: () => void
}

export function TransactionForm({ branchId, branchName, onSuccess, onCancel }: TransactionFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      type: "sale",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      reference: "",
      notes: "",
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setIsSubmitting(true)

      // Create transaction in Firestore
      const transactionData = {
        type: data.type,
        amount: Number.parseFloat(data.amount),
        date: data.date,
        description: data.description,
        reference: data.reference || null,
        notes: data.notes || null,
        branchId,
        branchName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await addDoc(collection(db, "branchTransactions"), transactionData)

      toast({
        title: "Tranzaksiya qo'shildi",
        description: "Yangi tranzaksiya muvaffaqiyatli qo'shildi",
      })

      onSuccess()
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast({
        title: "Xatolik",
        description: "Tranzaksiyani qo'shishda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sale":
        return "Sotish"
      case "purchase":
        return "Sotib olish"
      case "transfer":
        return "O'tkazma"
      case "payment":
        return "To'lov"
      case "expense":
        return "Xarajat"
      case "adjustment":
        return "Tuzatish"
      default:
        return type
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tranzaksiya turi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tranzaksiya turini tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {transactionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getTypeLabel(type)}
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
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Summa (so'm)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sana</FormLabel>
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
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Tavsif</FormLabel>
                <FormControl>
                  <Input placeholder="Tranzaksiya tavsifi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Izohlar (ixtiyoriy)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Qo'shimcha ma'lumotlar..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Bekor qilish
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

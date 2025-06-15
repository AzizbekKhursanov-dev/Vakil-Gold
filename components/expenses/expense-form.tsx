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
import { addDoc, collection, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"

const FormSchema = z.object({
  category: z.string().min(1, "Kategoriyani tanlang"),
  subcategory: z.string().optional(),
  amount: z.string().min(1, "Summani kiriting"),
  description: z.string().min(1, "Tavsifni kiriting"),
  date: z.string().min(1, "Sanani kiriting"),
  branchId: z.string().optional(),
  paymentMethod: z.string().min(1, "To'lov usulini tanlang"),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

interface ExpenseFormProps {
  expense?: any
  branches: any[]
  categories: string[]
  paymentMethods: string[]
  onSuccess: () => void
  onCancel: () => void
}

export function ExpenseForm({ expense, branches, categories, paymentMethods, onSuccess, onCancel }: ExpenseFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      category: expense?.category || "",
      subcategory: expense?.subcategory || "",
      amount: expense?.amount?.toString() || "",
      description: expense?.description || "",
      date: expense?.date || new Date().toISOString().split("T")[0],
      branchId: expense?.branchId || "",
      paymentMethod: expense?.paymentMethod || "",
      reference: expense?.reference || "",
      notes: expense?.notes || "",
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setIsSubmitting(true)

      const expenseData = {
        category: data.category,
        subcategory: data.subcategory || null,
        amount: Number.parseFloat(data.amount),
        description: data.description,
        date: data.date,
        branchId: data.branchId || null,
        branchName: data.branchId ? branches.find((b) => b.id === data.branchId)?.name : null,
        paymentMethod: data.paymentMethod,
        reference: data.reference || null,
        notes: data.notes || null,
        status: expense?.status || "pending",
        createdBy: "current-user", // This should come from auth context
        updatedAt: new Date().toISOString(),
      }

      if (expense) {
        // Update existing expense
        await updateDoc(doc(db, "expenses", expense.id), expenseData)
        toast({
          title: "Xarajat yangilandi",
          description: "Xarajat ma'lumotlari muvaffaqiyatli yangilandi",
        })
      } else {
        // Create new expense
        await addDoc(collection(db, "expenses"), {
          ...expenseData,
          createdAt: new Date().toISOString(),
        })
        toast({
          title: "Xarajat qo'shildi",
          description: "Yangi xarajat muvaffaqiyatli qo'shildi",
        })
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving expense:", error)
      toast({
        title: "Xatolik",
        description: "Xarajatni saqlashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const watchedAmount = form.watch("amount")
  const formattedAmount = watchedAmount ? formatCurrency(Number.parseFloat(watchedAmount) || 0) : ""

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategoriya *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategoriya tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
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
            name="subcategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pastki kategoriya</FormLabel>
                <FormControl>
                  <Input placeholder="Masalan: Elektr energiya" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Summa (so'm) *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1000000" {...field} />
                </FormControl>
                {formattedAmount && <p className="text-sm text-muted-foreground">{formattedAmount}</p>}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sana *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="branchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Filial</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Filial tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Umumiy xarajat</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
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
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To'lov usuli *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="To'lov usulini tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
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
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ma'lumotnoma</FormLabel>
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
                <FormLabel>Tavsif *</FormLabel>
                <FormControl>
                  <Input placeholder="Xarajat tavsifi" {...field} />
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
                <FormLabel>Izohlar</FormLabel>
                <FormControl>
                  <Textarea placeholder="Qo'shimcha ma'lumotlar..." {...field} rows={3} />
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
            {isSubmitting ? "Saqlanmoqda..." : expense ? "Yangilash" : "Saqlash"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

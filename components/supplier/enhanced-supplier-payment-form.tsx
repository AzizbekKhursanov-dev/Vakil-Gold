"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from "lucide-react"
import { generatePaymentReceiptPDF } from "@/lib/utils/pdf-generator"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/currency"
import { Calculator, Package, Calendar, Upload, FileText, X } from "lucide-react"
import { format } from "date-fns"

interface Item {
  id: string
  model: string
  category: string
  weight: number
  lomNarxi: number
  supplierName: string
  purchaseDate: string
  paymentStatus: string
  createdAt: string
}

interface PaymentAttachment {
  file: File
  name: string
  type: string
  size: number
}

interface EnhancedSupplierPaymentFormProps {
  onSuccess?: (data: any) => void
  onCancel?: () => void
}

export function EnhancedSupplierPaymentForm({ onSuccess, onCancel }: EnhancedSupplierPaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [payedLomNarxi, setPayedLomNarxi] = useState("")
  const [selectedItems, setSelectedItems] = useState<Item[]>([])
  const [availableItems, setAvailableItems] = useState<Item[]>([])
  const [attachments, setAttachments] = useState<PaymentAttachment[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      paymentDate: new Date().toISOString().split("T")[0],
      reference: "",
      notes: "",
    },
  })

  // Load suppliers from Firebase
  useEffect(() => {
    loadSuppliers()
  }, [])

  // Load items when supplier is selected
  useEffect(() => {
    if (selectedSupplier) {
      loadSupplierItems(selectedSupplier)
    } else {
      setAvailableItems([])
      setSelectedItems([])
    }
  }, [selectedSupplier])

  // Auto-select items when payment amount changes
  useEffect(() => {
    if (selectedSupplier && paymentAmount && payedLomNarxi && availableItems.length > 0) {
      autoSelectItems()
    }
  }, [selectedSupplier, paymentAmount, payedLomNarxi, availableItems])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const itemsQuery = query(collection(db, "items"), where("paymentStatus", "in", ["unpaid", "partially_paid"]))
      const snapshot = await getDocs(itemsQuery)

      const uniqueSuppliers = Array.from(
        new Set(snapshot.docs.map((doc) => doc.data().supplierName).filter(Boolean)),
      ) as string[]

      setSuppliers(uniqueSuppliers)
    } catch (error) {
      console.error("Error loading suppliers:", error)
      toast({
        title: "Xatolik",
        description: "Ta'minotchilarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSupplierItems = async (supplierName: string) => {
    try {
      setLoading(true)
      const itemsQuery = query(
        collection(db, "items"),
        where("supplierName", "==", supplierName),
        where("paymentStatus", "in", ["unpaid", "partially_paid"]),
        orderBy("createdAt", "asc"),
      )

      const snapshot = await getDocs(itemsQuery)
      const items = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        }
      }) as Item[]

      setAvailableItems(items)

      if (items.length === 0) {
        toast({
          title: "Ma'lumot",
          description: `${supplierName} ta'minotchisi uchun to'lanmagan mahsulotlar topilmadi`,
        })
      }
    } catch (error) {
      console.error("Error loading supplier items:", error)
      toast({
        title: "Xatolik",
        description: "Ta'minotchi mahsulotlarini yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
      setAvailableItems([])
    } finally {
      setLoading(false)
    }
  }

  const autoSelectItems = () => {
    const amount = Number(paymentAmount)
    const pricePerGram = Number(payedLomNarxi)

    if (!amount || !pricePerGram || availableItems.length === 0) {
      setSelectedItems([])
      return
    }

    // Sort items by purchase date (oldest first)
    const sortedItems = [...availableItems].sort(
      (a, b) => new Date(a.purchaseDate || a.createdAt).getTime() - new Date(b.purchaseDate || b.createdAt).getTime(),
    )

    const selected: Item[] = []
    let remainingAmount = amount

    for (const item of sortedItems) {
      const itemCost = (item.weight || 0) * pricePerGram
      if (remainingAmount >= itemCost && itemCost > 0) {
        selected.push(item)
        remainingAmount -= itemCost
      }

      // Stop if we've covered the payment amount
      if (remainingAmount <= 0) {
        break
      }
    }

    setSelectedItems(selected)
  }

  const calculateTotals = () => {
    const pricePerGram = Number(payedLomNarxi) || 0
    const totalWeight = selectedItems.reduce((sum, item) => sum + (item.weight || 0), 0)
    const totalOriginalCost = selectedItems.reduce((sum, item) => sum + (item.weight || 0) * (item.lomNarxi || 0), 0)
    const totalPaymentCost = totalWeight * pricePerGram
    const priceDifference = totalPaymentCost - totalOriginalCost

    return {
      totalWeight,
      totalOriginalCost,
      totalPaymentCost,
      priceDifference,
      itemCount: selectedItems.length,
    }
  }

  // Handle file attachments
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newAttachments: PaymentAttachment[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fayl hajmi katta",
          description: `${file.name} fayli 10MB dan katta. Iltimos kichikroq fayl tanlang.`,
          variant: "destructive",
        })
        continue
      }

      newAttachments.push({
        file,
        name: file.name,
        type: file.type,
        size: file.size,
      })
    }

    setAttachments([...attachments, ...newAttachments])

    // Clear input
    event.target.value = ""
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const generatePaymentReceipt = async (paymentData: any) => {
    try {
      const pdfBlob = await generatePaymentReceiptPDF({
        ...paymentData,
        items: selectedItems,
      })

      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `tolov-kvitansiyasi-${paymentData.reference || Date.now()}.pdf`
      link.click()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating receipt:", error)
      toast({
        title: "Xatolik",
        description: "Kvitansiya yaratishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (data: any) => {
    if (!selectedSupplier) {
      toast({
        title: "Xatolik",
        description: "Ta'minotchini tanlang",
        variant: "destructive",
      })
      return
    }

    if (selectedItems.length === 0) {
      toast({
        title: "Xatolik",
        description: "To'lov miqdori va narxni kiriting yoki mahsulotlar mavjud emas",
        variant: "destructive",
      })
      return
    }

    if (!payedLomNarxi) {
      toast({
        title: "Xatolik",
        description: "To'langan lom narxini kiriting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const totals = calculateTotals()

      const paymentData = {
        itemIds: selectedItems.map((item) => item.id),
        totalAmount: totals.totalPaymentCost,
        payedLomNarxi: Number(payedLomNarxi),
        originalLomNarxi: totals.totalWeight > 0 ? totals.totalOriginalCost / totals.totalWeight : 0,
        priceDifference:
          Number(payedLomNarxi) - (totals.totalWeight > 0 ? totals.totalOriginalCost / totals.totalWeight : 0),
        supplierName: selectedSupplier,
        paymentDate: data.paymentDate,
        reference: data.reference,
        notes: data.notes,
        attachments: attachments.map((att) => ({
          name: att.name,
          type: att.type,
          size: att.size,
          // In a real app, you would upload files to cloud storage
          // and store the URLs here
          url: URL.createObjectURL(att.file),
        })),
      }

      // Generate receipt PDF
      await generatePaymentReceipt(paymentData)

      if (onSuccess) {
        await onSuccess(paymentData)
      }

      toast({
        title: "To'lov amalga oshirildi",
        description: "To'lov kvitansiyasi yuklandi",
      })

      reset()
      setSelectedSupplier("")
      setPaymentAmount("")
      setPayedLomNarxi("")
      setSelectedItems([])
      setAvailableItems([])
      setAttachments([])
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message || "To'lovni amalga oshirishda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totals = calculateTotals()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            To'lov ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ta'minotchi *</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Yuklanmoqda..." : "Ta'minotchini tanlang"} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {suppliers.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground">To'lanmagan mahsulotlar topilmadi</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">To'lov sanasi *</Label>
              <Input id="paymentDate" type="date" {...register("paymentDate", { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentAmount">To'lov miqdori (so'm) *</Label>
              <Input
                id="paymentAmount"
                type="number"
                placeholder="masalan: 50000000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                disabled={!selectedSupplier || availableItems.length === 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payedLomNarxi">To'langan lom narxi (so'm/g) *</Label>
              <Input
                id="payedLomNarxi"
                type="number"
                placeholder="masalan: 850000"
                value={payedLomNarxi}
                onChange={(e) => setPayedLomNarxi(e.target.value)}
                disabled={!selectedSupplier || availableItems.length === 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Ma'lumotnoma</Label>
              <Input id="reference" {...register("reference")} placeholder="Hujjat raqami yoki ma'lumotnoma" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Izohlar</Label>
              <Textarea id="notes" {...register("notes")} placeholder="Qo'shimcha izohlar" rows={2} />
            </div>
          </div>

          {selectedSupplier && availableItems.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                {availableItems.length} ta to'lanmagan mahsulot mavjud
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Qo'shimcha hujjatlar (ixtiyoriy)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Fayllarni yuklash</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileUpload}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.querySelector('input[type="file"]')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Fayl tanlash
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              PDF, JPG, PNG, DOC, DOCX formatlarini qo'llab-quvvatlaydi. Maksimal hajm: 10MB
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Yuklangan fayllar ({attachments.length})</Label>
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{attachment.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {attachment.type} • {formatFileSize(attachment.size)}
                        </div>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-selected Items */}
      {selectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Tanlangan mahsulotlar ({selectedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.model}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.category} • {item.weight}g • {formatCurrency(item.lomNarxi || 0)}/g
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {item.purchaseDate
                          ? format(new Date(item.purchaseDate), "dd/MM/yyyy")
                          : format(new Date(item.createdAt), "dd/MM/yyyy")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency((item.weight || 0) * Number(payedLomNarxi))}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.weight}g × {formatCurrency(Number(payedLomNarxi))}/g
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Jami mahsulotlar:</span>
                    <div className="font-medium">{totals.itemCount} ta</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Jami og'irlik:</span>
                    <div className="font-medium">{totals.totalWeight.toFixed(2)}g</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">To'lov miqdori:</span>
                    <div className="font-medium text-green-600">{formatCurrency(totals.totalPaymentCost)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Narx farqi:</span>
                    <div className={`font-medium ${totals.priceDifference >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {totals.priceDifference >= 0 ? "+" : ""}
                      {formatCurrency(totals.priceDifference)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculation Info */}
      {selectedSupplier && paymentAmount && payedLomNarxi && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Calculator className="h-5 w-5" />
              Hisoblash ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Tizim avtomatik ravishda</span> eng eski mahsulotlardan boshlab to'lov
                miqdoriga mos kelguncha mahsulotlarni tanlaydi.
              </p>
              <p>
                <span className="font-medium">To'lov miqdori:</span> {formatCurrency(Number(paymentAmount))}
              </p>
              <p>
                <span className="font-medium">Lom narxi:</span> {formatCurrency(Number(payedLomNarxi))}/g
              </p>
              <p>
                <span className="font-medium">Maksimal og'irlik:</span>{" "}
                {((Number(paymentAmount) || 0) / (Number(payedLomNarxi) || 1)).toFixed(2)}g
              </p>
              {attachments.length > 0 && (
                <p>
                  <span className="font-medium">Qo'shimcha hujjatlar:</span> {attachments.length} ta fayl
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Bekor qilish
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || selectedItems.length === 0}>
          {isSubmitting ? "To'lov amalga oshirilmoqda..." : `${selectedItems.length} ta mahsulot uchun to'lov qilish`}
        </Button>
      </div>
    </form>
  )
}

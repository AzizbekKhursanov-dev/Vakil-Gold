"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import { generateSupplierConfirmationPDF } from "@/lib/utils/pdf-generator"
import { FileText, Download, Upload, CheckCircle, Clock, AlertTriangle, Package, User, Calendar } from "lucide-react"
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import type { Item } from "@/lib/types/item"

interface SupplierDocumentConfirmation {
  id: string
  supplierName: string
  itemIds: string[]
  documentNumber: string
  status: "draft" | "pdf_generated" | "sent_to_supplier" | "confirmed" | "rejected"
  confirmedDate?: string
  rejectedDate?: string
  adminNotes?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

interface SupplierDocumentConfirmationProps {
  items?: Item[]
  suppliers?: string[]
}

export function SupplierDocumentConfirmation({ items = [], suppliers = [] }: SupplierDocumentConfirmationProps) {
  const { toast } = useToast()
  const [confirmations, setConfirmations] = useState<SupplierDocumentConfirmation[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [adminNotes, setAdminNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null)

  // Safe arrays
  const safeItems = Array.isArray(items) ? items : []
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : []

  // Load confirmations from Firebase
  useEffect(() => {
    const confirmationsQuery = query(collection(db, "supplierConfirmations"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(confirmationsQuery, (snapshot) => {
      const confirmationsList = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        }
      }) as SupplierDocumentConfirmation[]
      setConfirmations(confirmationsList)
    })

    return () => unsubscribe()
  }, [])

  // Filter items by supplier
  const supplierItems = selectedSupplier
    ? safeItems.filter((item) => item.supplierName === selectedSupplier && !item.confirmed)
    : []

  const handleItemSelection = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId])
    } else {
      setSelectedItems(selectedItems.filter((id) => id !== itemId))
    }
  }

  const generateDocumentNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const time = String(date.getTime()).slice(-4)
    return `TSD-${year}${month}${day}-${time}`
  }

  const handleGeneratePDF = async () => {
    if (!selectedSupplier || selectedItems.length === 0) {
      toast({
        title: "Xatolik",
        description: "Ta'minotchi va mahsulotlarni tanlang",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const documentNumber = generateDocumentNumber()
      const selectedItemsData = safeItems.filter((item) => selectedItems.includes(item.id))

      // Create confirmation record
      const confirmationData = {
        supplierName: selectedSupplier,
        itemIds: selectedItems,
        documentNumber,
        status: "draft" as const,
        adminNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const docRef = await addDoc(collection(db, "supplierConfirmations"), confirmationData)

      // Generate PDF
      const pdfBlob = await generateSupplierConfirmationPDF({
        documentNumber,
        supplierName: selectedSupplier,
        items: selectedItemsData,
        adminNotes,
        createdDate: new Date().toISOString(),
      })

      // Update status to pdf_generated
      await updateDoc(doc(db, "supplierConfirmations", docRef.id), {
        status: "pdf_generated",
        updatedAt: new Date().toISOString(),
      })

      // Download PDF
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `tasdiqlash-hujjati-${documentNumber}.pdf`
      link.click()
      URL.revokeObjectURL(url)

      toast({
        title: "PDF yaratildi",
        description: `Hujjat ${documentNumber} muvaffaqiyatli yaratildi va yuklandi`,
      })

      // Reset form
      setSelectedSupplier("")
      setSelectedItems([])
      setAdminNotes("")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Xatolik",
        description: "PDF yaratishda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSignedDocument = async (confirmationId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast({
        title: "Xatolik",
        description: "Faqat PDF fayllarni yuklash mumkin",
        variant: "destructive",
      })
      return
    }

    setUploadingDocument(confirmationId)
    try {
      // In a real app, you would upload to cloud storage
      // For now, we'll just mark as confirmed
      const confirmation = confirmations.find((c) => c.id === confirmationId)
      if (!confirmation) return

      // Update confirmation status
      await updateDoc(doc(db, "supplierConfirmations", confirmationId), {
        status: "confirmed",
        confirmedDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Update items as confirmed
      const batch = confirmation.itemIds.map(async (itemId) => {
        await updateDoc(doc(db, "items", itemId), {
          confirmed: true,
          confirmedDate: new Date().toISOString(),
          confirmationId: confirmationId,
          updatedAt: new Date().toISOString(),
        })
      })

      await Promise.all(batch)

      toast({
        title: "Hujjat tasdiqlandi",
        description: `${confirmation.itemIds.length} ta mahsulot tasdiqlandi`,
      })
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Xatolik",
        description: "Hujjatni yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setUploadingDocument(null)
      // Clear file input
      event.target.value = ""
    }
  }

  const handleRejectConfirmation = async (confirmationId: string, reason: string) => {
    try {
      await updateDoc(doc(db, "supplierConfirmations", confirmationId), {
        status: "rejected",
        rejectedDate: new Date().toISOString(),
        rejectionReason: reason,
        updatedAt: new Date().toISOString(),
      })

      toast({
        title: "Hujjat rad etildi",
        description: "Tasdiqlash hujjati rad etildi",
      })
    } catch (error) {
      console.error("Error rejecting confirmation:", error)
      toast({
        title: "Xatolik",
        description: "Hujjatni rad etishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", text: "Qoralama", icon: Clock },
      pdf_generated: { color: "bg-blue-100 text-blue-800", text: "PDF yaratilgan", icon: FileText },
      sent_to_supplier: { color: "bg-yellow-100 text-yellow-800", text: "Yuborilgan", icon: Upload },
      confirmed: { color: "bg-green-100 text-green-800", text: "Tasdiqlangan", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800", text: "Rad etilgan", icon: AlertTriangle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  const calculateTotals = (itemIds: string[]) => {
    const items = safeItems.filter((item) => itemIds.includes(item.id))
    return {
      count: items.length,
      totalWeight: items.reduce((sum, item) => sum + (item.weight || 0), 0),
      totalValue: items.reduce((sum, item) => sum + (item.weight || 0) * (item.lomNarxi || 0), 0),
    }
  }

  return (
    <div className="space-y-6">
      {/* Create New Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Yangi tasdiqlash hujjati yaratish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ta'minotchi *</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Ta'minotchini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {safeSuppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Admin izohi</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Qo'shimcha izohlar..."
                rows={2}
              />
            </div>
          </div>

          {/* Item Selection */}
          {selectedSupplier && supplierItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Mahsulotlarni tanlang ({supplierItems.length} ta mavjud)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedItems(supplierItems.map((item) => item.id))}
                  >
                    Barchasini tanlash
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedItems([])}>
                    Tozalash
                  </Button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-4">
                {supplierItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleItemSelection(item.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.model}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.category} • {item.weight}g • {formatCurrency(item.lomNarxi || 0)}/g
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency((item.weight || 0) * (item.lomNarxi || 0))}</div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedItems.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tanlangan:</span>
                      <div className="font-medium">{selectedItems.length} ta</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Jami og'irlik:</span>
                      <div className="font-medium">
                        {safeItems
                          .filter((item) => selectedItems.includes(item.id))
                          .reduce((sum, item) => sum + (item.weight || 0), 0)
                          .toFixed(2)}
                        g
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Jami qiymat:</span>
                      <div className="font-medium">
                        {formatCurrency(
                          safeItems
                            .filter((item) => selectedItems.includes(item.id))
                            .reduce((sum, item) => sum + (item.weight || 0) * (item.lomNarxi || 0), 0),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedSupplier && supplierItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {selectedSupplier} ta'minotchisi uchun tasdiqlanmagan mahsulotlar topilmadi
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleGeneratePDF} disabled={loading || !selectedSupplier || selectedItems.length === 0}>
              {loading ? (
                "PDF yaratilmoqda..."
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  PDF yaratish va yuklash
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Confirmations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Tasdiqlash hujjatlari ({confirmations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {confirmations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Hali tasdiqlash hujjatlari yaratilmagan</div>
          ) : (
            <div className="space-y-4">
              {confirmations.map((confirmation) => {
                const totals = calculateTotals(confirmation.itemIds)
                return (
                  <div key={confirmation.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{confirmation.documentNumber}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {confirmation.supplierName}
                          </div>
                        </div>
                        {getStatusBadge(confirmation.status)}
                      </div>
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(confirmation.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Mahsulotlar:</span>
                        <div className="font-medium">{totals.count} ta</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Jami og'irlik:</span>
                        <div className="font-medium">{totals.totalWeight.toFixed(2)}g</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Jami qiymat:</span>
                        <div className="font-medium">{formatCurrency(totals.totalValue)}</div>
                      </div>
                    </div>

                    {confirmation.adminNotes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Admin izohi:</span>
                        <div className="mt-1 p-2 bg-muted rounded text-sm">{confirmation.adminNotes}</div>
                      </div>
                    )}

                    {/* Action buttons based on status */}
                    <div className="flex gap-2">
                      {confirmation.status === "pdf_generated" && (
                        <>
                          <div className="flex-1">
                            <Label htmlFor={`upload-${confirmation.id}`} className="text-sm">
                              Imzolangan hujjatni yuklash:
                            </Label>
                            <Input
                              id={`upload-${confirmation.id}`}
                              type="file"
                              accept=".pdf"
                              onChange={(e) => handleUploadSignedDocument(confirmation.id, e)}
                              disabled={uploadingDocument === confirmation.id}
                              className="mt-1"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectConfirmation(confirmation.id, "Admin tomonidan rad etildi")}
                          >
                            Rad etish
                          </Button>
                        </>
                      )}

                      {confirmation.status === "confirmed" && confirmation.confirmedDate && (
                        <div className="text-sm text-green-600">
                          ✓ {new Date(confirmation.confirmedDate).toLocaleDateString()} da tasdiqlangan
                        </div>
                      )}

                      {confirmation.status === "rejected" && (
                        <div className="text-sm text-red-600">
                          ✗ {confirmation.rejectedDate && new Date(confirmation.rejectedDate).toLocaleDateString()} da
                          rad etilgan
                          {confirmation.rejectionReason && (
                            <div className="mt-1 text-xs">Sabab: {confirmation.rejectionReason}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {uploadingDocument === confirmation.id && (
                      <div className="text-sm text-blue-600">Hujjat yuklanmoqda...</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

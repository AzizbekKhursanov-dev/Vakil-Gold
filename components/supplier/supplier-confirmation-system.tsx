"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils/currency"
import { CheckCircle, Clock, AlertTriangle, Send, FileText, Package, Plus } from "lucide-react"
import { collection, query, onSnapshot, addDoc, updateDoc, doc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface SupplierConfirmation {
  id: string
  supplierName: string
  itemIds: string[]
  totalAmount: number
  totalWeight: number
  status: "pending" | "sent" | "confirmed" | "rejected" | "expired"
  sentDate?: string
  confirmedDate?: string
  rejectedDate?: string
  expiryDate?: string
  confirmationCode: string
  supplierResponse?: {
    confirmed: boolean
    confirmedItems: string[]
    rejectedItems: string[]
    notes?: string
    confirmedAt: string
  }
  adminNotes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface SupplierConfirmationSystemProps {
  items: any[]
  suppliers: string[]
}

export function SupplierConfirmationSystem({ items, suppliers }: SupplierConfirmationSystemProps) {
  const { toast } = useToast()
  const [confirmations, setConfirmations] = useState<SupplierConfirmation[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedConfirmation, setSelectedConfirmation] = useState<SupplierConfirmation | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // Fetch confirmations
  useEffect(() => {
    const q = query(collection(db, "supplierConfirmations"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const confirmationsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SupplierConfirmation[]
      setConfirmations(confirmationsList)
    })

    return unsubscribe
  }, [])

  // Get unconfirmed items by supplier
  const getUnconfirmedItemsBySupplier = (supplierName: string) => {
    return items.filter(
      (item) => item.supplierName === supplierName && !item.confirmed && item.paymentStatus === "unpaid",
    )
  }

  // Generate confirmation code
  const generateConfirmationCode = () => {
    return `CONF-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  }

  // Create confirmation request
  const createConfirmationRequest = async () => {
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
      const selectedItemsData = items.filter((item) => selectedItems.includes(item.id))
      const totalAmount = selectedItemsData.reduce((sum, item) => sum + item.weight * item.lomNarxi, 0)
      const totalWeight = selectedItemsData.reduce((sum, item) => sum + item.weight, 0)

      const confirmationData: Omit<SupplierConfirmation, "id"> = {
        supplierName: selectedSupplier,
        itemIds: selectedItems,
        totalAmount,
        totalWeight,
        status: "pending",
        confirmationCode: generateConfirmationCode(),
        adminNotes,
        createdBy: "current-user", // Should come from auth context
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await addDoc(collection(db, "supplierConfirmations"), confirmationData)

      toast({
        title: "Tasdiqlash so'rovi yaratildi",
        description: `${selectedSupplier} uchun ${selectedItems.length} ta mahsulot tasdiqlanishi so'raldi`,
      })

      // Reset form
      setSelectedItems([])
      setSelectedSupplier("")
      setAdminNotes("")
      setShowCreateDialog(false)
    } catch (error) {
      console.error("Error creating confirmation:", error)
      toast({
        title: "Xatolik",
        description: "Tasdiqlash so'rovini yaratishda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Send confirmation to supplier
  const sendConfirmationToSupplier = async (confirmationId: string) => {
    try {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 7) // 7 days expiry

      await updateDoc(doc(db, "supplierConfirmations", confirmationId), {
        status: "sent",
        sentDate: new Date().toISOString(),
        expiryDate: expiryDate.toISOString(),
        updatedAt: new Date().toISOString(),
      })

      toast({
        title: "Yuborildi",
        description: "Tasdiqlash so'rovi ta'minotchiga yuborildi",
      })
    } catch (error) {
      console.error("Error sending confirmation:", error)
      toast({
        title: "Xatolik",
        description: "Yuborishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  // Process supplier confirmation
  const processSupplierConfirmation = async (
    confirmationId: string,
    confirmed: boolean,
    confirmedItems: string[],
    rejectedItems: string[],
    notes?: string,
  ) => {
    try {
      const batch = writeBatch(db)

      // Update confirmation record
      const confirmationRef = doc(db, "supplierConfirmations", confirmationId)
      batch.update(confirmationRef, {
        status: confirmed ? "confirmed" : "rejected",
        confirmedDate: confirmed ? new Date().toISOString() : undefined,
        rejectedDate: !confirmed ? new Date().toISOString() : undefined,
        supplierResponse: {
          confirmed,
          confirmedItems,
          rejectedItems,
          notes,
          confirmedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      })

      // Update confirmed items
      if (confirmed && confirmedItems.length > 0) {
        confirmedItems.forEach((itemId) => {
          const itemRef = doc(db, "items", itemId)
          batch.update(itemRef, {
            confirmed: true,
            confirmedDate: new Date().toISOString(),
            confirmationId,
            updatedAt: new Date().toISOString(),
          })
        })
      }

      await batch.commit()

      toast({
        title: confirmed ? "Tasdiqlandi" : "Rad etildi",
        description: `Ta'minotchi ${confirmed ? "tasdiqladi" : "rad etdi"}`,
      })
    } catch (error) {
      console.error("Error processing confirmation:", error)
      toast({
        title: "Xatolik",
        description: "Tasdiqlashni qayta ishlashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Kutilmoqda</Badge>
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Yuborilgan</Badge>
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Tasdiqlangan</Badge>
      case "rejected":
        return <Badge variant="destructive">Rad etilgan</Badge>
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800">Muddati o'tgan</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Calculate stats
  const stats = {
    totalConfirmations: confirmations.length,
    pendingConfirmations: confirmations.filter((c) => c.status === "pending").length,
    sentConfirmations: confirmations.filter((c) => c.status === "sent").length,
    confirmedConfirmations: confirmations.filter((c) => c.status === "confirmed").length,
    rejectedConfirmations: confirmations.filter((c) => c.status === "rejected").length,
    totalConfirmedItems: confirmations
      .filter((c) => c.status === "confirmed")
      .reduce((sum, c) => sum + (c.supplierResponse?.confirmedItems.length || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami so'rovlar</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConfirmations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kutilmoqda</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingConfirmations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yuborilgan</CardTitle>
            <Send className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sentConfirmations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasdiqlangan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmedConfirmations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rad etilgan</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejectedConfirmations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasdiqlangan mahsulotlar</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalConfirmedItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ta'minotchi tasdiqlash tizimi</span>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Yangi tasdiqlash so'rovi
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Confirmations List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasdiqlash so'rovlari ({confirmations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {confirmations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tasdiqlash kodi</TableHead>
                  <TableHead>Ta'minotchi</TableHead>
                  <TableHead>Mahsulotlar soni</TableHead>
                  <TableHead>Jami summa</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Yaratilgan</TableHead>
                  <TableHead>Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmations.map((confirmation) => (
                  <TableRow key={confirmation.id}>
                    <TableCell className="font-medium">{confirmation.confirmationCode}</TableCell>
                    <TableCell>{confirmation.supplierName}</TableCell>
                    <TableCell>{confirmation.itemIds.length} ta</TableCell>
                    <TableCell>{formatCurrency(confirmation.totalAmount)}</TableCell>
                    <TableCell>{getStatusBadge(confirmation.status)}</TableCell>
                    <TableCell>{new Date(confirmation.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedConfirmation(confirmation)
                            setShowDetailsDialog(true)
                          }}
                        >
                          Ko'rish
                        </Button>
                        {confirmation.status === "pending" && (
                          <Button size="sm" onClick={() => sendConfirmationToSupplier(confirmation.id)}>
                            Yuborish
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Tasdiqlash so'rovlari yo'q</div>
          )}
        </CardContent>
      </Card>

      {/* Create Confirmation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi tasdiqlash so'rovi yaratish</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ta'minotchi *</label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ta'minotchini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Admin izohi</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Qo'shimcha izohlar..."
                  rows={3}
                />
              </div>
            </div>

            {selectedSupplier && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Mahsulotlarni tanlang</h3>
                  <div className="text-sm text-muted-foreground">{selectedItems.length} ta tanlangan</div>
                </div>

                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedItems.length === getUnconfirmedItemsBySupplier(selectedSupplier).length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedItems(getUnconfirmedItemsBySupplier(selectedSupplier).map((item) => item.id))
                              } else {
                                setSelectedItems([])
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Kategoriya</TableHead>
                        <TableHead>Og'irlik</TableHead>
                        <TableHead>Lom narxi</TableHead>
                        <TableHead>Jami qiymat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getUnconfirmedItemsBySupplier(selectedSupplier).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedItems.includes(item.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedItems([...selectedItems, item.id])
                                } else {
                                  setSelectedItems(selectedItems.filter((id) => id !== item.id))
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{item.model}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.weight}g</TableCell>
                          <TableCell>{formatCurrency(item.lomNarxi)}/g</TableCell>
                          <TableCell>{formatCurrency(item.weight * item.lomNarxi)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {selectedItems.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tanlangan mahsulotlar:</span>
                        <div className="font-medium">{selectedItems.length} ta</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Jami og'irlik:</span>
                        <div className="font-medium">
                          {items
                            .filter((item) => selectedItems.includes(item.id))
                            .reduce((sum, item) => sum + item.weight, 0)
                            .toFixed(2)}
                          g
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Jami qiymat:</span>
                        <div className="font-medium">
                          {formatCurrency(
                            items
                              .filter((item) => selectedItems.includes(item.id))
                              .reduce((sum, item) => sum + item.weight * item.lomNarxi, 0),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Bekor qilish
              </Button>
              <Button
                onClick={createConfirmationRequest}
                disabled={loading || !selectedSupplier || selectedItems.length === 0}
              >
                {loading ? "Yaratilmoqda..." : "Tasdiqlash so'rovi yaratish"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tasdiqlash so'rovi tafsilotlari</DialogTitle>
          </DialogHeader>

          {selectedConfirmation && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tasdiqlash kodi</label>
                  <div className="font-medium">{selectedConfirmation.confirmationCode}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ta'minotchi</label>
                  <div className="font-medium">{selectedConfirmation.supplierName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Holat</label>
                  <div>{getStatusBadge(selectedConfirmation.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Yaratilgan</label>
                  <div>{new Date(selectedConfirmation.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Mahsulotlar ({selectedConfirmation.itemIds.length})</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Kategoriya</TableHead>
                      <TableHead>Og'irlik</TableHead>
                      <TableHead>Lom narxi</TableHead>
                      <TableHead>Tasdiqlangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items
                      .filter((item) => selectedConfirmation.itemIds.includes(item.id))
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.model}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.weight}g</TableCell>
                          <TableCell>{formatCurrency(item.lomNarxi)}/g</TableCell>
                          <TableCell>
                            {item.confirmed ? (
                              <Badge className="bg-green-100 text-green-800">Ha</Badge>
                            ) : (
                              <Badge variant="outline">Yo'q</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              {/* Supplier Response */}
              {selectedConfirmation.supplierResponse && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Ta'minotchi javobi</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tasdiqlangan mahsulotlar</label>
                        <div className="font-medium">
                          {selectedConfirmation.supplierResponse.confirmedItems.length} ta
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Rad etilgan mahsulotlar</label>
                        <div className="font-medium">
                          {selectedConfirmation.supplierResponse.rejectedItems.length} ta
                        </div>
                      </div>
                    </div>
                    {selectedConfirmation.supplierResponse.notes && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Ta'minotchi izohi</label>
                        <div className="mt-1">{selectedConfirmation.supplierResponse.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedConfirmation.adminNotes && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Admin izohi</label>
                  <div className="bg-blue-50 p-3 rounded">{selectedConfirmation.adminNotes}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

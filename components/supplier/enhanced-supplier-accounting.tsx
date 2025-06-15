"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import { TransactionTable } from "./transaction-table"
import { EnhancedSupplierPaymentForm } from "./enhanced-supplier-payment-form"
import { ItemPaymentList } from "./item-payment-list"
import { ProfitLossReport } from "./profit-loss-report"
import { SupplierDocumentConfirmation } from "./supplier-document-confirmation"
import {
  Plus,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Search,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { collection, query, orderBy, onSnapshot, addDoc } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Item } from "@/lib/types/item"
import { exportEnhancedSupplierAccountingToExcel } from "@/lib/utils/enhanced-supplier-excel"
import { itemService } from "@/lib/services/item.service"
import { ReturnedItemsList } from "./returned-items-list"

interface SupplierTransaction {
  id: string
  type: "payment" | "purchase" | "adjustment"
  itemIds?: string[]
  totalAmount: number
  payedLomNarxi: number
  originalLomNarxi?: number
  priceDifference?: number
  supplierName: string
  transactionDate: string
  paymentDate?: string
  description?: string
  reference?: string
  notes?: string
  attachments?: Array<{
    name: string
    type: string
    size: number
    url: string
  }>
  createdAt: string
  updatedAt: string
}

interface SupplierDocumentConfirmationData {
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
}

export function EnhancedSupplierAccounting() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [transactions, setTransactions] = useState<SupplierTransaction[]>([])
  const [confirmations, setConfirmations] = useState<SupplierDocumentConfirmationData[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [showItemDetails, setShowItemDetails] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [paymentStatus, setPaymentStatus] = useState("all")
  const [confirmationStatus, setConfirmationStatus] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Fetch data from Firebase
  useEffect(() => {
    setLoading(true)

    try {
      // Fetch transactions
      const transactionsQuery = query(collection(db, "supplierTransactions"), orderBy("transactionDate", "desc"))
      const unsubscribeTransactions = onSnapshot(
        transactionsQuery,
        (snapshot) => {
          const transactionsList = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
            }
          }) as SupplierTransaction[]
          setTransactions(transactionsList)
        },
        (error) => {
          console.error("Error fetching transactions:", error)
          toast({
            title: "Xatolik",
            description: "Tranzaksiyalarni yuklashda xatolik yuz berdi",
            variant: "destructive",
          })
        },
      )

      // Fetch confirmations
      const confirmationsQuery = query(collection(db, "supplierConfirmations"), orderBy("createdAt", "desc"))
      const unsubscribeConfirmations = onSnapshot(
        confirmationsQuery,
        (snapshot) => {
          const confirmationsList = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
            }
          }) as SupplierDocumentConfirmationData[]
          setConfirmations(confirmationsList)
        },
        (error) => {
          console.error("Error fetching confirmations:", error)
        },
      )

      // Fetch items
      const itemsQuery = query(collection(db, "items"), orderBy("createdAt", "desc"))
      const unsubscribeItems = onSnapshot(
        itemsQuery,
        (snapshot) => {
          const itemsList = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              paymentStatus: data.paymentStatus || "unpaid",
              confirmed: data.confirmed || false,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
            }
          }) as Item[]
          setItems(itemsList)
          setLoading(false)
        },
        (error) => {
          console.error("Error fetching items:", error)
          setLoading(false)
          toast({
            title: "Xatolik",
            description: "Mahsulotlarni yuklashda xatolik yuz berdi",
            variant: "destructive",
          })
        },
      )

      return () => {
        unsubscribeTransactions()
        unsubscribeConfirmations()
        unsubscribeItems()
      }
    } catch (error) {
      console.error("Error setting up listeners:", error)
      setLoading(false)
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }, [toast])

  // Safe array operations with null checks
  const safeItems = Array.isArray(items) ? items : []
  const safeTransactions = Array.isArray(transactions) ? transactions : []
  const safeConfirmations = Array.isArray(confirmations) ? confirmations : []

  // Separate returned to supplier items
  const returnedToSupplierItems = safeItems.filter((item) => item.status === "returned_to_supplier")

  // Filter items based on payment status and other criteria
  const filteredItems = safeItems.filter((item) => {
    if (search) {
      const searchTerm = search.toLowerCase()
      if (
        !item.model?.toLowerCase().includes(searchTerm) &&
        !item.supplierName?.toLowerCase().includes(searchTerm) &&
        !item.category?.toLowerCase().includes(searchTerm)
      ) {
        return false
      }
    }

    if (supplierFilter !== "all" && item.supplierName !== supplierFilter) return false
    if (paymentStatus !== "all" && item.paymentStatus !== paymentStatus) return false
    if (confirmationStatus !== "all") {
      const isConfirmed = confirmationStatus === "confirmed"
      if (item.confirmed !== isConfirmed) return false
    }
    if (startDate && new Date(item.purchaseDate || item.createdAt) < new Date(startDate)) return false
    if (endDate && new Date(item.purchaseDate || item.createdAt) > new Date(endDate)) return false

    return true
  })

  // Separate paid and unpaid items
  const paidItems = filteredItems.filter((item) => item.paymentStatus === "paid")
  const unpaidItems = filteredItems.filter((item) => item.paymentStatus === "unpaid")
  const partiallyPaidItems = filteredItems.filter((item) => item.paymentStatus === "partially_paid")
  const confirmedItems = filteredItems.filter((item) => item.confirmed)
  const unconfirmedItems = filteredItems.filter((item) => !item.confirmed)

  // Calculate enhanced totals with safety checks
  const totals = {
    totalItems: filteredItems.length,
    paidItems: paidItems.length,
    unpaidItems: unpaidItems.length,
    partiallyPaidItems: partiallyPaidItems.length,
    confirmedItems: confirmedItems.length,
    unconfirmedItems: unconfirmedItems.length,
    returnedToSupplierItems: returnedToSupplierItems.length,
    totalValue: filteredItems.reduce((sum, item) => sum + (item.weight || 0) * (item.lomNarxi || 0), 0),
    paidValue: paidItems.reduce(
      (sum, item) => sum + (item.weight || 0) * (item.payedLomNarxi || item.lomNarxi || 0),
      0,
    ),
    unpaidValue: unpaidItems.reduce((sum, item) => sum + (item.weight || 0) * (item.lomNarxi || 0), 0),
    confirmedValue: confirmedItems.reduce((sum, item) => sum + (item.weight || 0) * (item.lomNarxi || 0), 0),
    unconfirmedValue: unconfirmedItems.reduce((sum, item) => sum + (item.weight || 0) * (item.lomNarxi || 0), 0),
    returnedValue: returnedToSupplierItems.reduce((sum, item) => sum + (item.weight || 0) * (item.lomNarxi || 0), 0),
    priceDifference: paidItems.reduce((sum, item) => sum + (item.priceDifference || 0) * (item.weight || 0), 0),
  }

  // Get unique suppliers
  const suppliers = Array.from(new Set(safeItems.map((item) => item.supplierName).filter(Boolean)))

  const handlePayment = async (paymentData: any) => {
    try {
      // Create payment transaction
      const transactionData = {
        type: "payment",
        itemIds: paymentData.itemIds || [],
        totalAmount: paymentData.totalAmount || 0,
        payedLomNarxi: paymentData.payedLomNarxi || 0,
        originalLomNarxi: paymentData.originalLomNarxi || 0,
        priceDifference: paymentData.priceDifference || 0,
        supplierName: paymentData.supplierName || "",
        transactionDate: paymentData.paymentDate || new Date().toISOString(),
        paymentDate: paymentData.paymentDate || new Date().toISOString(),
        reference: paymentData.reference || "",
        notes: paymentData.notes || "",
        attachments: paymentData.attachments || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await addDoc(collection(db, "supplierTransactions"), transactionData)

      // Update items payment status using the service
      if (paymentData.itemIds && paymentData.itemIds.length > 0) {
        await itemService.updateItemsPaymentStatus(paymentData.itemIds, paymentData)
      }

      setShowPaymentForm(false)
      toast({
        title: "To'lov amalga oshirildi",
        description: "Ta'minotchiga to'lov muvaffaqiyatli amalga oshirildi",
      })
    } catch (error: any) {
      console.error("Error processing payment:", error)
      toast({
        title: "Xatolik",
        description: "To'lovni amalga oshirishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleExportExcel = async () => {
    try {
      await exportEnhancedSupplierAccountingToExcel({
        transactions: safeTransactions,
        confirmations: safeConfirmations,
        items: filteredItems,
        paidItems,
        unpaidItems,
        confirmedItems,
        unconfirmedItems,
        totals,
        filters: {
          search,
          supplierFilter: supplierFilter === "all" ? undefined : supplierFilter,
          paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
          confirmationStatus: confirmationStatus === "all" ? undefined : confirmationStatus,
          startDate,
          endDate,
        },
      })

      toast({
        title: "Eksport muvaffaqiyatli",
        description: "Ta'minotchi hisoboti Excel faylga eksport qilindi",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Eksport xatoligi",
        description: "Excel faylga eksport qilishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const clearFilters = () => {
    setSearch("")
    setSupplierFilter("all")
    setPaymentStatus("all")
    setConfirmationStatus("all")
    setStartDate("")
    setEndDate("")
  }

  const handleViewItemDetails = (item: Item) => {
    setSelectedItem(item)
    setShowItemDetails(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami Mahsulotlar</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalItems}</div>
            <p className="text-xs text-muted-foreground">Jami qiymat: {formatCurrency(totals.totalValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To'langan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totals.paidItems}</div>
            <p className="text-xs text-muted-foreground">Qiymat: {formatCurrency(totals.paidValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To'lanmagan</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totals.unpaidItems}</div>
            <p className="text-xs text-muted-foreground">Qiymat: {formatCurrency(totals.unpaidValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasdiqlangan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totals.confirmedItems}</div>
            <p className="text-xs text-muted-foreground">Qiymat: {formatCurrency(totals.confirmedValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasdiqlanmagan</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totals.unconfirmedItems}</div>
            <p className="text-xs text-muted-foreground">Qiymat: {formatCurrency(totals.unconfirmedValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Narx Farqi</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.priceDifference >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totals.priceDifference)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.priceDifference >= 0 ? "Tejamkorlik" : "Qo'shimcha xarajat"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qaytarilgan</CardTitle>
            <RotateCcw className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totals.returnedToSupplierItems}</div>
            <p className="text-xs text-muted-foreground">Qiymat: {formatCurrency(totals.returnedValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Kengaytirilgan ta'minotchi hisobi boshqaruvi</span>
            <div className="flex gap-2">
              <Button onClick={handleExportExcel} variant="outline" size="sm">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel eksport
              </Button>
              <Button onClick={() => setShowPaymentForm(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                To'lov qilish
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Model, ta'minotchi yoki kategoriya bo'yicha qidirish..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Ta'minotchi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="To'lov holati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="paid">To'langan</SelectItem>
                  <SelectItem value="unpaid">To'lanmagan</SelectItem>
                  <SelectItem value="partially_paid">Qisman to'langan</SelectItem>
                </SelectContent>
              </Select>

              <Select value={confirmationStatus} onValueChange={setConfirmationStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tasdiqlash holati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="confirmed">Tasdiqlangan</SelectItem>
                  <SelectItem value="unconfirmed">Tasdiqlanmagan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto"
                />
                <span className="text-sm text-muted-foreground">dan</span>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto" />
                <span className="text-sm text-muted-foreground">gacha</span>
              </div>
            </div>

            <div className="flex gap-2 ml-auto">
              {(search ||
                supplierFilter !== "all" ||
                paymentStatus !== "all" ||
                confirmationStatus !== "all" ||
                startDate ||
                endDate) && (
                <Button onClick={clearFilters} variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Tozalash
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="overview">Umumiy ko'rinish</TabsTrigger>
          <TabsTrigger value="confirmation">Tasdiqlash ({totals.unconfirmedItems})</TabsTrigger>
          <TabsTrigger value="unpaid">To'lanmagan ({totals.unpaidItems})</TabsTrigger>
          <TabsTrigger value="paid">To'langan ({totals.paidItems})</TabsTrigger>
          <TabsTrigger value="returned">Qaytarilgan ({totals.returnedToSupplierItems})</TabsTrigger>
          <TabsTrigger value="transactions">Tranzaksiyalar</TabsTrigger>
          <TabsTrigger value="reports">Hisobotlar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Tasdiqlanmagan mahsulotlar (so'nggi 10 ta)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ItemPaymentList items={unconfirmedItems.slice(0, 10)} type="unpaid" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  To'lanmagan mahsulotlar (so'nggi 10 ta)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ItemPaymentList items={unpaidItems.slice(0, 10)} type="unpaid" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Yaqinda tasdiqlangan mahsulotlar (so'nggi 10 ta)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ItemPaymentList items={confirmedItems.slice(0, 10)} type="paid" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Yaqinda to'langan mahsulotlar (so'nggi 10 ta)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ItemPaymentList items={paidItems.slice(0, 10)} type="paid" />
              </CardContent>
            </Card>
          </div>

          {returnedToSupplierItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-orange-600" />
                  Yaqinda qaytarilgan mahsulotlar (so'nggi 5 ta)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReturnedItemsList items={returnedToSupplierItems.slice(0, 5)} onViewDetails={handleViewItemDetails} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="confirmation" className="space-y-4">
          <SupplierDocumentConfirmation items={unconfirmedItems} suppliers={suppliers} />
        </TabsContent>

        <TabsContent value="unpaid" className="space-y-4">
          <ItemPaymentList items={unpaidItems} type="unpaid" onPayment={() => setShowPaymentForm(true)} />
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <ItemPaymentList items={paidItems} type="paid" />
        </TabsContent>

        <TabsContent value="returned" className="space-y-4">
          <ReturnedItemsList items={returnedToSupplierItems} onViewDetails={handleViewItemDetails} />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionTable transactions={safeTransactions} loading={loading} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ProfitLossReport transactions={safeTransactions} items={filteredItems} />
        </TabsContent>
      </Tabs>

      {/* Payment Form Modal */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ta'minotchiga to'lov qilish</DialogTitle>
          </DialogHeader>
          <EnhancedSupplierPaymentForm onSuccess={handlePayment} onCancel={() => setShowPaymentForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Item Details Modal */}
      <Dialog open={showItemDetails} onOpenChange={setShowItemDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mahsulot tafsilotlari</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Model:</span>
                  <p className="font-medium">{selectedItem.model}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Kategoriya:</span>
                  <p>{selectedItem.category}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Ta'minotchi:</span>
                  <p>{selectedItem.supplierName || "—"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Og'irlik:</span>
                  <p>{selectedItem.weight} g</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Lom narxi:</span>
                  <p>{formatCurrency(selectedItem.lomNarxi)}/g</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Jami qiymat:</span>
                  <p className="font-medium">
                    {formatCurrency((selectedItem.weight || 0) * (selectedItem.lomNarxi || 0))}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">To'lov holati:</span>
                  <p>
                    {selectedItem.paymentStatus === "paid"
                      ? "To'langan"
                      : selectedItem.paymentStatus === "partially_paid"
                        ? "Qisman to'langan"
                        : "To'lanmagan"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Tasdiqlash holati:</span>
                  <p className="flex items-center gap-2">
                    {selectedItem.confirmed ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Tasdiqlangan
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-yellow-600" />
                        Tasdiqlanmagan
                      </>
                    )}
                  </p>
                </div>
                {selectedItem.status === "returned_to_supplier" && (
                  <>
                    <div>
                      <span className="text-sm text-muted-foreground">Qaytarilgan sana:</span>
                      <p>
                        {selectedItem.returnToSupplierDate
                          ? new Date(selectedItem.returnToSupplierDate).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Qaytarish sababi:</span>
                      <p>{selectedItem.returnToSupplierReason || "—"}</p>
                    </div>
                    {selectedItem.returnToSupplierReference && (
                      <div>
                        <span className="text-sm text-muted-foreground">Ma'lumotnoma:</span>
                        <p>{selectedItem.returnToSupplierReference}</p>
                      </div>
                    )}
                  </>
                )}
                {selectedItem.confirmed && selectedItem.confirmedDate && (
                  <div>
                    <span className="text-sm text-muted-foreground">Tasdiqlangan sana:</span>
                    <p>{new Date(selectedItem.confirmedDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

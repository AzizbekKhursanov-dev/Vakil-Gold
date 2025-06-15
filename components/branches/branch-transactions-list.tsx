"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import { Plus, Search, Filter, Calendar, FileSpreadsheet, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { Skeleton } from "@/components/ui/skeleton"

interface BranchTransaction {
  id: string
  type: "sale" | "purchase" | "transfer" | "adjustment" | "payment" | "expense"
  amount: number
  description: string
  itemId?: string
  itemModel?: string
  customerName?: string
  supplierName?: string
  reference?: string
  notes?: string
  transactionDate: string
  createdAt: string
  updatedAt: string
  createdBy?: string
}

interface BranchTransactionsListProps {
  branchId: string
}

export function BranchTransactionsList({ branchId }: BranchTransactionsListProps) {
  const [transactions, setTransactions] = useState<BranchTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const { toast } = useToast()

  // Filters
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    type: "sale" as BranchTransaction["type"],
    amount: "",
    description: "",
    customerName: "",
    supplierName: "",
    reference: "",
    notes: "",
    transactionDate: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    const fetchTransactions = () => {
      try {
        const transactionsQuery = query(
          collection(db, "branchTransactions"),
          where("branchId", "==", branchId),
          orderBy("transactionDate", "desc"),
        )

        const unsubscribe = onSnapshot(
          transactionsQuery,
          (snapshot) => {
            const transactionsList = snapshot.docs.map((doc) => {
              const data = doc.data()
              return {
                id: doc.id,
                ...data,
                transactionDate: data.transactionDate?.toDate?.()?.toISOString() || data.transactionDate,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
              }
            }) as BranchTransaction[]
            setTransactions(transactionsList)
            setLoading(false)
          },
          (error) => {
            console.error("Error fetching transactions:", error)
            toast({
              title: "Xatolik",
              description: "Tranzaksiyalarni yuklashda xatolik yuz berdi",
              variant: "destructive",
            })
            setLoading(false)
          },
        )

        return unsubscribe
      } catch (error) {
        console.error("Error setting up transaction listener:", error)
        setLoading(false)
      }
    }

    const unsubscribe = fetchTransactions()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [branchId, toast])

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    if (search) {
      const searchTerm = search.toLowerCase()
      if (
        !transaction.description.toLowerCase().includes(searchTerm) &&
        !transaction.customerName?.toLowerCase().includes(searchTerm) &&
        !transaction.supplierName?.toLowerCase().includes(searchTerm) &&
        !transaction.reference?.toLowerCase().includes(searchTerm)
      ) {
        return false
      }
    }

    if (typeFilter !== "all" && transaction.type !== typeFilter) return false
    if (startDate && new Date(transaction.transactionDate) < new Date(startDate)) return false
    if (endDate && new Date(transaction.transactionDate) > new Date(endDate)) return false

    return true
  })

  // Calculate totals
  const totals = {
    totalTransactions: filteredTransactions.length,
    totalIncome: filteredTransactions
      .filter((t) => ["sale", "payment"].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpense: filteredTransactions
      .filter((t) => ["purchase", "expense"].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0),
    netAmount: 0,
  }
  totals.netAmount = totals.totalIncome - totals.totalExpense

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.amount || !formData.description) {
      toast({
        title: "Xatolik",
        description: "Barcha majburiy maydonlarni to'ldiring",
        variant: "destructive",
      })
      return
    }

    try {
      const transactionData = {
        branchId,
        type: formData.type,
        amount: Number.parseFloat(formData.amount),
        description: formData.description,
        customerName: formData.customerName || null,
        supplierName: formData.supplierName || null,
        reference: formData.reference || null,
        notes: formData.notes || null,
        transactionDate: Timestamp.fromDate(new Date(formData.transactionDate)),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: "current_user", // Replace with actual user ID
      }

      await addDoc(collection(db, "branchTransactions"), transactionData)

      toast({
        title: "Tranzaksiya qo'shildi",
        description: "Yangi tranzaksiya muvaffaqiyatli qo'shildi",
      })

      setShowAddForm(false)
      setFormData({
        type: "sale",
        amount: "",
        description: "",
        customerName: "",
        supplierName: "",
        reference: "",
        notes: "",
        transactionDate: new Date().toISOString().split("T")[0],
      })
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast({
        title: "Xatolik",
        description: "Tranzaksiyani qo'shishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const getTransactionTypeColor = (type: BranchTransaction["type"]) => {
    switch (type) {
      case "sale":
        return "bg-green-100 text-green-800"
      case "purchase":
        return "bg-blue-100 text-blue-800"
      case "transfer":
        return "bg-purple-100 text-purple-800"
      case "payment":
        return "bg-emerald-100 text-emerald-800"
      case "expense":
        return "bg-red-100 text-red-800"
      case "adjustment":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTransactionTypeLabel = (type: BranchTransaction["type"]) => {
    switch (type) {
      case "sale":
        return "Sotuv"
      case "purchase":
        return "Xarid"
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

  const clearFilters = () => {
    setSearch("")
    setTypeFilter("all")
    setStartDate("")
    setEndDate("")
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami Tranzaksiyalar</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami Daromad</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalIncome)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami Xarajat</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalExpense)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sof Daromad</CardTitle>
            <DollarSign className={`h-4 w-4 ${totals.netAmount >= 0 ? "text-green-600" : "text-red-600"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.netAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totals.netAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filial Tranzaksiyalari</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel eksport
              </Button>
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Tranzaksiya qo'shish
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Yangi tranzaksiya qo'shish</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Turi *</label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sale">Sotuv</SelectItem>
                            <SelectItem value="purchase">Xarid</SelectItem>
                            <SelectItem value="transfer">O'tkazma</SelectItem>
                            <SelectItem value="payment">To'lov</SelectItem>
                            <SelectItem value="expense">Xarajat</SelectItem>
                            <SelectItem value="adjustment">Tuzatish</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Miqdor *</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Tavsif *</label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Tranzaksiya tavsifi"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Mijoz nomi</label>
                        <Input
                          value={formData.customerName}
                          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                          placeholder="Mijoz nomi"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Ta'minotchi nomi</label>
                        <Input
                          value={formData.supplierName}
                          onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                          placeholder="Ta'minotchi nomi"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Havola</label>
                        <Input
                          value={formData.reference}
                          onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                          placeholder="Havola raqami"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Sana</label>
                        <Input
                          type="date"
                          value={formData.transactionDate}
                          onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Izohlar</label>
                      <Input
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Qo'shimcha izohlar"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                        Bekor qilish
                      </Button>
                      <Button type="submit">Saqlash</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tavsif, mijoz yoki ta'minotchi bo'yicha qidirish..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Turi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="sale">Sotuv</SelectItem>
                  <SelectItem value="purchase">Xarid</SelectItem>
                  <SelectItem value="transfer">O'tkazma</SelectItem>
                  <SelectItem value="payment">To'lov</SelectItem>
                  <SelectItem value="expense">Xarajat</SelectItem>
                  <SelectItem value="adjustment">Tuzatish</SelectItem>
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
              {(search || typeFilter !== "all" || startDate || endDate) && (
                <Button onClick={clearFilters} variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Tozalash
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sana</TableHead>
                <TableHead>Turi</TableHead>
                <TableHead>Tavsif</TableHead>
                <TableHead>Mijoz/Ta'minotchi</TableHead>
                <TableHead>Havola</TableHead>
                <TableHead className="text-right">Miqdor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Tranzaksiyalar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.transactionDate).toLocaleDateString("uz-UZ")}</TableCell>
                    <TableCell>
                      <Badge className={getTransactionTypeColor(transaction.type)}>
                        {getTransactionTypeLabel(transaction.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.customerName || transaction.supplierName || "-"}</TableCell>
                    <TableCell>{transaction.reference || "-"}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        ["sale", "payment"].includes(transaction.type) ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {["sale", "payment"].includes(transaction.type) ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

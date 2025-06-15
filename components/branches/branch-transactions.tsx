"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Calendar, FileSpreadsheet, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"

interface Item {
  id: string
  model: string
  category: string
  weight: number
  sellingPrice: number
  lomNarxi: number
  lomNarxiKirim: number
  laborCost: number
  status: string
  branchId?: string
  branchName?: string
  isProvider?: boolean
  soldDate?: string
  purchaseDate?: string
  distributedDate?: string
  returnedDate?: string
  transferredDate?: string
  createdAt: string
  updatedAt: string
  supplierName?: string
  returnReason?: string
}

interface Transaction {
  id: string
  type: "sale" | "purchase" | "transfer_in" | "transfer_out" | "return" | "distribution"
  amount: number
  date: string
  description: string
  reference?: string
  item: Item
  profit?: number
  cost?: number
}

interface BranchTransactionsProps {
  branchId: string
}

export function BranchTransactions({ branchId }: BranchTransactionsProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    try {
      // Get all items that have been associated with this branch
      const itemsQuery = query(collection(db, "items"), orderBy("updatedAt", "desc"))

      const unsubscribe = onSnapshot(
        itemsQuery,
        (snapshot) => {
          const allItems = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            }
          }) as Item[]

          // Filter items that are related to this branch
          const branchRelatedItems = allItems.filter(
            (item) =>
              item.branchId === branchId ||
              (item.isProvider && item.distributedDate) || // Items distributed from central
              item.transferredTo === branchId ||
              item.transferredFrom === branchId,
          )

          setItems(branchRelatedItems)
          setLoading(false)
        },
        (error) => {
          console.error("Error fetching items:", error)
          toast({
            title: "Xatolik",
            description: "Ma'lumotlarni yuklashda xatolik yuz berdi",
            variant: "destructive",
          })
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Error setting up listener:", error)
      setLoading(false)
    }
  }, [branchId, toast])

  // Convert items to transactions
  const transactions: Transaction[] = items.flatMap((item) => {
    const itemTransactions: Transaction[] = []

    // Calculate costs and profit
    const materialCost = item.weight * (item.isProvider ? item.lomNarxi : item.lomNarxiKirim)
    const laborCost = item.weight * item.laborCost
    const totalCost = materialCost + laborCost
    const profit = item.sellingPrice - totalCost

    // Purchase/Distribution transaction
    if (item.purchaseDate && !item.isProvider && item.branchId === branchId) {
      itemTransactions.push({
        id: `${item.id}-purchase`,
        type: "purchase",
        amount: totalCost,
        date: item.purchaseDate,
        description: `${item.model} sotib olindi`,
        reference: item.id,
        item,
        cost: totalCost,
      })
    }

    // Distribution from central to branch
    if (item.distributedDate && item.branchId === branchId && !item.isProvider) {
      itemTransactions.push({
        id: `${item.id}-distribution`,
        type: "distribution",
        amount: item.sellingPrice,
        date: item.distributedDate,
        description: `${item.model} filialga tarqatildi`,
        reference: item.id,
        item,
        cost: totalCost,
      })
    }

    // Sale transaction
    if (item.soldDate && item.status === "sold" && item.branchId === branchId) {
      itemTransactions.push({
        id: `${item.id}-sale`,
        type: "sale",
        amount: item.sellingPrice,
        date: item.soldDate,
        description: `${item.model} sotildi`,
        reference: item.id,
        item,
        profit,
        cost: totalCost,
      })
    }

    // Return transaction
    if (item.returnedDate && item.status === "returned" && item.branchId === branchId) {
      itemTransactions.push({
        id: `${item.id}-return`,
        type: "return",
        amount: -item.sellingPrice,
        date: item.returnedDate,
        description: `${item.model} qaytarildi${item.returnReason ? ` - ${item.returnReason}` : ""}`,
        reference: item.id,
        item,
        cost: -totalCost,
      })
    }

    // Transfer transactions
    if (item.transferredDate) {
      if (item.transferredFrom === branchId) {
        itemTransactions.push({
          id: `${item.id}-transfer-out`,
          type: "transfer_out",
          amount: -item.sellingPrice,
          date: item.transferredDate,
          description: `${item.model} boshqa filialga ko'chirildi`,
          reference: item.id,
          item,
          cost: -totalCost,
        })
      }
      if (item.transferredTo === branchId) {
        itemTransactions.push({
          id: `${item.id}-transfer-in`,
          type: "transfer_in",
          amount: item.sellingPrice,
          date: item.transferredDate,
          description: `${item.model} boshqa filialdan keldi`,
          reference: item.id,
          item,
          cost: totalCost,
        })
      }
    }

    return itemTransactions
  })

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    if (search) {
      const searchTerm = search.toLowerCase()
      if (
        !transaction.description.toLowerCase().includes(searchTerm) &&
        !transaction.reference?.toLowerCase().includes(searchTerm) &&
        !transaction.item.model.toLowerCase().includes(searchTerm)
      ) {
        return false
      }
    }

    if (typeFilter !== "all" && transaction.type !== typeFilter) return false
    if (startDate && new Date(transaction.date) < new Date(startDate)) return false
    if (endDate && new Date(transaction.date) > new Date(endDate)) return false

    return true
  })

  // Sort by date descending
  filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Calculate totals
  const totals = {
    income: filteredTransactions
      .filter((t) => ["sale", "transfer_in", "distribution"].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0),
    expenses: filteredTransactions
      .filter((t) => ["purchase", "transfer_out"].includes(t.type))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    returns: filteredTransactions.filter((t) => t.type === "return").reduce((sum, t) => sum + Math.abs(t.amount), 0),
    netProfit: filteredTransactions.filter((t) => t.profit !== undefined).reduce((sum, t) => sum + (t.profit || 0), 0),
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sale":
        return "Sotish"
      case "purchase":
        return "Sotib olish"
      case "transfer_in":
        return "Kiruvchi ko'chirish"
      case "transfer_out":
        return "Chiquvchi ko'chirish"
      case "return":
        return "Qaytarish"
      case "distribution":
        return "Tarqatish"
      default:
        return type
    }
  }

  const getTypeVariant = (type: string) => {
    switch (type) {
      case "sale":
        return "default"
      case "purchase":
        return "secondary"
      case "transfer_in":
        return "outline"
      case "transfer_out":
        return "outline"
      case "return":
        return "destructive"
      case "distribution":
        return "secondary"
      default:
        return "outline"
    }
  }

  const clearFilters = () => {
    setSearch("")
    setTypeFilter("all")
    setStartDate("")
    setEndDate("")
  }

  const handleExportExcel = () => {
    toast({
      title: "Excel eksport",
      description: "Tranzaksiyalar Excel faylga eksport qilinmoqda...",
    })
  }

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
            <CardTitle className="text-sm font-medium">Jami Daromad</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.income)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami Xarajat</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.expenses)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qaytarishlar</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totals.returns)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sof Foyda</CardTitle>
            <DollarSign className={`h-4 w-4 ${totals.netProfit >= 0 ? "text-green-600" : "text-red-600"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totals.netProfit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filial Tranzaksiyalari</span>
            <Button onClick={handleExportExcel} variant="outline" size="sm">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel eksport
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tavsif, model yoki ID bo'yicha qidirish..."
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
                  <SelectItem value="sale">Sotish</SelectItem>
                  <SelectItem value="purchase">Sotib olish</SelectItem>
                  <SelectItem value="transfer_in">Kiruvchi</SelectItem>
                  <SelectItem value="transfer_out">Chiquvchi</SelectItem>
                  <SelectItem value="return">Qaytarish</SelectItem>
                  <SelectItem value="distribution">Tarqatish</SelectItem>
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
                <TableHead>Mahsulot</TableHead>
                <TableHead className="text-right">Summa</TableHead>
                <TableHead className="text-right">Foyda</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Tranzaksiyalar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{format(new Date(transaction.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeVariant(transaction.type) as any}>{getTypeLabel(transaction.type)}</Badge>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{transaction.item.model}</div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.item.category} • {transaction.item.weight}g
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        transaction.amount >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {transaction.amount >= 0 ? "+" : ""}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.profit !== undefined ? (
                        <span className={transaction.profit >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(transaction.profit)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(transaction)}
                            className="h-8 w-8 p-0"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Tranzaksiya tafsilotlari</DialogTitle>
                          </DialogHeader>
                          {selectedTransaction && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-sm text-muted-foreground">Turi:</span>
                                  <p>
                                    <Badge variant={getTypeVariant(selectedTransaction.type) as any}>
                                      {getTypeLabel(selectedTransaction.type)}
                                    </Badge>
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Sana:</span>
                                  <p>{format(new Date(selectedTransaction.date), "dd/MM/yyyy")}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Summa:</span>
                                  <p
                                    className={
                                      selectedTransaction.amount >= 0
                                        ? "text-green-600 font-medium"
                                        : "text-red-600 font-medium"
                                    }
                                  >
                                    {selectedTransaction.amount >= 0 ? "+" : ""}
                                    {formatCurrency(selectedTransaction.amount)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Mahsulot ID:</span>
                                  <p>{selectedTransaction.reference}</p>
                                </div>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Tavsif:</span>
                                <p>{selectedTransaction.description}</p>
                              </div>
                              <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Mahsulot ma'lumotlari</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>Model: {selectedTransaction.item.model}</div>
                                  <div>Kategoriya: {selectedTransaction.item.category}</div>
                                  <div>Og'irlik: {selectedTransaction.item.weight}g</div>
                                  <div>Narx: {formatCurrency(selectedTransaction.item.sellingPrice)}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
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

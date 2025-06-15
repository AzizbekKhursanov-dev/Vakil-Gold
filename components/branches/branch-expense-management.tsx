"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { branchService } from "@/lib/services/branch.service"
import { formatCurrency } from "@/lib/utils/currency"
import { Loader2, Search, Edit, Trash2, Plus, Calendar, TrendingDown, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { BranchExpense } from "@/lib/types/branch"

interface BranchExpenseManagementProps {
  branchId: string
  branchName: string
}

const EXPENSE_CATEGORIES = [
  "Ijara",
  "Kommunal xizmatlar",
  "Xavfsizlik",
  "Tozalash",
  "Marketing",
  "Transport",
  "Ofis jihozlari",
  "Texnik xizmat",
  "Soliq",
  "Sug'urta",
  "Boshqa",
]

const PAYMENT_METHODS = ["Naqd", "Bank kartasi", "Bank o'tkazmasi", "Elektron to'lov", "Boshqa"]

export function BranchExpenseManagement({ branchId, branchName }: BranchExpenseManagementProps) {
  const [expenses, setExpenses] = useState<BranchExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [currentExpense, setCurrentExpense] = useState<BranchExpense | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchExpenses()
  }, [branchId, dateRange])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const expensesList = await branchService.getBranchExpenses(branchId, dateRange.start, dateRange.end)
      setExpenses(expensesList)
    } catch (error) {
      console.error("Error fetching expenses:", error)
      toast({
        title: "Xatolik",
        description: "Xarajatlar ro'yxatini yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const averageExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0

  const handleAddExpense = async (data: Omit<BranchExpense, "id">) => {
    try {
      await branchService.addBranchExpense(data)
      toast({
        title: "Xarajat qo'shildi",
        description: "Yangi xarajat muvaffaqiyatli qo'shildi",
      })
      setShowAddDialog(false)
      fetchExpenses()
    } catch (error) {
      console.error("Error adding expense:", error)
      toast({
        title: "Xatolik",
        description: "Xarajatni qo'shishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const categoryStats = EXPENSE_CATEGORIES.map((category) => {
    const categoryExpenses = filteredExpenses.filter((e) => e.category === category)
    const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
    return {
      category,
      count: categoryExpenses.length,
      total,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
    }
  }).filter((stat) => stat.count > 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami xarajatlar</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">{filteredExpenses.length} ta xarajat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O'rtacha xarajat</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageExpense)}</div>
            <p className="text-xs text-muted-foreground">Har bir xarajat uchun</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eng ko'p xarajat</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryStats.length > 0 ? categoryStats[0].category : "Ma'lumot yo'q"}
            </div>
            <p className="text-xs text-muted-foreground">
              {categoryStats.length > 0 ? formatCurrency(categoryStats[0].total) : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Xarajatlar boshqaruvi</CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yangi xarajat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Yangi xarajat qo'shish</DialogTitle>
                </DialogHeader>
                <ExpenseForm
                  branchId={branchId}
                  branchName={branchName}
                  onSubmit={handleAddExpense}
                  onCancel={() => setShowAddDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Xarajat qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Kategoriya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="w-auto"
              />
              <span className="flex items-center text-sm text-muted-foreground">dan</span>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="w-auto"
              />
              <span className="flex items-center text-sm text-muted-foreground">gacha</span>
            </div>
          </div>

          {/* Expenses Table */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Kategoriya</TableHead>
                    <TableHead>Tavsif</TableHead>
                    <TableHead>To'lov usuli</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm || categoryFilter !== "all"
                            ? "Filtr shartlariga mos xarajat topilmadi"
                            : "Bu davr uchun xarajatlar yo'q"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.date).toLocaleDateString("uz-UZ")}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.category}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                        <TableCell>{expense.paymentMethod || "-"}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Statistics */}
      {categoryStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kategoriya bo'yicha statistika</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats
                .sort((a, b) => b.total - a.total)
                .map((stat) => (
                  <div key={stat.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{stat.category}</Badge>
                      <span className="text-sm text-muted-foreground">{stat.count} ta xarajat</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(stat.total)}</div>
                      <div className="text-xs text-muted-foreground">{stat.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface ExpenseFormProps {
  branchId: string
  branchName: string
  expense?: BranchExpense
  onSubmit: (data: any) => void
  onCancel: () => void
}

function ExpenseForm({ branchId, branchName, expense, onSubmit, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    branchId,
    amount: expense?.amount || 0,
    category: expense?.category || "",
    description: expense?.description || "",
    date: expense?.date || new Date().toISOString().split("T")[0],
    approvedBy: expense?.approvedBy || "",
    paymentMethod: expense?.paymentMethod || "",
    receiptUrl: expense?.receiptUrl || "",
    isRecurring: expense?.isRecurring || false,
    recurringFrequency: expense?.recurringFrequency || "monthly",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Summa (so'm) *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData((prev) => ({ ...prev, amount: Number(e.target.value) }))}
            placeholder="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Sana *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Kategoriya *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Kategoriyani tanlang" />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Tavsif *</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Xarajat haqida batafsil ma'lumot..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">To'lov usuli</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentMethod: value }))}
          >
            <SelectTrigger id="paymentMethod">
              <SelectValue placeholder="To'lov usulini tanlang" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="approvedBy">Tasdiqlagan</Label>
          <Input
            id="approvedBy"
            name="approvedBy"
            value={formData.approvedBy}
            onChange={(e) => setFormData((prev) => ({ ...prev, approvedBy: e.target.value }))}
            placeholder="Masalan: Boshqaruvchi"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saqlanmoqda..." : expense ? "Yangilash" : "Qo'shish"}
        </Button>
      </div>
    </form>
  )
}

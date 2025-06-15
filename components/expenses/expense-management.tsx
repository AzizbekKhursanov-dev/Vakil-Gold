"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import { ExpenseForm } from "./expense-form"
import { ExpenseTable } from "./expense-table"
import { ExpenseCategories } from "./expense-categories"
import { ExpenseReports } from "./expense-reports"
import { ExpenseBudget } from "./expense-budget"
import { Plus, Filter, TrendingDown, DollarSign, Calendar, Search, AlertTriangle, Target } from "lucide-react"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { startOfMonth, endOfMonth, subMonths } from "date-fns"
import type { DateRange } from "react-day-picker"

interface Expense {
  id: string
  category: string
  subcategory?: string
  amount: number
  description: string
  date: string
  branchId?: string
  branchName?: string
  paymentMethod: string
  reference?: string
  notes?: string
  status: "pending" | "approved" | "paid" | "rejected"
  approvedBy?: string
  approvedAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface ExpenseFilters {
  search: string
  category: string
  status: string
  branch: string
  paymentMethod: string
  dateRange: DateRange | undefined
}

export function ExpenseManagement() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const [filters, setFilters] = useState<ExpenseFilters>({
    search: "",
    category: "all",
    status: "all",
    branch: "all",
    paymentMethod: "all",
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
  })

  // Fetch expenses and branches
  useEffect(() => {
    setLoading(true)

    try {
      // Fetch expenses
      const expensesQuery = query(collection(db, "expenses"), orderBy("date", "desc"))
      const unsubscribeExpenses = onSnapshot(
        expensesQuery,
        (snapshot) => {
          const expensesList = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
            }
          }) as Expense[]
          setExpenses(expensesList)
          setLoading(false)
        },
        (error) => {
          console.error("Error fetching expenses:", error)
          setLoading(false)
        },
      )

      // Fetch branches
      const branchesQuery = query(collection(db, "branches"), orderBy("name"))
      const unsubscribeBranches = onSnapshot(
        branchesQuery,
        (snapshot) => {
          const branchesList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setBranches(branchesList)
        },
        (error) => {
          console.error("Error fetching branches:", error)
        },
      )

      return () => {
        unsubscribeExpenses()
        unsubscribeBranches()
      }
    } catch (error) {
      console.error("Error setting up listeners:", error)
      setLoading(false)
    }
  }, [])

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      if (
        !expense.description.toLowerCase().includes(searchTerm) &&
        !expense.category.toLowerCase().includes(searchTerm) &&
        !expense.reference?.toLowerCase().includes(searchTerm)
      ) {
        return false
      }
    }

    // Category filter
    if (filters.category !== "all" && expense.category !== filters.category) return false

    // Status filter
    if (filters.status !== "all" && expense.status !== filters.status) return false

    // Branch filter
    if (filters.branch !== "all" && expense.branchId !== filters.branch) return false

    // Payment method filter
    if (filters.paymentMethod !== "all" && expense.paymentMethod !== filters.paymentMethod) return false

    // Date range filter
    if (filters.dateRange?.from) {
      const expenseDate = new Date(expense.date)
      const fromDate = filters.dateRange.from
      const toDate = filters.dateRange.to || filters.dateRange.from

      if (expenseDate < fromDate || expenseDate > toDate) {
        return false
      }
    }

    return true
  })

  // Calculate totals
  const totals = {
    totalExpenses: filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    pendingExpenses: filteredExpenses
      .filter((e) => e.status === "pending")
      .reduce((sum, expense) => sum + expense.amount, 0),
    approvedExpenses: filteredExpenses
      .filter((e) => e.status === "approved")
      .reduce((sum, expense) => sum + expense.amount, 0),
    paidExpenses: filteredExpenses.filter((e) => e.status === "paid").reduce((sum, expense) => sum + expense.amount, 0),
    pendingCount: filteredExpenses.filter((e) => e.status === "pending").length,
    thisMonthExpenses: expenses
      .filter((e) => {
        const expenseDate = new Date(e.date)
        const now = new Date()
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, expense) => sum + expense.amount, 0),
    lastMonthExpenses: expenses
      .filter((e) => {
        const expenseDate = new Date(e.date)
        const lastMonth = subMonths(new Date(), 1)
        return expenseDate.getMonth() === lastMonth.getMonth() && expenseDate.getFullYear() === lastMonth.getFullYear()
      })
      .reduce((sum, expense) => sum + expense.amount, 0),
  }

  const monthlyChange =
    totals.lastMonthExpenses > 0
      ? ((totals.thisMonthExpenses - totals.lastMonthExpenses) / totals.lastMonthExpenses) * 100
      : 0

  const handleExpenseSuccess = () => {
    setShowExpenseForm(false)
    setEditingExpense(null)
    toast({
      title: "Muvaffaqiyatli",
      description: editingExpense ? "Xarajat yangilandi" : "Yangi xarajat qo'shildi",
    })
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setShowExpenseForm(true)
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "all",
      status: "all",
      branch: "all",
      paymentMethod: "all",
      dateRange: {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      },
    })
  }

  const expenseCategories = [
    "Ijara",
    "Kommunal xizmatlar",
    "Ish haqi",
    "Marketing",
    "Transport",
    "Ofis jihozlari",
    "Ta'mirlash",
    "Soliqlar",
    "Sug'urta",
    "Boshqa",
  ]

  const paymentMethods = ["Naqd", "Bank o'tkazmasi", "Karta", "Onlayn to'lov"]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami xarajat</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">{filteredExpenses.length} ta xarajat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kutilayotgan</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totals.pendingExpenses)}</div>
            <p className="text-xs text-muted-foreground">{totals.pendingCount} ta tasdiq kutilmoqda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasdiqlangan</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totals.approvedExpenses)}</div>
            <p className="text-xs text-muted-foreground">To'lovga tayyor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To'langan</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.paidExpenses)}</div>
            <p className="text-xs text-muted-foreground">Yakunlangan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu oy</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.thisMonthExpenses)}</div>
            <p className={`text-xs ${monthlyChange >= 0 ? "text-red-600" : "text-green-600"}`}>
              {monthlyChange >= 0 ? "+" : ""}
              {monthlyChange.toFixed(1)}% o'tgan oyga nisbatan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Xarajatlar boshqaruvi</span>
            <div className="flex gap-2">
              <Button onClick={() => setShowExpenseForm(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Yangi xarajat
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Qidirish</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tavsif, kategoriya..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kategoriya</label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategoriya tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Holat</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Holat tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha holatlar</SelectItem>
                  <SelectItem value="pending">Kutilayotgan</SelectItem>
                  <SelectItem value="approved">Tasdiqlangan</SelectItem>
                  <SelectItem value="paid">To'langan</SelectItem>
                  <SelectItem value="rejected">Rad etilgan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filial</label>
              <Select
                value={filters.branch}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, branch: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filial tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha filiallar</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">To'lov usuli</label>
              <Select
                value={filters.paymentMethod}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="To'lov usuli" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha usullar</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sana oralig'i</label>
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(dateRange) => setFilters((prev) => ({ ...prev, dateRange }))}
              />
            </div>

            <div className="space-y-2 flex items-end">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Filtrlarni tozalash
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview" className="text-xs lg:text-sm">
            Umumiy
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs lg:text-sm">
            Xarajatlar
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-xs lg:text-sm">
            Kategoriyalar
          </TabsTrigger>
          <TabsTrigger value="budget" className="text-xs lg:text-sm">
            Byudjet
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs lg:text-sm">
            Hisobotlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ExpenseTable
            expenses={filteredExpenses.slice(0, 10)}
            loading={loading}
            onEdit={handleEditExpense}
            showActions={true}
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseTable expenses={filteredExpenses} loading={loading} onEdit={handleEditExpense} showActions={true} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <ExpenseCategories expenses={expenses} />
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <ExpenseBudget expenses={expenses} branches={branches} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ExpenseReports expenses={filteredExpenses} dateRange={filters.dateRange} selectedBranch={filters.branch} />
        </TabsContent>
      </Tabs>

      {/* Expense Form Modal */}
      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Xarajatni tahrirlash" : "Yangi xarajat qo'shish"}</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            expense={editingExpense}
            branches={branches}
            categories={expenseCategories}
            paymentMethods={paymentMethods}
            onSuccess={handleExpenseSuccess}
            onCancel={() => {
              setShowExpenseForm(false)
              setEditingExpense(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

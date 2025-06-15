"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils/currency"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { format, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns"
import { Save, Edit, AlertTriangle } from "lucide-react"
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { useToast } from "@/hooks/use-toast"

interface ExpenseBudgetProps {
  expenses: any[]
  branches: any[]
}

export function ExpenseBudget({ expenses, branches }: ExpenseBudgetProps) {
  const { toast } = useToast()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [budgets, setBudgets] = useState<any[]>([])
  const [actualExpenses, setActualExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedBudgets, setEditedBudgets] = useState<any>({})

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

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())

  // Generate months for the selected year
  const generateMonths = () => {
    const year = Number.parseInt(selectedYear)
    const startDate = startOfYear(new Date(year, 0, 1))
    const endDate = endOfYear(new Date(year, 0, 1))

    return eachMonthOfInterval({
      start: startDate,
      end: endDate,
    }).map((date) => ({
      month: format(date, "MMM"),
      monthNum: date.getMonth(),
      year,
    }))
  }

  const months = generateMonths()

  // Fetch budgets and calculate actual expenses
  useEffect(() => {
    const fetchBudgets = async () => {
      setLoading(true)
      try {
        // Fetch budgets for the selected year and branch
        let budgetQuery = query(collection(db, "budgets"), where("year", "==", Number.parseInt(selectedYear)))

        if (selectedBranch !== "all") {
          budgetQuery = query(
            collection(db, "budgets"),
            where("year", "==", Number.parseInt(selectedYear)),
            where("branchId", "==", selectedBranch),
          )
        }

        const budgetSnapshot = await getDocs(budgetQuery)
        const budgetData = budgetSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setBudgets(budgetData)

        // Initialize edited budgets
        const initialEditedBudgets: any = {}
        budgetData.forEach((budget) => {
          initialEditedBudgets[`${budget.branchId || "all"}-${budget.category}-${budget.month}`] = budget.amount
        })
        setEditedBudgets(initialEditedBudgets)

        // Calculate actual expenses for comparison
        const year = Number.parseInt(selectedYear)
        const startDate = format(new Date(year, 0, 1), "yyyy-MM-dd")
        const endDate = format(new Date(year, 11, 31), "yyyy-MM-dd")

        // Filter expenses for the selected year and branch
        let filteredExpenses = expenses.filter((expense) => {
          const expenseDate = new Date(expense.date)
          return expenseDate.getFullYear() === year
        })

        if (selectedBranch !== "all") {
          filteredExpenses = filteredExpenses.filter((expense) => expense.branchId === selectedBranch)
        }

        // Group expenses by month and category
        const expensesByMonthAndCategory = filteredExpenses.reduce((acc: any, expense) => {
          const expenseDate = new Date(expense.date)
          const month = expenseDate.getMonth()
          const category = expense.category || "Boshqa"
          const key = `${expense.branchId || "all"}-${category}-${month}`

          if (!acc[key]) {
            acc[key] = 0
          }

          acc[key] += expense.amount
          return acc
        }, {})

        setActualExpenses(expensesByMonthAndCategory)
      } catch (error) {
        console.error("Error fetching budget data:", error)
        toast({
          title: "Xatolik",
          description: "Byudjet ma'lumotlarini yuklashda xatolik yuz berdi",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBudgets()
  }, [selectedYear, selectedBranch, expenses, toast])

  // Get budget amount for a specific month and category
  const getBudgetAmount = (month: number, category: string) => {
    const budget = budgets.find(
      (b) =>
        b.month === month && b.category === category && (selectedBranch === "all" || b.branchId === selectedBranch),
    )

    return budget ? budget.amount : 0
  }

  // Get actual expense amount for a specific month and category
  const getActualAmount = (month: number, category: string) => {
    const key = `${selectedBranch}-${category}-${month}`
    return actualExpenses[key] || 0
  }

  // Calculate variance (budget - actual)
  const getVariance = (month: number, category: string) => {
    const budget = getBudgetAmount(month, category)
    const actual = getActualAmount(month, category)
    return budget - actual
  }

  // Calculate variance percentage
  const getVariancePercentage = (month: number, category: string) => {
    const budget = getBudgetAmount(month, category)
    const actual = getActualAmount(month, category)

    if (budget === 0) return 0
    return ((budget - actual) / budget) * 100
  }

  // Handle budget amount change
  const handleBudgetChange = (month: number, category: string, value: string) => {
    const key = `${selectedBranch}-${category}-${month}`
    const amount = Number.parseFloat(value) || 0

    setEditedBudgets({
      ...editedBudgets,
      [key]: amount,
    })
  }

  // Save budgets
  const saveBudgets = async () => {
    setLoading(true)
    try {
      // For each edited budget, update or create
      for (const [key, amount] of Object.entries(editedBudgets)) {
        const [branchId, category, month] = key.split("-")

        // Find existing budget
        const existingBudget = budgets.find(
          (b) =>
            b.month === Number.parseInt(month) &&
            b.category === category &&
            (branchId === "all" || b.branchId === branchId),
        )

        if (existingBudget) {
          // Update existing budget
          await updateDoc(doc(db, "budgets", existingBudget.id), {
            amount,
            updatedAt: new Date().toISOString(),
          })
        } else {
          // Create new budget
          await addDoc(collection(db, "budgets"), {
            year: Number.parseInt(selectedYear),
            month: Number.parseInt(month),
            category,
            branchId: branchId === "all" ? null : branchId,
            amount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }
      }

      toast({
        title: "Muvaffaqiyatli",
        description: "Byudjet ma'lumotlari saqlandi",
      })

      // Refresh budgets
      const budgetQuery = query(collection(db, "budgets"), where("year", "==", Number.parseInt(selectedYear)))

      const budgetSnapshot = await getDocs(budgetQuery)
      const budgetData = budgetSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setBudgets(budgetData)
      setEditMode(false)
    } catch (error) {
      console.error("Error saving budget data:", error)
      toast({
        title: "Xatolik",
        description: "Byudjet ma'lumotlarini saqlashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate chart data
  const generateChartData = () => {
    return months.map(({ month, monthNum }) => {
      const data: any = {
        name: month,
      }

      // Add budget and actual for each category
      expenseCategories.forEach((category) => {
        data[`${category} Byudjet`] = getBudgetAmount(monthNum, category)
        data[`${category} Haqiqiy`] = getActualAmount(monthNum, category)
      })

      // Add totals
      data["Jami Byudjet"] = expenseCategories.reduce((sum, category) => sum + getBudgetAmount(monthNum, category), 0)

      data["Jami Haqiqiy"] = expenseCategories.reduce((sum, category) => sum + getActualAmount(monthNum, category), 0)

      return data
    })
  }

  const chartData = generateChartData()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Xarajatlar byudjeti</h2>
        <div className="flex gap-2">
          {editMode ? (
            <Button onClick={saveBudgets} disabled={loading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          ) : (
            <Button onClick={() => setEditMode(true)} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Tahrirlash
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Byudjet parametrlari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Yil</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Yil tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filial</label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Byudjet va haqiqiy xarajatlar taqqoslash</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value).replace(/[^\d.,]/g, "")} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="Jami Byudjet" name="Jami byudjet" fill="#3b82f6" />
                <Bar dataKey="Jami Haqiqiy" name="Jami haqiqiy" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Byudjet jadvali</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategoriya</TableHead>
                  {months.map(({ month, monthNum }) => (
                    <TableHead key={monthNum} className="text-center">
                      {month}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Jami</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseCategories.map((category) => (
                  <TableRow key={category}>
                    <TableCell className="font-medium">{category}</TableCell>
                    {months.map(({ monthNum }) => {
                      const budget = getBudgetAmount(monthNum, category)
                      const actual = getActualAmount(monthNum, category)
                      const variance = getVariance(monthNum, category)
                      const variancePercentage = getVariancePercentage(monthNum, category)

                      return (
                        <TableCell key={monthNum} className="p-0">
                          <div className="p-2">
                            {editMode ? (
                              <Input
                                type="number"
                                value={editedBudgets[`${selectedBranch}-${category}-${monthNum}`] || 0}
                                onChange={(e) => handleBudgetChange(monthNum, category, e.target.value)}
                                className="h-8 text-right"
                              />
                            ) : (
                              <div className="space-y-1">
                                <div className="text-right font-medium">{formatCurrency(budget)}</div>
                                <div className="text-right text-sm text-muted-foreground">{formatCurrency(actual)}</div>
                                {budget > 0 && (
                                  <div
                                    className={`text-right text-xs ${variance >= 0 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {variance >= 0 ? "+" : ""}
                                    {formatCurrency(variance)} ({variancePercentage.toFixed(1)}%)
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-medium">
                      {formatCurrency(
                        months.reduce((sum, { monthNum }) => sum + getBudgetAmount(monthNum, category), 0),
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">Jami</TableCell>
                  {months.map(({ monthNum }) => {
                    const totalBudget = expenseCategories.reduce(
                      (sum, category) => sum + getBudgetAmount(monthNum, category),
                      0,
                    )
                    const totalActual = expenseCategories.reduce(
                      (sum, category) => sum + getActualAmount(monthNum, category),
                      0,
                    )
                    const totalVariance = totalBudget - totalActual
                    const totalVariancePercentage = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0

                    return (
                      <TableCell key={monthNum} className="text-right">
                        <div className="font-bold">{formatCurrency(totalBudget)}</div>
                        <div className="text-sm text-muted-foreground">{formatCurrency(totalActual)}</div>
                        {totalBudget > 0 && (
                          <div className={`text-xs ${totalVariance >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {totalVariance >= 0 ? "+" : ""}
                            {formatCurrency(totalVariance)} ({totalVariancePercentage.toFixed(1)}%)
                          </div>
                        )}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-right font-bold">
                    {formatCurrency(
                      months.reduce(
                        (sum, { monthNum }) =>
                          sum +
                          expenseCategories.reduce(
                            (catSum, category) => catSum + getBudgetAmount(monthNum, category),
                            0,
                          ),
                        0,
                      ),
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {!editMode && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Byudjet qiymatlarini tahrirlash uchun "Tahrirlash" tugmasini bosing</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils/currency"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts"

interface ExpenseCategoriesProps {
  expenses: any[]
}

export function ExpenseCategories({ expenses }: ExpenseCategoriesProps) {
  const [categoryData, setCategoryData] = useState<any[]>([])

  useEffect(() => {
    // Process category data
    const categoryStats = expenses.reduce(
      (acc, expense) => {
        const category = expense.category || "Boshqa"
        if (!acc[category]) {
          acc[category] = {
            name: category,
            total: 0,
            count: 0,
            pending: 0,
            approved: 0,
            paid: 0,
            average: 0,
          }
        }
        acc[category].total += expense.amount || 0
        acc[category].count += 1

        if (expense.status === "pending") acc[category].pending += expense.amount || 0
        if (expense.status === "approved") acc[category].approved += expense.amount || 0
        if (expense.status === "paid") acc[category].paid += expense.amount || 0

        return acc
      },
      {} as Record<string, any>,
    )

    // Calculate averages
    Object.values(categoryStats).forEach((category: any) => {
      category.average = category.count > 0 ? category.total / category.count : 0
    })

    setCategoryData(Object.values(categoryStats).sort((a, b) => b.total - a.total))
  }, [expenses])

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d", "#ffc658"]

  const totalExpenses = categoryData.reduce((sum, category) => sum + category.total, 0)

  return (
    <div className="space-y-6">
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Kategoriya bo'yicha taqsimot</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                total: {
                  label: "Jami",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [formatCurrency(value as number), "Jami"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Kategoriya bo'yicha xarajatlar</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                total: {
                  label: "Jami",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData.slice(0, 8)}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [formatCurrency(value as number), "Jami"]}
                  />
                  <Bar dataKey="total" fill="var(--color-total)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kategoriya bo'yicha batafsil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategoriya</TableHead>
                  <TableHead className="text-right">Jami summa</TableHead>
                  <TableHead className="text-right">Soni</TableHead>
                  <TableHead className="text-right">O'rtacha</TableHead>
                  <TableHead className="text-right">Kutilayotgan</TableHead>
                  <TableHead className="text-right">To'langan</TableHead>
                  <TableHead className="text-right">Ulush</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryData.map((category) => (
                  <TableRow key={category.name}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(category.total)}</TableCell>
                    <TableCell className="text-right">{category.count}</TableCell>
                    <TableCell className="text-right">{formatCurrency(category.average)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        {formatCurrency(category.pending)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {formatCurrency(category.paid)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        {totalExpenses > 0 ? ((category.total / totalExpenses) * 100).toFixed(1) : 0}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

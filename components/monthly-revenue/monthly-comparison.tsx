"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"

interface MonthlyComparisonProps {
  year: number
}

// Mock data - in real app this would come from Firebase
const monthlyData = [
  { month: "Yan", revenue: 98000000, profit: 24500000, growth: 8.5 },
  { month: "Fev", revenue: 105000000, profit: 26250000, growth: 7.1 },
  { month: "Mar", revenue: 112000000, profit: 28000000, growth: 6.7 },
  { month: "Apr", revenue: 118000000, profit: 29500000, growth: 5.4 },
  { month: "May", revenue: 125000000, profit: 31250000, growth: 5.9 },
  { month: "Iyun", revenue: 132000000, profit: 33000000, growth: 5.6 },
  { month: "Iyul", revenue: 128000000, profit: 32000000, growth: -3.0 },
  { month: "Avg", revenue: 135000000, profit: 33750000, growth: 5.5 },
  { month: "Sen", revenue: 142000000, profit: 35500000, growth: 5.2 },
  { month: "Okt", revenue: 138000000, profit: 34500000, growth: -2.8 },
  { month: "Noy", revenue: 145000000, profit: 36250000, growth: 5.1 },
  { month: "Dek", revenue: 152000000, profit: 38000000, growth: 4.8 },
]

const yearOverYearData = [
  { month: "Yan", currentYear: 125000000, previousYear: 115000000 },
  { month: "Fev", currentYear: 132000000, previousYear: 118000000 },
  { month: "Mar", currentYear: 128000000, previousYear: 122000000 },
  { month: "Apr", currentYear: 135000000, previousYear: 125000000 },
  { month: "May", currentYear: 142000000, previousYear: 128000000 },
  { month: "Iyun", currentYear: 138000000, previousYear: 132000000 },
]

export function MonthlyComparison({ year }: MonthlyComparisonProps) {
  const currentMonth = monthlyData[4] // May data
  const previousMonth = monthlyData[3] // April data

  const revenueChange = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
  const profitChange = ((currentMonth.profit - previousMonth.profit) / previousMonth.profit) * 100

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-gray-600"
  }

  return (
    <div className="space-y-6">
      {/* Month-over-Month Comparison */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daromad o'zgarishi</CardTitle>
            {getTrendIcon(revenueChange)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonth.revenue)}</div>
            <p className={`text-xs ${getTrendColor(revenueChange)}`}>
              {revenueChange > 0 ? "+" : ""}
              {revenueChange.toFixed(1)}% o'tgan oyga nisbatan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Foyda o'zgarishi</CardTitle>
            {getTrendIcon(profitChange)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonth.profit)}</div>
            <p className={`text-xs ${getTrendColor(profitChange)}`}>
              {profitChange > 0 ? "+" : ""}
              {profitChange.toFixed(1)}% o'tgan oyga nisbatan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O'sish sur'ati</CardTitle>
            {getTrendIcon(currentMonth.growth)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonth.growth.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Oylik o'sish</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Yillik daromad trendi</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Daromad" />
              <Line type="monotone" dataKey="profit" stroke="#82ca9d" strokeWidth={2} name="Foyda" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Year-over-Year Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Yillar bo'yicha taqqoslash</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearOverYearData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} />
              <Bar dataKey="currentYear" fill="#8884d8" name={`${year} yil`} />
              <Bar dataKey="previousYear" fill="#82ca9d" name={`${year - 1} yil`} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Monthly Table */}
      <Card>
        <CardHeader>
          <CardTitle>Oylik tafsilotlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Oy</th>
                  <th className="text-right p-2">Daromad</th>
                  <th className="text-right p-2">Foyda</th>
                  <th className="text-right p-2">Foyda marjasi</th>
                  <th className="text-right p-2">O'sish sur'ati</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((item) => (
                  <tr key={item.month} className="border-b">
                    <td className="p-2 font-medium">{item.month}</td>
                    <td className="p-2 text-right">{formatCurrency(item.revenue)}</td>
                    <td className="p-2 text-right">{formatCurrency(item.profit)}</td>
                    <td className="p-2 text-right">{((item.profit / item.revenue) * 100).toFixed(1)}%</td>
                    <td className={`p-2 text-right ${getTrendColor(item.growth)}`}>
                      {item.growth > 0 ? "+" : ""}
                      {item.growth.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts"
import { formatCurrency } from "@/lib/utils/currency"

interface MonthlyRevenueChartProps {
  year: number
  month: number
}

// Mock data - in real app this would come from Firebase
const dailyData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  revenue: Math.floor(Math.random() * 8000000) + 2000000,
  profit: Math.floor(Math.random() * 2000000) + 500000,
  items: Math.floor(Math.random() * 15) + 3,
}))

const categoryData = [
  { category: "Uzuk", revenue: 45000000, profit: 11250000, items: 67 },
  { category: "Sirg'a", revenue: 32000000, profit: 8000000, items: 45 },
  { category: "Zanjir", revenue: 28000000, profit: 7000000, items: 23 },
  { category: "Bilakuzuk", revenue: 15000000, profit: 3750000, items: 18 },
  { category: "Boshqa", revenue: 5000000, profit: 1250000, items: 3 },
]

export function MonthlyRevenueChart({ year, month }: MonthlyRevenueChartProps) {
  return (
    <div className="grid gap-6">
      {/* Daily Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Kunlik daromad trendi</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={dailyData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
                name="Daromad"
              />
              <Area
                type="monotone"
                dataKey="profit"
                stackId="2"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
                name="Foyda"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Kategoriya bo'yicha daromad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} />
                <Bar dataKey="revenue" fill="#8884d8" name="Daromad" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Items Sold */}
        <Card>
          <CardHeader>
            <CardTitle>Kunlik sotilgan mahsulotlar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="items" stroke="#ffc658" strokeWidth={2} name="Mahsulotlar" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kategoriya tafsilotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Kategoriya</th>
                  <th className="text-right p-2">Daromad</th>
                  <th className="text-right p-2">Foyda</th>
                  <th className="text-right p-2">Mahsulotlar</th>
                  <th className="text-right p-2">O'rtacha narx</th>
                  <th className="text-right p-2">Foyda marjasi</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((item) => (
                  <tr key={item.category} className="border-b">
                    <td className="p-2 font-medium">{item.category}</td>
                    <td className="p-2 text-right">{formatCurrency(item.revenue)}</td>
                    <td className="p-2 text-right">{formatCurrency(item.profit)}</td>
                    <td className="p-2 text-right">{item.items}</td>
                    <td className="p-2 text-right">{formatCurrency(item.revenue / item.items)}</td>
                    <td className="p-2 text-right">{((item.profit / item.revenue) * 100).toFixed(1)}%</td>
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

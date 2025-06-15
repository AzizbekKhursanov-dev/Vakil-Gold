"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils/currency"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"
import type { Item } from "@/lib/types/item"

interface ProfitData {
  supposedProfit: number
  actualProfit: number
  totalRevenue: number
  totalCost: number
  profitMargin: number
  itemCount: number
  averageProfit: number
  priceDifferenceImpact: number
}

interface ProfitOverviewProps {
  profitData: ProfitData
  items: Item[]
}

export function ProfitOverview({ profitData, items }: ProfitOverviewProps) {
  // Calculate profit efficiency
  const profitEfficiency =
    profitData.supposedProfit > 0 ? (profitData.actualProfit / profitData.supposedProfit) * 100 : 0

  // Group items by status for analysis
  const statusData = items.reduce(
    (acc, item) => {
      const status = item.status
      if (!acc[status]) {
        acc[status] = { count: 0, value: 0, profit: 0 }
      }
      acc[status].count++
      acc[status].value += item.weight * item.lomNarxi

      if (status === "sold") {
        const cost = item.weight * (item.payedLomNarxi || item.lomNarxi) + item.laborCost * item.weight
        const revenue = item.sellingPrice * item.weight
        acc[status].profit += revenue - cost
      }

      return acc
    },
    {} as Record<string, { count: number; value: number; profit: number }>,
  )

  const chartData = Object.entries(statusData).map(([status, data]) => ({
    name:
      status === "sold"
        ? "Sotilgan"
        : status === "available"
          ? "Mavjud"
          : status === "transferred"
            ? "O'tkazilgan"
            : status === "returned"
              ? "Qaytarilgan"
              : status,
    count: data.count,
    value: data.value,
    profit: data.profit,
  }))

  const pieData = chartData.map((item, index) => ({
    name: item.name,
    value: item.count,
    color: ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1"][index % 5],
  }))

  return (
    <div className="space-y-6">
      {/* Profit Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle>Foyda samaradorligi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">Nazariy foyda</div>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(profitData.supposedProfit)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Haqiqiy foyda</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(profitData.actualProfit)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Samaradorlik</div>
              <div className="text-2xl font-bold">{profitEfficiency.toFixed(1)}%</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Foyda maqsadi bajarilishi</span>
              <span>{profitEfficiency.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(profitEfficiency, 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Analysis Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Mahsulot holati bo'yicha tahlil</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === "count" ? value : formatCurrency(value),
                    name === "count" ? "Soni" : name === "value" ? "Qiymat" : "Foyda",
                  ]}
                />
                <Bar dataKey="count" fill="#8884d8" name="Soni" />
                <Bar dataKey="profit" fill="#82ca9d" name="Foyda" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Mahsulotlar taqsimoti</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Asosiy xulosalar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-green-800">Ijobiy ko'rsatkichlar</h4>
              <div className="space-y-2">
                {profitData.actualProfit > profitData.supposedProfit && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      Haqiqiy foyda nazariy foydadan{" "}
                      {formatCurrency(profitData.actualProfit - profitData.supposedProfit)} yuqori
                    </p>
                  </div>
                )}
                {profitData.profitMargin > 20 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      Foyda marjasi {profitData.profitMargin.toFixed(1)}% - bu yaxshi ko'rsatkich
                    </p>
                  </div>
                )}
                {profitData.priceDifferenceImpact > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      To'lov muzokaralari {formatCurrency(profitData.priceDifferenceImpact)} tejamkorlik keltirdi
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-red-800">E'tibor talab qiluvchi sohalar</h4>
              <div className="space-y-2">
                {profitData.actualProfit < profitData.supposedProfit && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">
                      Haqiqiy foyda nazariy foydadan{" "}
                      {formatCurrency(profitData.supposedProfit - profitData.actualProfit)} past
                    </p>
                  </div>
                )}
                {profitData.profitMargin < 15 && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      Foyda marjasi {profitData.profitMargin.toFixed(1)}% - bu past ko'rsatkich
                    </p>
                  </div>
                )}
                {profitData.priceDifferenceImpact < 0 && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">
                      To'lov farqlari {formatCurrency(Math.abs(profitData.priceDifferenceImpact))} qo'shimcha xarajat
                      keltirdi
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

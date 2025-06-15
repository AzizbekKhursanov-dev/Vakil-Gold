"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils/currency"

interface BranchPerformanceProps {
  year: number
  month: number
}

// Mock data - in real app this would come from Firebase
const branchData = [
  {
    id: "central",
    name: "Markaz",
    revenue: 45000000,
    profit: 11250000,
    target: 50000000,
    achievement: 90,
    items: 67,
    growth: 8.5,
    status: "excellent",
  },
  {
    id: "bulungur",
    name: "Bulung'ur",
    revenue: 32000000,
    profit: 8000000,
    target: 35000000,
    achievement: 91.4,
    items: 45,
    growth: 12.3,
    status: "excellent",
  },
  {
    id: "qiziltepa",
    name: "Qizil Tepa",
    revenue: 28000000,
    profit: 7000000,
    target: 30000000,
    achievement: 93.3,
    items: 38,
    growth: 5.2,
    status: "good",
  },
  {
    id: "tashkent",
    name: "Toshkent",
    revenue: 35000000,
    profit: 8750000,
    target: 40000000,
    achievement: 87.5,
    items: 52,
    growth: -2.1,
    status: "warning",
  },
  {
    id: "kitob",
    name: "Kitob",
    revenue: 18000000,
    profit: 4500000,
    target: 25000000,
    achievement: 72,
    items: 28,
    growth: -5.8,
    status: "poor",
  },
]

const pieData = branchData.map((branch) => ({
  name: branch.name,
  value: branch.revenue,
  color: getStatusColor(branch.status),
}))

function getStatusColor(status: string) {
  switch (status) {
    case "excellent":
      return "#22c55e"
    case "good":
      return "#3b82f6"
    case "warning":
      return "#f59e0b"
    case "poor":
      return "#ef4444"
    default:
      return "#6b7280"
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "excellent":
      return <Badge className="bg-green-100 text-green-800">A'lo</Badge>
    case "good":
      return <Badge className="bg-blue-100 text-blue-800">Yaxshi</Badge>
    case "warning":
      return <Badge className="bg-yellow-100 text-yellow-800">Ogohlantirish</Badge>
    case "poor":
      return <Badge className="bg-red-100 text-red-800">Yomon</Badge>
    default:
      return <Badge variant="secondary">Noma'lum</Badge>
  }
}

export function BranchPerformance({ year, month }: BranchPerformanceProps) {
  const totalRevenue = branchData.reduce((sum, branch) => sum + branch.revenue, 0)
  const totalTarget = branchData.reduce((sum, branch) => sum + branch.target, 0)
  const overallAchievement = (totalRevenue / totalTarget) * 100

  return (
    <div className="space-y-6">
      {/* Overall Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Umumiy ko'rsatkichlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-sm text-muted-foreground">Jami daromad</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(totalTarget)}</div>
              <p className="text-sm text-muted-foreground">Jami maqsad</p>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${overallAchievement >= 90 ? "text-green-600" : overallAchievement >= 80 ? "text-yellow-600" : "text-red-600"}`}
              >
                {overallAchievement.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Maqsad bajarilishi</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue by Branch Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Filiallar bo'yicha daromad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={branchData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} />
                <Bar dataKey="revenue" fill="#8884d8" name="Daromad" />
                <Bar dataKey="target" fill="#82ca9d" name="Maqsad" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daromad taqsimoti</CardTitle>
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
                <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Branch Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Filiallar tafsiloti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Filial</th>
                  <th className="text-right p-2">Daromad</th>
                  <th className="text-right p-2">Maqsad</th>
                  <th className="text-right p-2">Bajarilish</th>
                  <th className="text-right p-2">Foyda</th>
                  <th className="text-right p-2">Mahsulotlar</th>
                  <th className="text-right p-2">O'sish</th>
                  <th className="text-center p-2">Holat</th>
                </tr>
              </thead>
              <tbody>
                {branchData.map((branch) => (
                  <tr key={branch.id} className="border-b">
                    <td className="p-2 font-medium">{branch.name}</td>
                    <td className="p-2 text-right">{formatCurrency(branch.revenue)}</td>
                    <td className="p-2 text-right">{formatCurrency(branch.target)}</td>
                    <td
                      className={`p-2 text-right font-medium ${
                        branch.achievement >= 90
                          ? "text-green-600"
                          : branch.achievement >= 80
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {branch.achievement.toFixed(1)}%
                    </td>
                    <td className="p-2 text-right">{formatCurrency(branch.profit)}</td>
                    <td className="p-2 text-right">{branch.items}</td>
                    <td className={`p-2 text-right ${branch.growth > 0 ? "text-green-600" : "text-red-600"}`}>
                      {branch.growth > 0 ? "+" : ""}
                      {branch.growth.toFixed(1)}%
                    </td>
                    <td className="p-2 text-center">{getStatusBadge(branch.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Tahlil va tavsiyalar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Eng yaxshi natija</h4>
              <p className="text-sm text-green-700">
                Qizil Tepa filiali 93.3% maqsad bajarilishi bilan eng yaxshi natijani ko'rsatmoqda.
              </p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">E'tibor talab qiladi</h4>
              <p className="text-sm text-yellow-700">
                Kitob filiali 72% maqsad bajarilishi bilan qolgan filiallardan orqada qolmoqda. Qo'shimcha yordam va
                strategiya kerak.
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Umumiy holat</h4>
              <p className="text-sm text-blue-700">
                Barcha filiallar bo'yicha o'rtacha maqsad bajarilishi {overallAchievement.toFixed(1)}% ni tashkil etadi.
                Bu yaxshi natija hisoblanadi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

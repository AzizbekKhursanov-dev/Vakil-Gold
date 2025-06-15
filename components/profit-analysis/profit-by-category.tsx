"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock data - in real app this would come from Firebase
const categoryProfitData = [
  { name: "Uzuk", revenue: 75000000, cost: 56250000, profit: 18750000, margin: 25 },
  { name: "Sirg'a", revenue: 45000000, cost: 33750000, profit: 11250000, margin: 25 },
  { name: "Bilakuzuk", revenue: 30000000, cost: 22500000, profit: 7500000, margin: 25 },
  { name: "Zanjir", revenue: 40000000, cost: 28000000, profit: 12000000, margin: 30 },
  { name: "Boshqa", revenue: 15000000, cost: 11250000, profit: 3750000, margin: 25 },
]

const pieData = [
  { name: "Uzuk", value: 18750000, color: "#8884d8" },
  { name: "Sirg'a", value: 11250000, color: "#82ca9d" },
  { name: "Bilakuzuk", value: 7500000, color: "#ffc658" },
  { name: "Zanjir", value: 12000000, color: "#ff7300" },
  { name: "Boshqa", value: 3750000, color: "#a4de6c" },
]

export function ProfitByCategory() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Category Profit Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={categoryProfitData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`₹${(value / 1000000).toFixed(1)}M`, ""]} />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
              <Bar dataKey="cost" fill="#82ca9d" name="Cost" />
              <Bar dataKey="profit" fill="#ffc658" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profit Distribution by Category</CardTitle>
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
              <Tooltip formatter={(value: number) => [`₹${(value / 1000000).toFixed(1)}M`, ""]} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Profit Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryProfitData.map((category) => (
                <TableRow key={category.name}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>₹{(category.revenue / 1000000).toFixed(1)}M</TableCell>
                  <TableCell>₹{(category.cost / 1000000).toFixed(1)}M</TableCell>
                  <TableCell>₹{(category.profit / 1000000).toFixed(1)}M</TableCell>
                  <TableCell>{category.margin}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

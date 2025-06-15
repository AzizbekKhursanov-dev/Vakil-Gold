"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock data - in real app this would come from Firebase
const branchProfitData = [
  { name: "Central", revenue: 85000000, cost: 59500000, profit: 25500000, margin: 30 },
  { name: "Bulung'ur", revenue: 32000000, cost: 24000000, profit: 8000000, margin: 25 },
  { name: "Qizil Tepa", revenue: 28000000, cost: 21000000, profit: 7000000, margin: 25 },
  { name: "Tashkent", revenue: 45000000, cost: 33750000, profit: 11250000, margin: 25 },
]

const pieData = [
  { name: "Central", value: 25500000, color: "#8884d8" },
  { name: "Bulung'ur", value: 8000000, color: "#82ca9d" },
  { name: "Qizil Tepa", value: 7000000, color: "#ffc658" },
  { name: "Tashkent", value: 11250000, color: "#ff7300" },
]

export function ProfitByBranch() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Branch Profit Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={branchProfitData}>
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
          <CardTitle>Profit Distribution</CardTitle>
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
          <CardTitle>Branch Profit Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchProfitData.map((branch) => (
                <TableRow key={branch.name}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>₹{(branch.revenue / 1000000).toFixed(1)}M</TableCell>
                  <TableCell>₹{(branch.cost / 1000000).toFixed(1)}M</TableCell>
                  <TableCell>₹{(branch.profit / 1000000).toFixed(1)}M</TableCell>
                  <TableCell>{branch.margin}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

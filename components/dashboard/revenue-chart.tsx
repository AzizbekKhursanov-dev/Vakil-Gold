"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { month: "Jan", revenue: 45000000, profit: 12000000 },
  { month: "Feb", revenue: 52000000, profit: 14000000 },
  { month: "Mar", revenue: 48000000, profit: 13000000 },
  { month: "Apr", revenue: 61000000, profit: 16000000 },
  { month: "May", revenue: 55000000, profit: 15000000 },
  { month: "Jun", revenue: 67000000, profit: 18000000 },
]

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value: number) => [`${(value / 1000000).toFixed(1)}M so'm`, ""]} />
        <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Revenue" />
        <Line type="monotone" dataKey="profit" stroke="#82ca9d" strokeWidth={2} name="Profit" />
      </LineChart>
    </ResponsiveContainer>
  )
}

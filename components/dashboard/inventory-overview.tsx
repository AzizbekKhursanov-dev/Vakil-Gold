"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

const data = [
  { name: "Uzuk (Rings)", value: 1247, color: "#8884d8" },
  { name: "Sirg'a (Earrings)", value: 856, color: "#82ca9d" },
  { name: "Bilakuzuk (Bracelets)", value: 423, color: "#ffc658" },
  { name: "Zanjir (Chains)", value: 321, color: "#ff7300" },
]

export function InventoryOverview() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

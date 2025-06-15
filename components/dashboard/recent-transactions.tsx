"use client"

import { Badge } from "@/components/ui/badge"

const transactions = [
  {
    id: "1",
    item: "Gold Ring - Model D MJ",
    branch: "Bulung'ur",
    amount: 2500000,
    status: "sold",
    date: "2024-01-15",
  },
  {
    id: "2",
    item: "Diamond Earrings - Model SE 45",
    branch: "Qizil Tepa",
    amount: 4200000,
    status: "sold",
    date: "2024-01-14",
  },
  {
    id: "3",
    item: "Gold Chain - Model ZN 12",
    branch: "Central",
    amount: 1800000,
    status: "transferred",
    date: "2024-01-14",
  },
  {
    id: "4",
    item: "Silver Bracelet - Model BL 08",
    branch: "Tashkent",
    amount: 950000,
    status: "returned",
    date: "2024-01-13",
  },
]

export function RecentTransactions() {
  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <p className="font-medium">{transaction.item}</p>
            <p className="text-sm text-muted-foreground">{transaction.branch}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="font-medium">{transaction.amount.toLocaleString()} so'm</p>
            <Badge
              variant={
                transaction.status === "sold"
                  ? "default"
                  : transaction.status === "transferred"
                    ? "secondary"
                    : "destructive"
              }
            >
              {transaction.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}

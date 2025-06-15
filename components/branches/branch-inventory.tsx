"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState } from "react"

interface BranchInventoryProps {
  branchId: string
}

// Mock data - in real app this would come from Firebase
const inventoryItems = [
  {
    id: "1",
    model: "D MJ",
    category: "Uzuk",
    weight: 3.62,
    lomNarxi: 800000,
    lomNarxiKirim: 850000,
    sellingPrice: 2500000,
    status: "available",
  },
  {
    id: "2",
    model: "SE 45",
    category: "Sirg'a",
    weight: 2.15,
    lomNarxi: 800000,
    lomNarxiKirim: 850000,
    sellingPrice: 1800000,
    status: "sold",
  },
  {
    id: "3",
    model: "ZN 12",
    category: "Zanjir",
    weight: 5.2,
    lomNarxi: 800000,
    lomNarxiKirim: 850000,
    sellingPrice: 3200000,
    status: "available",
  },
  {
    id: "4",
    model: "BL 08",
    category: "Bilakuzuk",
    weight: 1.8,
    lomNarxi: 800000,
    lomNarxiKirim: 850000,
    sellingPrice: 1500000,
    status: "available",
  },
  {
    id: "5",
    model: "D KL",
    category: "Uzuk",
    weight: 4.1,
    lomNarxi: 800000,
    lomNarxiKirim: 850000,
    sellingPrice: 2800000,
    status: "returned",
  },
]

export function BranchInventory({ branchId }: BranchInventoryProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredItems = inventoryItems.filter((item) => item.model.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Branch Inventory</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Weight (g)</TableHead>
              <TableHead>Lom Narxi Kirim</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.model}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.weight}</TableCell>
                <TableCell>₹{item.lomNarxiKirim.toLocaleString()}</TableCell>
                <TableCell>₹{item.sellingPrice.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.status === "available" ? "default" : item.status === "sold" ? "secondary" : "destructive"
                    }
                  >
                    {item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

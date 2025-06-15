"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils/currency"
import { useBranches } from "@/lib/hooks/use-branches"
import { TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react"

interface SupplierBalance {
  id: string
  supplierName: string
  totalReceived: number
  totalPaid: number
  balance: number
  lastTransactionDate: string
  branch: string
  branchName: string
}

export function SupplierBalanceTracker() {
  const [balances, setBalances] = useState<SupplierBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    supplier: "",
    branch: "",
    balanceType: "all", // all, positive, negative
  })
  const { branches } = useBranches()

  useEffect(() => {
    // Simulate loading supplier balances
    const timer = setTimeout(() => {
      const mockBalances: SupplierBalance[] = [
        {
          id: "1",
          supplierName: "Toshkent Zargarlik",
          totalReceived: 15000000,
          totalPaid: 12000000,
          balance: 3000000,
          lastTransactionDate: "2024-01-15",
          branch: "central",
          branchName: "Markaziy ombor",
        },
        {
          id: "2",
          supplierName: "Samarqand Gold",
          totalReceived: 8500000,
          totalPaid: 9000000,
          balance: -500000,
          lastTransactionDate: "2024-01-14",
          branch: "branch1",
          branchName: "Chilonzor filiali",
        },
        {
          id: "3",
          supplierName: "Buxoro Jewelry",
          totalReceived: 12000000,
          totalPaid: 11500000,
          balance: 500000,
          lastTransactionDate: "2024-01-13",
          branch: "branch2",
          branchName: "Yunusobod filiali",
        },
      ]
      setBalances(mockBalances)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const filteredBalances = balances.filter((balance) => {
    if (filters.supplier && !balance.supplierName.toLowerCase().includes(filters.supplier.toLowerCase())) {
      return false
    }
    if (filters.branch && filters.branch !== "all" && balance.branch !== filters.branch) {
      return false
    }
    if (filters.balanceType === "positive" && balance.balance <= 0) {
      return false
    }
    if (filters.balanceType === "negative" && balance.balance >= 0) {
      return false
    }
    return true
  })

  const totalReceived = filteredBalances.reduce((sum, balance) => sum + balance.totalReceived, 0)
  const totalPaid = filteredBalances.reduce((sum, balance) => sum + balance.totalPaid, 0)
  const netBalance = totalReceived - totalPaid
  const positiveBalances = filteredBalances.filter((b) => b.balance > 0).length
  const negativeBalances = filteredBalances.filter((b) => b.balance < 0).length

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading supplier balances...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(netBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBalances.length}</div>
            <p className="text-xs text-muted-foreground">
              {positiveBalances} positive, {negativeBalances} negative
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Supplier Name</Label>
              <Input
                value={filters.supplier}
                onChange={(e) => setFilters((prev) => ({ ...prev, supplier: e.target.value }))}
                placeholder="Search supplier..."
              />
            </div>

            <div className="space-y-2">
              <Label>Branch</Label>
              <Select
                value={filters.branch}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, branch: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Balance Type</Label>
              <Select
                value={filters.balanceType}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, balanceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All balances</SelectItem>
                  <SelectItem value="positive">Positive balances</SelectItem>
                  <SelectItem value="negative">Negative balances</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={() =>
                setFilters({
                  supplier: "",
                  branch: "",
                  balanceType: "all",
                })
              }
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Balances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Total Received</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Transaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBalances.map((balance) => (
                <TableRow key={balance.id}>
                  <TableCell className="font-medium">{balance.supplierName}</TableCell>
                  <TableCell>{balance.branchName}</TableCell>
                  <TableCell className="text-green-600">{formatCurrency(balance.totalReceived)}</TableCell>
                  <TableCell className="text-red-600">{formatCurrency(balance.totalPaid)}</TableCell>
                  <TableCell className={balance.balance >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(balance.balance)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={balance.balance >= 0 ? "default" : "destructive"}>
                      {balance.balance >= 0 ? "Credit" : "Debit"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(balance.lastTransactionDate).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredBalances.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No supplier balances found</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

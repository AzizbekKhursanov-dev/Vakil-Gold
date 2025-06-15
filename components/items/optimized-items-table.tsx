"use client"

import React, { useState, useMemo, useCallback } from "react"
import { FixedSizeList as List } from "react-window"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useItems } from "@/hooks/useItems"
import { formatCurrency } from "@/lib/utils/currency"
import { Search, Filter, Download, Plus } from "lucide-react"

interface ItemRowProps {
  index: number
  style: React.CSSProperties
  data: {
    items: any[]
    onItemClick: (item: any) => void
  }
}

const ItemRow = React.memo<ItemRowProps>(({ index, style, data }) => {
  const item = data.items[index]

  return (
    <div style={style} className="px-4 py-2 border-b hover:bg-muted/50 cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{item.model}</p>
              <p className="text-xs text-muted-foreground">{item.category}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{formatCurrency(item.sellingPrice)}</p>
              <p className="text-xs text-muted-foreground">{item.weight}g</p>
            </div>
            <Badge variant={item.status === "available" ? "default" : "secondary"}>
              {item.status === "available" ? "Mavjud" : "Sotilgan"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
})

ItemRow.displayName = "ItemRow"

interface OptimizedItemsTableProps {
  onAddItem?: () => void
  onItemClick?: (item: any) => void
}

export const OptimizedItemsTable = React.memo<OptimizedItemsTableProps>(({ onAddItem, onItemClick = () => {} }) => {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const { items, loading, stats } = useItems({
    search,
    category: categoryFilter,
    status: statusFilter,
  })

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.model.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())

      const matchesCategory = !categoryFilter || item.category === categoryFilter
      const matchesStatus = !statusFilter || item.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [items, search, categoryFilter, statusFilter])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, [])

  const itemData = useMemo(
    () => ({
      items: filteredItems,
      onItemClick,
    }),
    [filteredItems, onItemClick],
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jami</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mavjud</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sotilgan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sold}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jami Qiymat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Mahsulot qidirish..." value={search} onChange={handleSearchChange} className="pl-8" />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtr
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Eksport
          </Button>
        </div>
        {onAddItem && (
          <Button onClick={onAddItem} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Qo'shish
          </Button>
        )}
      </div>

      {/* Virtual Scrolling Table */}
      <Card>
        <CardContent className="p-0">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Mahsulotlar topilmadi</p>
            </div>
          ) : (
            <List
              height={600}
              itemCount={filteredItems.length}
              itemSize={80}
              itemData={itemData}
              className="virtual-scroll-container"
            >
              {ItemRow}
            </List>
          )}
        </CardContent>
      </Card>
    </div>
  )
})

OptimizedItemsTable.displayName = "OptimizedItemsTable"

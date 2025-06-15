"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { BranchCard } from "@/components/branches/branch-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BranchForm } from "@/components/branches/branch-form"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Branch } from "@/lib/types/branch"

interface OptimizedBranchListProps {
  branches: Branch[]
  loading: boolean
  error?: string | null
  onUpdate?: () => void
}

export function OptimizedBranchList({ branches, loading, error, onUpdate }: OptimizedBranchListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  // Memoized filtered and sorted branches
  const filteredBranches = useMemo(() => {
    let result = [...branches]

    // Search filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase()
      result = result.filter(
        (branch) =>
          branch.name.toLowerCase().includes(searchTermLower) ||
          branch.location.toLowerCase().includes(searchTermLower) ||
          branch.manager.toLowerCase().includes(searchTermLower),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((branch) => branch.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      if (typeFilter === "provider") {
        result = result.filter((branch) => branch.isProvider)
      } else {
        result = result.filter((branch) => !branch.isProvider)
      }
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case "name":
          aValue = a.name
          bValue = b.name
          break
        case "location":
          aValue = a.location
          bValue = b.location
          break
        case "createdAt":
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        default:
          aValue = a.createdAt
          bValue = b.createdAt
      }

      if (typeof aValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }
    })

    return result
  }, [branches, searchTerm, sortBy, sortDirection, statusFilter, typeFilter])

  const handleSortDirectionToggle = useCallback(() => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Yuklanmoqda...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <div className="text-center">
            <p className="text-destructive mb-2">Xatolik: {error}</p>
            <Button onClick={onUpdate}>Qayta yuklash</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4 w-full">
          <div className="w-full max-w-xs">
            <Label htmlFor="search" className="sr-only">
              Qidirish
            </Label>
            <Input
              id="search"
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="sortBy" className="whitespace-nowrap">
              Saralash:
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sortBy" className="w-[180px]">
                <SelectValue placeholder="Saralash turi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nomi bo'yicha</SelectItem>
                <SelectItem value="location">Joylashuv bo'yicha</SelectItem>
                <SelectItem value="createdAt">Sana bo'yicha</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" onClick={handleSortDirectionToggle}>
              {sortDirection === "asc" ? "↓" : "↑"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="inactive">Nofaol</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha turlar</SelectItem>
                <SelectItem value="provider">Ta'minotchi</SelectItem>
                <SelectItem value="branch">Filial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Filial qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Yangi filial qo'shish</DialogTitle>
            </DialogHeader>
            <BranchForm
              onSuccess={() => {
                setIsDialogOpen(false)
                if (onUpdate) onUpdate()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      {filteredBranches.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all" || typeFilter !== "all"
              ? "Filtr shartlariga mos filiallar topilmadi"
              : "Filiallar topilmadi"}
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Filial qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Yangi filial qo'shish</DialogTitle>
              </DialogHeader>
              <BranchForm
                onSuccess={() => {
                  setIsDialogOpen(false)
                  if (onUpdate) onUpdate()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBranches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}

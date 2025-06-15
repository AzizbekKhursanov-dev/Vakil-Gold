"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { BranchCard } from "@/components/branches/branch-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BranchForm } from "@/components/branches/branch-form"
import { branchService } from "@/lib/services/branch.service"
import { BRANCHES } from "@/lib/config/constants"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Branch } from "@/lib/types/branch"

interface BranchListProps {
  branches: Branch[]
  loading: boolean
  error?: string | null
  onUpdate?: () => void
}

export function BranchList({ branches, loading, error, onUpdate }: BranchListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Initialize default branches if none exist
  useEffect(() => {
    const initializeBranches = async () => {
      if (!loading && branches.length === 0) {
        try {
          for (const branch of BRANCHES) {
            await branchService.createBranch({
              name: branch.name,
              location: branch.location,
              manager: "Boshqaruvchi",
              isProvider: branch.isProvider,
            })
          }
          if (onUpdate) onUpdate()
        } catch (error) {
          console.error("Error initializing branches:", error)
        }
      }
    }

    initializeBranches()
  }, [loading, branches.length, onUpdate])

  // Filter and sort branches
  const filteredBranches = branches
    .filter(
      (branch) =>
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.manager.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      // Custom sorting logic
      if (sortBy === "name") {
        return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      } else if (sortBy === "location") {
        return sortDirection === "asc" ? a.location.localeCompare(b.location) : b.location.localeCompare(a.location)
      } else if (sortBy === "createdAt") {
        return sortDirection === "asc"
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return 0
    })

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
      <div className="flex justify-between items-center">
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

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
            >
              {sortDirection === "asc" ? "↓" : "↑"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBranches.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground mb-4">Filiallar topilmadi</p>
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
          filteredBranches.map((branch) => <BranchCard key={branch.id} branch={branch} onUpdate={onUpdate} />)
        )}
      </div>
    </div>
  )
}

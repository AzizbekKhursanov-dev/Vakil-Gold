"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Check, ChevronDown, Building2, Warehouse } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useBranch } from "@/lib/contexts/branch-context"
import { collection, query, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { cn } from "@/lib/utils"

interface Branch {
  id: string
  name: string
  isProvider?: boolean
}

export function BranchSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const { selectedBranch, setSelectedBranch } = useBranch()
  const [open, setOpen] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  // Define pages where branch selector should be visible
  const relevantPages = [
    "/items",
    "/monthly-revenue",
    "/profit-analysis",
    "/supplier-accounting",
    "/reports",
    "/analytics",
    "/recommendations",
    "/expenses",
  ]

  // Check if current page needs branch selector
  const shouldShowBranchSelector = relevantPages.some((page) => pathname.startsWith(page))

  useEffect(() => {
    if (!shouldShowBranchSelector) {
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined

    const fetchBranches = async () => {
      try {
        setLoading(true)

        const branchesQuery = query(collection(db, "branches"), orderBy("createdAt", "desc"))

        unsubscribe = onSnapshot(
          branchesQuery,
          (snapshot) => {
            const branchList = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Branch[]

            setBranches(branchList)
            setLoading(false)
          },
          (error) => {
            console.error("Error fetching branches:", error)
            setLoading(false)
          },
        )
      } catch (error) {
        console.error("Error setting up branches listener:", error)
        setLoading(false)
      }
    }

    fetchBranches()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [shouldShowBranchSelector])

  const handleBranchSelect = (branch: Branch | null) => {
    setSelectedBranch(branch)
    setOpen(false)

    // If inventory/provider branch is selected, redirect to items page
    if (branch?.isProvider && pathname !== "/items") {
      router.push("/items")
    }
  }

  // Don't render if not on relevant pages
  if (!shouldShowBranchSelector) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Yuklanmoqda...</span>
      </div>
    )
  }

  const allBranches = [{ id: "all", name: "Barchasi", isProvider: false }, ...branches]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
          <div className="flex items-center gap-2">
            {selectedBranch?.isProvider ? (
              <Warehouse className="h-4 w-4" />
            ) : selectedBranch?.id === "all" ? (
              <Building2 className="h-4 w-4" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            <span className="truncate">{selectedBranch?.name || "Filial tanlang"}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Filial qidirish..." />
          <CommandList>
            <CommandEmpty>Filial topilmadi.</CommandEmpty>
            <CommandGroup>
              {allBranches.map((branch) => (
                <CommandItem
                  key={branch.id}
                  value={branch.name}
                  onSelect={() => handleBranchSelect(branch.id === "all" ? null : branch)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {branch.isProvider ? (
                      <Warehouse className="h-4 w-4" />
                    ) : branch.id === "all" ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                    <span className="truncate">{branch.isProvider ? "Ombor" : branch.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedBranch?.id === branch.id || (!selectedBranch && branch.id === "all")
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

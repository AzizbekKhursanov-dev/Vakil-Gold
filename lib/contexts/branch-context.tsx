"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { usePathname } from "next/navigation"

interface Branch {
  id: string
  name: string
  address?: string
  phone?: string
  manager?: string
  isProvider?: boolean
  itemCount?: number
  totalValue?: number
  monthlyRevenue?: number
  createdAt?: string
  updatedAt?: string
}

interface BranchContextType {
  selectedBranch: Branch | null
  setSelectedBranch: (branch: Branch | null) => void
  clearBranchSelection: () => void
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

interface BranchProviderProps {
  children: ReactNode
}

export function BranchProvider({ children }: BranchProviderProps) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const pathname = usePathname()

  // Define pages where branch context should be cleared
  const clearBranchPages = ["/", "/branches", "/settings", "/profile", "/backup", "/testing", "/unauthorized"]

  // Clear branch selection on irrelevant pages
  useEffect(() => {
    const shouldClearBranch = clearBranchPages.some((page) => pathname === page || pathname.startsWith("/auth/"))

    if (shouldClearBranch && selectedBranch) {
      setSelectedBranch(null)
    }
  }, [pathname, selectedBranch])

  const clearBranchSelection = () => {
    setSelectedBranch(null)
  }

  const value: BranchContextType = {
    selectedBranch,
    setSelectedBranch,
    clearBranchSelection,
  }

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
}

export function useBranch() {
  const context = useContext(BranchContext)
  if (context === undefined) {
    throw new Error("useBranch must be used within a BranchProvider")
  }
  return context
}

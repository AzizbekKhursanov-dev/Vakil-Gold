"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { BranchDetails } from "@/components/branches/branch-details"

interface BranchDetailsPageProps {
  params: {
    branchId: string
  }
}

export default function BranchDetailsPage({ params }: BranchDetailsPageProps) {
  const searchParams = useSearchParams()
  const [defaultTab, setDefaultTab] = useState("items")

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setDefaultTab(tab)
    }
  }, [searchParams])

  return (
    <AppLayout>
      <BranchDetails branchId={params.branchId} defaultTab={defaultTab} />
    </AppLayout>
  )
}

"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Settings } from "@/components/settings/settings"
import { useBranch } from "@/lib/contexts/branch-context"

export default function SettingsPage() {
  const { selectedBranch } = useBranch()

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Sozlamalar</h1>
        <p className="text-muted-foreground">
          {selectedBranch ? `${selectedBranch.name} filiali sozlamalari` : "Tizim sozlamalari"}
        </p>
      </div>
      <Settings />
    </AppLayout>
  )
}

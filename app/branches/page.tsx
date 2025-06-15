"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { OptimizedBranchList } from "@/components/branches/optimized-branch-list"
import { Button } from "@/components/ui/button"
import { Plus, FileDown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BranchForm } from "@/components/branches/branch-form"
import { useToast } from "@/hooks/use-toast"
import { exportBranchesToExcel } from "@/lib/utils/branch-excel"
import { branchService } from "@/lib/services/branch.service"
import type { Branch } from "@/lib/types/branch"

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  const fetchBranches = async () => {
    setLoading(true)
    setError(null)
    try {
      const branchList = await branchService.getBranches()
      setBranches(branchList)
    } catch (error) {
      console.error("Error fetching branches:", error)
      setError("Filiallarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [])

  const handleExportToExcel = async () => {
    try {
      setExporting(true)
      toast({
        title: "Eksport boshlanmoqda",
        description: "Filiallar ma'lumotlari tayyorlanmoqda...",
      })

      // Simple export without heavy calculations
      const enrichedBranches = branches.map((branch) => ({
        ...branch,
        itemCount: 0,
        availableItemsCount: 0,
        soldItemsCount: 0,
        reservedItemsCount: 0,
        totalValue: 0,
        soldValue: 0,
        totalWeight: 0,
        monthlyRevenue: 0,
        totalProfit: 0,
        profitMargin: 0,
        transactionCount: 0,
        averageItemValue: 0,
        topCategory: "N/A",
        categoryCount: 0,
      }))

      await exportBranchesToExcel(enrichedBranches, `filiallar_hisobot_${new Date().toISOString().split("T")[0]}.xlsx`)

      toast({
        title: "Eksport muvaffaqiyatli",
        description: "Filiallar hisoboti Excel formatiga eksport qilindi",
      })
    } catch (error) {
      console.error("Error exporting branches:", error)
      toast({
        title: "Eksport xatoligi",
        description: "Excel faylini yaratishda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Filiallar</h1>
          <p className="text-muted-foreground">Barcha filiallar ro'yxati va boshqaruvi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportToExcel} disabled={exporting || loading}>
            <FileDown className="mr-2 h-4 w-4" />
            {exporting ? "Eksport qilinmoqda..." : "Excel hisobot"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yangi filial
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Yangi filial qo'shish</DialogTitle>
              </DialogHeader>
              <BranchForm
                onSuccess={() => {
                  setIsDialogOpen(false)
                  fetchBranches()
                  toast({
                    title: "Filial yaratildi",
                    description: "Yangi filial muvaffaqiyatli yaratildi",
                  })
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <OptimizedBranchList branches={branches} loading={loading} error={error} onUpdate={fetchBranches} />
    </AppLayout>
  )
}

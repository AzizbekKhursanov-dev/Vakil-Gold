"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, MapPin, User, Package, DollarSign, TrendingUp, Eye, BarChart3, ArrowUpDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"
import { branchService } from "@/lib/services/branch.service"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Branch } from "@/lib/types/branch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BranchForm } from "@/components/branches/branch-form"

interface BranchCardProps {
  branch: Branch
  onUpdate: () => void
}

interface BranchStats {
  itemCount: number
  totalValue: number
  monthlyRevenue: number
  availableItems: number
  soldItems: number
  transactionCount: number
}

export function BranchCard({ branch, onUpdate }: BranchCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [stats, setStats] = useState<BranchStats>({
    itemCount: 0,
    totalValue: 0,
    monthlyRevenue: 0,
    availableItems: 0,
    soldItems: 0,
    transactionCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBranchStats = async () => {
      try {
        setLoading(true)

        // Get branch items
        const items = await branchService.getBranchItems(branch.id)

        // Get branch transactions
        const transactions = await branchService.getBranchTransactions(branch.id)

        // Calculate statistics
        const availableItems = items.filter((item) => item.status === "available").length
        const soldItems = items.filter((item) => item.status === "sold").length
        const totalValue = items
          .filter((item) => item.status === "available")
          .reduce((sum, item) => sum + (item.sellingPrice || 0) * (item.quantity || 1), 0)

        // Calculate monthly revenue (current month)
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const monthlyRevenue = items
          .filter((item) => {
            if (item.status !== "sold" || !item.soldDate) return false
            const soldDate = new Date(item.soldDate)
            return soldDate.getMonth() === currentMonth && soldDate.getFullYear() === currentYear
          })
          .reduce((sum, item) => sum + (item.sellingPrice || 0) * (item.quantity || 1), 0)

        setStats({
          itemCount: items.length,
          totalValue,
          monthlyRevenue,
          availableItems,
          soldItems,
          transactionCount: transactions.length,
        })

        // Update branch stats in database
        await branchService.updateBranchStats(branch.id, {
          itemCount: items.length,
          totalValue,
          monthlyRevenue,
        })
      } catch (error) {
        console.error("Error fetching branch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBranchStats()
  }, [branch.id])

  const handleDelete = async () => {
    try {
      await branchService.deleteBranch(branch.id)
      toast({
        title: "Filial o'chirildi",
        description: "Filial muvaffaqiyatli o'chirildi",
      })
      onUpdate()
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Filialni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{branch.name}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-3 w-3" />
              {branch.location}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="mr-1 h-3 w-3" />
              {branch.manager}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant={branch.status === "active" ? "default" : "secondary"}>
              {branch.status === "active" ? "Faol" : "Nofaol"}
            </Badge>
            {branch.isProvider && (
              <Badge variant="outline" className="text-xs">
                Ta'minotchi
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center">
              <Package className="mr-1 h-3 w-3" />
              Mahsulotlar:
            </span>
            <span className="font-medium">{loading ? "..." : stats.itemCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center">
              <DollarSign className="mr-1 h-3 w-3" />
              Qiymat:
            </span>
            <span className="font-medium">{loading ? "..." : formatCurrency(stats.totalValue)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center">
              <TrendingUp className="mr-1 h-3 w-3" />
              Oylik:
            </span>
            <span className="font-medium">{loading ? "..." : formatCurrency(stats.monthlyRevenue)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center">
              <BarChart3 className="mr-1 h-3 w-3" />
              Tranzaksiya:
            </span>
            <span className="font-medium">{loading ? "..." : stats.transactionCount}</span>
          </div>
        </div>

        {/* Item Status Breakdown */}
        {!loading && stats.itemCount > 0 && (
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Mavjud: {stats.availableItems}</span>
              <span>Sotilgan: {stats.soldItems}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className="bg-green-600 h-1.5 rounded-full"
                style={{
                  width: `${stats.itemCount > 0 ? (stats.availableItems / stats.itemCount) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Link href={`/branches/${branch.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="mr-1 h-3 w-3" />
              Ko'rish
            </Button>
          </Link>

          <Link href={`/branches/${branch.id}?tab=transactions`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <ArrowUpDown className="mr-1 h-3 w-3" />
              Tranzaksiyalar
            </Button>
          </Link>
        </div>

        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="mr-1 h-3 w-3" />
                Tahrirlash
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Filialni tahrirlash</DialogTitle>
              </DialogHeader>
              <BranchForm
                branch={branch}
                onSuccess={() => {
                  setIsEditDialogOpen(false)
                  onUpdate()
                  toast({
                    title: "Filial yangilandi",
                    description: "Filial ma'lumotlari muvaffaqiyatli yangilandi",
                  })
                }}
              />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Trash2 className="mr-1 h-3 w-3" />
                O'chirish
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Filialni o'chirish</AlertDialogTitle>
                <AlertDialogDescription>
                  Haqiqatan ham "{branch.name}" filialini o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  O'chirish
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

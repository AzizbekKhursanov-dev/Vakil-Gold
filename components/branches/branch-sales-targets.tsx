"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { branchService } from "@/lib/services/branch.service"
import { formatCurrency } from "@/lib/utils/currency"
import { Target, TrendingUp, Calendar, Award, AlertCircle, Plus, Edit } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { BranchSalesTarget } from "@/lib/types/branch"

interface BranchSalesTargetsProps {
  branchId: string
  branchName: string
}

export function BranchSalesTargets({ branchId, branchName }: BranchSalesTargetsProps) {
  const [targets, setTargets] = useState<BranchSalesTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [showSetTargetDialog, setShowSetTargetDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [currentTarget, setCurrentTarget] = useState<BranchSalesTarget | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const { toast } = useToast()

  useEffect(() => {
    fetchSalesTargets()
  }, [branchId, selectedYear])

  const fetchSalesTargets = async () => {
    try {
      setLoading(true)
      const targetsList = await branchService.getSalesTargets(branchId, selectedYear)
      setTargets(targetsList)
    } catch (error) {
      console.error("Error fetching sales targets:", error)
      toast({
        title: "Xatolik",
        description: "Sotuv maqsadlarini yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSetTarget = async (data: Omit<BranchSalesTarget, "id">) => {
    try {
      await branchService.setSalesTarget(data)
      toast({
        title: "Maqsad o'rnatildi",
        description: "Sotuv maqsadi muvaffaqiyatli o'rnatildi",
      })
      setShowSetTargetDialog(false)
      fetchSalesTargets()
    } catch (error) {
      console.error("Error setting sales target:", error)
      toast({
        title: "Xatolik",
        description: "Sotuv maqsadini o'rnatishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTarget = async (targetId: string, data: Partial<BranchSalesTarget>) => {
    try {
      await branchService.updateSalesTarget(targetId, data)
      toast({
        title: "Maqsad yangilandi",
        description: "Sotuv maqsadi muvaffaqiyatli yangilandi",
      })
      setShowEditDialog(false)
      setCurrentTarget(null)
      fetchSalesTargets()
    } catch (error) {
      console.error("Error updating sales target:", error)
      toast({
        title: "Xatolik",
        description: "Sotuv maqsadini yangilashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const getMonthName = (month: number) => {
    const months = [
      "Yanvar",
      "Fevral",
      "Mart",
      "Aprel",
      "May",
      "Iyun",
      "Iyul",
      "Avgust",
      "Sentabr",
      "Oktabr",
      "Noyabr",
      "Dekabr",
    ]
    return months[month - 1]
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "achieved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Erishildi
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Jarayonda
          </Badge>
        )
      case "missed":
        return <Badge variant="destructive">O'tkazib yuborildi</Badge>
      case "pending":
        return <Badge variant="outline">Kutilmoqda</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const calculateProgress = (target: BranchSalesTarget) => {
    if (!target.actualAmount || target.targetAmount === 0) return 0
    return Math.min((target.actualAmount / target.targetAmount) * 100, 100)
  }

  const calculateItemProgress = (target: BranchSalesTarget) => {
    if (!target.itemsSoldActual || target.itemsSoldTarget === 0) return 0
    return Math.min((target.itemsSoldActual / target.itemsSoldTarget) * 100, 100)
  }

  // Calculate overall performance
  const completedTargets = targets.filter((t) => t.status === "achieved")
  const totalTargetAmount = targets.reduce((sum, t) => sum + t.targetAmount, 0)
  const totalActualAmount = targets.reduce((sum, t) => sum + (t.actualAmount || 0), 0)
  const overallProgress = totalTargetAmount > 0 ? (totalActualAmount / totalTargetAmount) * 100 : 0

  const currentMonth = new Date().getMonth() + 1
  const currentMonthTarget = targets.find((t) => t.month === currentMonth && t.year === selectedYear)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yillik maqsad</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTargetAmount)}</div>
            <Progress value={overallProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{overallProgress.toFixed(1)}% bajarildi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erishilgan maqsadlar</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTargets.length}</div>
            <p className="text-xs text-muted-foreground">{targets.length} dan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Joriy oy</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {currentMonthTarget ? (
              <>
                <div className="text-2xl font-bold">{formatCurrency(currentMonthTarget.actualAmount || 0)}</div>
                <Progress value={calculateProgress(currentMonthTarget)} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(currentMonthTarget.targetAmount)} maqsad
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Maqsad o'rnatilmagan</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O'rtacha bajarilish</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {overallProgress >= 100
                ? "Maqsad oshirildi"
                : overallProgress >= 80
                  ? "Yaxshi natija"
                  : "Yaxshilash kerak"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Sotuv maqsadlari</CardTitle>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showSetTargetDialog} onOpenChange={setShowSetTargetDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Maqsad o'rnatish
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yangi sotuv maqsadi</DialogTitle>
                </DialogHeader>
                <SalesTargetForm
                  branchId={branchId}
                  branchName={branchName}
                  year={selectedYear}
                  onSubmit={handleSetTarget}
                  onCancel={() => setShowSetTargetDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Oy</TableHead>
                  <TableHead>Maqsad (so'm)</TableHead>
                  <TableHead>Haqiqiy (so'm)</TableHead>
                  <TableHead>Mahsulot maqsadi</TableHead>
                  <TableHead>Sotilgan mahsulotlar</TableHead>
                  <TableHead>Bajarilish</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1
                  const target = targets.find((t) => t.month === month)

                  return (
                    <TableRow key={month}>
                      <TableCell className="font-medium">{getMonthName(month)}</TableCell>
                      <TableCell>{target ? formatCurrency(target.targetAmount) : "-"}</TableCell>
                      <TableCell>{target ? formatCurrency(target.actualAmount || 0) : "-"}</TableCell>
                      <TableCell>{target ? target.itemsSoldTarget : "-"}</TableCell>
                      <TableCell>{target ? target.itemsSoldActual || 0 : "-"}</TableCell>
                      <TableCell>
                        {target ? (
                          <div className="space-y-1">
                            <Progress value={calculateProgress(target)} className="h-2" />
                            <div className="text-xs text-muted-foreground">{calculateProgress(target).toFixed(1)}%</div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {target ? getStatusBadge(target.status) : <Badge variant="outline">Maqsad yo'q</Badge>}
                      </TableCell>
                      <TableCell>{target && target.bonusAmount ? formatCurrency(target.bonusAmount) : "-"}</TableCell>
                      <TableCell className="text-right">
                        {target ? (
                          <Dialog
                            open={showEditDialog && currentTarget?.id === target.id}
                            onOpenChange={(open) => {
                              setShowEditDialog(open)
                              if (!open) setCurrentTarget(null)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setCurrentTarget(target)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Maqsadni tahrirlash</DialogTitle>
                              </DialogHeader>
                              {currentTarget && (
                                <SalesTargetForm
                                  branchId={branchId}
                                  branchName={branchName}
                                  year={selectedYear}
                                  target={currentTarget}
                                  onSubmit={(data) => handleUpdateTarget(currentTarget.id, data)}
                                  onCancel={() => {
                                    setShowEditDialog(false)
                                    setCurrentTarget(null)
                                  }}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Pre-fill the form with the selected month
                              setShowSetTargetDialog(true)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Samaradorlik tahlili
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Yutuqlar</h4>
              <div className="space-y-2">
                {completedTargets.length > 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Award className="h-4 w-4" />
                    <span className="text-sm">{completedTargets.length} ta maqsadga erishildi</span>
                  </div>
                )}
                {overallProgress > 100 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Yillik maqsad {overallProgress.toFixed(1)}% bajarildi</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Tavsiyalar</h4>
              <div className="space-y-2">
                {overallProgress < 50 && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Sotuv strategiyasini qayta ko'rib chiqish kerak</span>
                  </div>
                )}
                {!currentMonthTarget && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Target className="h-4 w-4" />
                    <span className="text-sm">Joriy oy uchun maqsad o'rnating</span>
                  </div>
                )}
                {targets.filter((t) => t.status === "missed").length > 2 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Maqsadlar realistik emasligini tekshiring</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface SalesTargetFormProps {
  branchId: string
  branchName: string
  year: number
  target?: BranchSalesTarget
  onSubmit: (data: any) => void
  onCancel: () => void
}

function SalesTargetForm({ branchId, branchName, year, target, onSubmit, onCancel }: SalesTargetFormProps) {
  const [formData, setFormData] = useState({
    branchId,
    year,
    month: target?.month || new Date().getMonth() + 1,
    targetAmount: target?.targetAmount || 0,
    itemsSoldTarget: target?.itemsSoldTarget || 0,
    bonusThreshold: target?.bonusThreshold || 0,
    bonusAmount: target?.bonusAmount || 0,
    notes: target?.notes || "",
    actualAmount: target?.actualAmount || 0,
    itemsSoldActual: target?.itemsSoldActual || 0,
    status: target?.status || "pending",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMonthName = (month: number) => {
    const months = [
      "Yanvar",
      "Fevral",
      "Mart",
      "Aprel",
      "May",
      "Iyun",
      "Iyul",
      "Avgust",
      "Sentabr",
      "Oktabr",
      "Noyabr",
      "Dekabr",
    ]
    return months[month - 1]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="month">Oy *</Label>
          <Select
            value={formData.month.toString()}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, month: Number(value) }))}
          >
            <SelectTrigger id="month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {getMonthName(i + 1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Yil</Label>
          <Input
            id="year"
            type="number"
            value={formData.year}
            onChange={(e) => setFormData((prev) => ({ ...prev, year: Number(e.target.value) }))}
            disabled
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="targetAmount">Maqsad summasi (so'm) *</Label>
          <Input
            id="targetAmount"
            type="number"
            value={formData.targetAmount}
            onChange={(e) => setFormData((prev) => ({ ...prev, targetAmount: Number(e.target.value) }))}
            placeholder="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemsSoldTarget">Mahsulot maqsadi *</Label>
          <Input
            id="itemsSoldTarget"
            type="number"
            value={formData.itemsSoldTarget}
            onChange={(e) => setFormData((prev) => ({ ...prev, itemsSoldTarget: Number(e.target.value) }))}
            placeholder="0"
            required
          />
        </div>
      </div>

      {target && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="actualAmount">Haqiqiy summa (so'm)</Label>
            <Input
              id="actualAmount"
              type="number"
              value={formData.actualAmount}
              onChange={(e) => setFormData((prev) => ({ ...prev, actualAmount: Number(e.target.value) }))}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemsSoldActual">Sotilgan mahsulotlar</Label>
            <Input
              id="itemsSoldActual"
              type="number"
              value={formData.itemsSoldActual}
              onChange={(e) => setFormData((prev) => ({ ...prev, itemsSoldActual: Number(e.target.value) }))}
              placeholder="0"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bonusThreshold">Bonus chegarasi (%)</Label>
          <Input
            id="bonusThreshold"
            type="number"
            value={formData.bonusThreshold}
            onChange={(e) => setFormData((prev) => ({ ...prev, bonusThreshold: Number(e.target.value) }))}
            placeholder="100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bonusAmount">Bonus summasi (so'm)</Label>
          <Input
            id="bonusAmount"
            type="number"
            value={formData.bonusAmount}
            onChange={(e) => setFormData((prev) => ({ ...prev, bonusAmount: Number(e.target.value) }))}
            placeholder="0"
          />
        </div>
      </div>

      {target && (
        <div className="space-y-2">
          <Label htmlFor="status">Holat</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as any }))}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Kutilmoqda</SelectItem>
              <SelectItem value="in_progress">Jarayonda</SelectItem>
              <SelectItem value="achieved">Erishildi</SelectItem>
              <SelectItem value="missed">O'tkazib yuborildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Izohlar</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Qo'shimcha izohlar..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saqlanmoqda..." : target ? "Yangilash" : "O'rnatish"}
        </Button>
      </div>
    </form>
  )
}

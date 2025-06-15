"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { branchService } from "@/lib/services/branch.service"
import { Loader2, Search, Edit, CheckCircle, AlertTriangle, Clock, Plus, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { BranchInventoryCheckType } from "@/lib/types/branch"

interface BranchInventoryCheckProps {
  branchId: string
  branchName: string
}

export function BranchInventoryCheck({ branchId, branchName }: BranchInventoryCheckProps) {
  const [checks, setChecks] = useState<BranchInventoryCheckType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [currentCheck, setCurrentCheck] = useState<BranchInventoryCheckType | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchInventoryChecks()
  }, [branchId])

  const fetchInventoryChecks = async () => {
    try {
      setLoading(true)
      const checksList = await branchService.getInventoryChecks(branchId)
      setChecks(checksList)
    } catch (error) {
      console.error("Error fetching inventory checks:", error)
      toast({
        title: "Xatolik",
        description: "Inventarizatsiya tekshiruvlarini yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredChecks = checks.filter((check) => {
    const matchesSearch =
      check.conductedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.notes?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || check.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleScheduleCheck = async (data: {
    date: string
    conductedBy: string
    notes?: string
  }) => {
    try {
      await branchService.scheduleBranchInventoryCheck(branchId, data.date, data.conductedBy)
      toast({
        title: "Inventarizatsiya rejalashtirildi",
        description: "Yangi inventarizatsiya tekshiruvi muvaffaqiyatli rejalashtirildi",
      })
      setShowScheduleDialog(false)
      fetchInventoryChecks()
    } catch (error) {
      console.error("Error scheduling inventory check:", error)
      toast({
        title: "Xatolik",
        description: "Inventarizatsiya tekshiruvini rejalashtirish xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCheck = async (checkId: string, data: Partial<BranchInventoryCheckType>) => {
    try {
      await branchService.updateInventoryCheck(checkId, data)
      toast({
        title: "Inventarizatsiya yangilandi",
        description: "Inventarizatsiya tekshiruvi muvaffaqiyatli yangilandi",
      })
      setShowUpdateDialog(false)
      setCurrentCheck(null)
      fetchInventoryChecks()
    } catch (error) {
      console.error("Error updating inventory check:", error)
      toast({
        title: "Xatolik",
        description: "Inventarizatsiya tekshiruvini yangilashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Kutilmoqda
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            <Clock className="mr-1 h-3 w-3" />
            Jarayonda
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Yakunlangan
          </Badge>
        )
      case "discrepancies_found":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Nomuvofiqlik topildi
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getNextScheduledCheck = () => {
    const today = new Date()
    const upcomingChecks = checks.filter((check) => check.status === "pending" && new Date(check.date) >= today)
    return upcomingChecks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
  }

  const nextCheck = getNextScheduledCheck()
  const completedChecks = checks.filter((check) => check.status === "completed")
  const pendingChecks = checks.filter((check) => check.status === "pending")

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami tekshiruvlar</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yakunlangan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedChecks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kutilayotgan</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingChecks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keyingi tekshiruv</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {nextCheck ? new Date(nextCheck.date).toLocaleDateString("uz-UZ") : "Rejalashtrilmagan"}
            </div>
            {nextCheck && <div className="text-xs text-muted-foreground">{nextCheck.conductedBy}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventarizatsiya tekshiruvlari</CardTitle>
            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tekshiruv rejalashtirish
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yangi inventarizatsiya tekshiruvi</DialogTitle>
                </DialogHeader>
                <ScheduleCheckForm
                  branchId={branchId}
                  branchName={branchName}
                  onSubmit={handleScheduleCheck}
                  onCancel={() => setShowScheduleDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tekshiruv qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="pending">Kutilmoqda</SelectItem>
                <SelectItem value="in_progress">Jarayonda</SelectItem>
                <SelectItem value="completed">Yakunlangan</SelectItem>
                <SelectItem value="discrepancies_found">Nomuvofiqlik topildi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Checks Table */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Tekshiruvchi</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Tekshirilgan</TableHead>
                    <TableHead>Nomuvofiqlik</TableHead>
                    <TableHead>Keyingi tekshiruv</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChecks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm || statusFilter !== "all"
                            ? "Filtr shartlariga mos tekshiruv topilmadi"
                            : "Hali inventarizatsiya tekshiruvlari yo'q"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredChecks.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell>{new Date(check.date).toLocaleDateString("uz-UZ")}</TableCell>
                        <TableCell className="font-medium">{check.conductedBy}</TableCell>
                        <TableCell>{getStatusBadge(check.status)}</TableCell>
                        <TableCell>{check.itemsChecked}</TableCell>
                        <TableCell>
                          {check.itemsMissing > 0 || check.itemsExcess > 0 ? (
                            <div className="text-red-600">
                              {check.itemsMissing > 0 && `Yo'q: ${check.itemsMissing}`}
                              {check.itemsMissing > 0 && check.itemsExcess > 0 && ", "}
                              {check.itemsExcess > 0 && `Ortiq: ${check.itemsExcess}`}
                            </div>
                          ) : (
                            <span className="text-green-600">Yo'q</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {check.nextScheduledDate
                            ? new Date(check.nextScheduledDate).toLocaleDateString("uz-UZ")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog
                            open={showUpdateDialog && currentCheck?.id === check.id}
                            onOpenChange={(open) => {
                              setShowUpdateDialog(open)
                              if (!open) setCurrentCheck(null)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setCurrentCheck(check)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Tekshiruvni yangilash</DialogTitle>
                              </DialogHeader>
                              {currentCheck && (
                                <UpdateCheckForm
                                  check={currentCheck}
                                  onSubmit={(data) => handleUpdateCheck(currentCheck.id, data)}
                                  onCancel={() => {
                                    setShowUpdateDialog(false)
                                    setCurrentCheck(null)
                                  }}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface ScheduleCheckFormProps {
  branchId: string
  branchName: string
  onSubmit: (data: { date: string; conductedBy: string; notes?: string }) => void
  onCancel: () => void
}

function ScheduleCheckForm({ branchId, branchName, onSubmit, onCancel }: ScheduleCheckFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    conductedBy: "",
    notes: "",
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Tekshiruv sanasi *</Label>
        <Input
          id="date"
          name="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="conductedBy">Tekshiruvchi *</Label>
        <Input
          id="conductedBy"
          name="conductedBy"
          value={formData.conductedBy}
          onChange={(e) => setFormData((prev) => ({ ...prev, conductedBy: e.target.value }))}
          placeholder="Masalan: Alisher Usmanov"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Izohlar</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Qo'shimcha izohlar..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Rejalashtrilmoqda..." : "Rejalashtirish"}
        </Button>
      </div>
    </form>
  )
}

interface UpdateCheckFormProps {
  check: BranchInventoryCheckType
  onSubmit: (data: Partial<BranchInventoryCheckType>) => void
  onCancel: () => void
}

function UpdateCheckForm({ check, onSubmit, onCancel }: UpdateCheckFormProps) {
  const [formData, setFormData] = useState({
    status: check.status,
    itemsChecked: check.itemsChecked,
    itemsMissing: check.itemsMissing,
    itemsExcess: check.itemsExcess,
    notes: check.notes || "",
    completedDate: check.completedDate || "",
    nextScheduledDate: check.nextScheduledDate || "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updateData: Partial<BranchInventoryCheckType> = {
        ...formData,
        completedDate: formData.status === "completed" ? new Date().toISOString() : formData.completedDate,
      }
      await onSubmit(updateData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Holat *</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as any }))}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Holatni tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Kutilmoqda</SelectItem>
            <SelectItem value="in_progress">Jarayonda</SelectItem>
            <SelectItem value="completed">Yakunlangan</SelectItem>
            <SelectItem value="discrepancies_found">Nomuvofiqlik topildi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="itemsChecked">Tekshirilgan</Label>
          <Input
            id="itemsChecked"
            name="itemsChecked"
            type="number"
            value={formData.itemsChecked}
            onChange={(e) => setFormData((prev) => ({ ...prev, itemsChecked: Number(e.target.value) }))}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemsMissing">Yo'qolgan</Label>
          <Input
            id="itemsMissing"
            name="itemsMissing"
            type="number"
            value={formData.itemsMissing}
            onChange={(e) => setFormData((prev) => ({ ...prev, itemsMissing: Number(e.target.value) }))}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemsExcess">Ortiqcha</Label>
          <Input
            id="itemsExcess"
            name="itemsExcess"
            type="number"
            value={formData.itemsExcess}
            onChange={(e) => setFormData((prev) => ({ ...prev, itemsExcess: Number(e.target.value) }))}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextScheduledDate">Keyingi tekshiruv sanasi</Label>
        <Input
          id="nextScheduledDate"
          name="nextScheduledDate"
          type="date"
          value={formData.nextScheduledDate}
          onChange={(e) => setFormData((prev) => ({ ...prev, nextScheduledDate: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Izohlar</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Tekshiruv haqida batafsil ma'lumot..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saqlanmoqda..." : "Yangilash"}
        </Button>
      </div>
    </form>
  )
}

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
import { useToast } from "@/hooks/use-toast"
import { branchService } from "@/lib/services/branch.service"
import { Loader2, Search, Edit, Trash2, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { BranchStaff } from "@/lib/types/branch"

interface BranchStaffManagementProps {
  branchId: string
  branchName: string
}

export function BranchStaffManagement({ branchId, branchName }: BranchStaffManagementProps) {
  const [staff, setStaff] = useState<BranchStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [currentStaff, setCurrentStaff] = useState<BranchStaff | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchStaff()
  }, [branchId])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const staffList = await branchService.getBranchStaff(branchId)
      setStaff(staffList)
    } catch (error) {
      console.error("Error fetching staff:", error)
      toast({
        title: "Xatolik",
        description: "Xodimlar ro'yxatini yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPhone.includes(searchTerm)

    const matchesStatus = statusFilter === "all" || s.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleAddStaff = async (data: Omit<BranchStaff, "id">) => {
    try {
      await branchService.addBranchStaff(data)
      toast({
        title: "Xodim qo'shildi",
        description: "Yangi xodim muvaffaqiyatli qo'shildi",
      })
      setShowAddDialog(false)
      fetchStaff()
    } catch (error) {
      console.error("Error adding staff:", error)
      toast({
        title: "Xatolik",
        description: "Xodimni qo'shishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStaff = async (id: string, data: Partial<BranchStaff>) => {
    try {
      await branchService.updateBranchStaff(id, data)
      toast({
        title: "Xodim yangilandi",
        description: "Xodim ma'lumotlari muvaffaqiyatli yangilandi",
      })
      setShowEditDialog(false)
      setCurrentStaff(null)
      fetchStaff()
    } catch (error) {
      console.error("Error updating staff:", error)
      toast({
        title: "Xatolik",
        description: "Xodimni yangilashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Xodimni o'chirishni tasdiqlaysizmi?")) return

    try {
      await branchService.deleteBranchStaff(id)
      toast({
        title: "Xodim o'chirildi",
        description: "Xodim muvaffaqiyatli o'chirildi",
      })
      fetchStaff()
    } catch (error) {
      console.error("Error deleting staff:", error)
      toast({
        title: "Xatolik",
        description: "Xodimni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Faol
          </Badge>
        )
      case "inactive":
        return <Badge variant="secondary">Faol emas</Badge>
      case "on_leave":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Ta'tilda
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Xodimlar ({filteredStaff.length})</CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Yangi xodim
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yangi xodim qo'shish</DialogTitle>
              </DialogHeader>
              <StaffForm
                branchId={branchId}
                branchName={branchName}
                onSubmit={handleAddStaff}
                onCancel={() => setShowAddDialog(false)}
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
              placeholder="Xodim qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha holatlar</SelectItem>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="inactive">Faol emas</SelectItem>
              <SelectItem value="on_leave">Ta'tilda</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Staff Table */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Lavozim</TableHead>
                  <TableHead>Aloqa</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Ishga qabul qilingan</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || statusFilter !== "all"
                          ? "Filtr shartlariga mos xodim topilmadi"
                          : "Bu filialda hali xodimlar yo'q"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staffMember) => (
                    <TableRow key={staffMember.id}>
                      <TableCell className="font-medium">{staffMember.name}</TableCell>
                      <TableCell>{staffMember.position}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{staffMember.contactPhone}</div>
                          {staffMember.email && (
                            <div className="text-xs text-muted-foreground">{staffMember.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(staffMember.status)}</TableCell>
                      <TableCell>{new Date(staffMember.hireDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog
                            open={showEditDialog && currentStaff?.id === staffMember.id}
                            onOpenChange={(open) => {
                              setShowEditDialog(open)
                              if (!open) setCurrentStaff(null)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setCurrentStaff(staffMember)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Xodimni tahrirlash</DialogTitle>
                              </DialogHeader>
                              {currentStaff && (
                                <StaffForm
                                  branchId={branchId}
                                  branchName={branchName}
                                  staff={currentStaff}
                                  onSubmit={(data) => handleUpdateStaff(currentStaff.id, data)}
                                  onCancel={() => {
                                    setShowEditDialog(false)
                                    setCurrentStaff(null)
                                  }}
                                />
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStaff(staffMember.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
  )
}

interface StaffFormProps {
  branchId: string
  branchName: string
  staff?: BranchStaff
  onSubmit: (data: any) => void
  onCancel: () => void
}

function StaffForm({ branchId, branchName, staff, onSubmit, onCancel }: StaffFormProps) {
  const [formData, setFormData] = useState({
    branchId,
    name: staff?.name || "",
    position: staff?.position || "",
    contactPhone: staff?.contactPhone || "",
    email: staff?.email || "",
    hireDate: staff?.hireDate || new Date().toISOString().split("T")[0],
    status: staff?.status || "active",
    permissions: staff?.permissions || [],
    salary: staff?.salary || 0,
    performanceRating: staff?.performanceRating || 0,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "salary" || name === "performanceRating" ? Number(value) : value,
    }))
  }

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
        <Label htmlFor="name">To'liq ism *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Masalan: Alisher Usmanov"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="position">Lavozim *</Label>
        <Input
          id="position"
          name="position"
          value={formData.position}
          onChange={handleChange}
          placeholder="Masalan: Sotuvchi"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPhone">Telefon raqami *</Label>
        <Input
          id="contactPhone"
          name="contactPhone"
          value={formData.contactPhone}
          onChange={handleChange}
          placeholder="+998 90 123 45 67"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Elektron pochta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="xodim@example.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hireDate">Ishga qabul qilingan sana *</Label>
          <Input id="hireDate" name="hireDate" type="date" value={formData.hireDate} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Holat *</Label>
          <Select
            name="status"
            value={formData.status}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Holatni tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="inactive">Faol emas</SelectItem>
              <SelectItem value="on_leave">Ta'tilda</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salary">Oylik maosh (so'm)</Label>
          <Input
            id="salary"
            name="salary"
            type="number"
            value={formData.salary}
            onChange={handleChange}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="performanceRating">Baholash (1-10)</Label>
          <Input
            id="performanceRating"
            name="performanceRating"
            type="number"
            min="1"
            max="10"
            value={formData.performanceRating}
            onChange={handleChange}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saqlanmoqda..." : staff ? "Yangilash" : "Qo'shish"}
        </Button>
      </div>
    </form>
  )
}

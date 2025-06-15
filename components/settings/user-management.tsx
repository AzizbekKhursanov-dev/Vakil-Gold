"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/hooks/use-auth"
import { Users, Shield, Edit } from "lucide-react"

export function UserManagement() {
  const { toast } = useToast()
  const { user, updateUserProfile } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
  })
  const [isUpdating, setIsUpdating] = useState(false)

  const handleEditUser = () => {
    setFormData({
      name: user?.name || "",
    })
    setIsDialogOpen(true)
  }

  const handleSaveUser = async () => {
    try {
      setIsUpdating(true)
      await updateUserProfile({ name: formData.name })

      toast({
        title: "Administrator yangilandi",
        description: "Administrator ma'lumotlari muvaffaqiyatli yangilandi",
      })
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni yangilashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrator</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground mt-1">Tizimda faqat bitta administrator mavjud</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Huquqlar</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">To'liq</div>
            <p className="text-xs text-muted-foreground mt-1">Administrator barcha huquqlarga ega</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin User */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Administrator ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ism</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge className="bg-red-100 text-red-800">Administrator</Badge>
                </TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-800">Faol</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={handleEditUser}>
                    <Edit className="mr-2 h-4 w-4" />
                    Tahrirlash
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Administrator ma'lumotlarini tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ism *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Administrator ismi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Email o'zgartirish uchun qo'llab-quvvatlash xizmatiga murojaat qiling
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={handleSaveUser} disabled={isUpdating}>
                {isUpdating ? "Yangilanmoqda..." : "Yangilash"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle>Administrator huquqlari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium">Administrator</h4>
                <p className="text-sm text-muted-foreground">Barcha huquqlar</p>
              </div>
              <Badge className="bg-red-100 text-red-800">Administrator</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <span className="text-green-600">✓ Barcha huquqlar</span>
              <span className="text-green-600">✓ Tizim sozlamalari</span>
              <span className="text-green-600">✓ Zaxira boshqaruvi</span>
              <span className="text-green-600">✓ Hisobotlar</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

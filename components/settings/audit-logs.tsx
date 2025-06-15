"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Shield,
  Download,
  Filter,
  Search,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react"

export function AuditLogs() {
  const { toast } = useToast()
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    user: "",
    action: "",
    level: "",
    search: "",
  })

  // Mock audit log data
  const auditLogs = [
    {
      id: "1",
      timestamp: "2024-01-15 14:30:25",
      user: "admin@vakilgold.uz",
      action: "Mahsulot qo'shildi",
      details: "Oltin uzuk 18k (ID: 1247) qo'shildi",
      level: "info",
      ip: "192.168.1.100",
      userAgent: "Chrome 120.0.0.0",
    },
    {
      id: "2",
      timestamp: "2024-01-15 14:25:10",
      user: "manager@vakilgold.uz",
      action: "Narx o'zgartirildi",
      details: "Kumush zanjir narxi 850,000 dan 900,000 ga o'zgartirildi",
      level: "warning",
      ip: "192.168.1.105",
      userAgent: "Firefox 121.0.0.0",
    },
    {
      id: "3",
      timestamp: "2024-01-15 14:20:45",
      user: "user@vakilgold.uz",
      action: "Sotuv amalga oshirildi",
      details: "Marjon gulband sotildi - 1,200,000 so'm",
      level: "success",
      ip: "192.168.1.102",
      userAgent: "Safari 17.2.1",
    },
    {
      id: "4",
      timestamp: "2024-01-15 14:15:30",
      user: "unknown@example.com",
      action: "Kirish urinishi",
      details: "Noto'g'ri parol bilan kirish urinishi",
      level: "error",
      ip: "203.0.113.1",
      userAgent: "Chrome 120.0.0.0",
    },
    {
      id: "5",
      timestamp: "2024-01-15 14:10:15",
      user: "admin@vakilgold.uz",
      action: "Foydalanuvchi yaratildi",
      details: "Yangi foydalanuvchi: newuser@vakilgold.uz",
      level: "info",
      ip: "192.168.1.100",
      userAgent: "Chrome 120.0.0.0",
    },
    {
      id: "6",
      timestamp: "2024-01-15 14:05:00",
      user: "manager@vakilgold.uz",
      action: "Zaxira yaratildi",
      details: "Avtomatik zaxira nusxa yaratildi (245 MB)",
      level: "success",
      ip: "192.168.1.105",
      userAgent: "Firefox 121.0.0.0",
    },
  ]

  const actionTypes = [
    "Mahsulot qo'shildi",
    "Narx o'zgartirildi",
    "Sotuv amalga oshirildi",
    "Kirish urinishi",
    "Foydalanuvchi yaratildi",
    "Zaxira yaratildi",
    "Sozlamalar o'zgartirildi",
    "Ma'lumotlar eksport qilindi",
  ]

  const logLevels = [
    { value: "info", label: "Ma'lumot", color: "bg-blue-100 text-blue-800" },
    { value: "success", label: "Muvaffaqiyat", color: "bg-green-100 text-green-800" },
    { value: "warning", label: "Ogohlantirish", color: "bg-yellow-100 text-yellow-800" },
    { value: "error", label: "Xato", color: "bg-red-100 text-red-800" },
  ]

  const users = ["admin@vakilgold.uz", "manager@vakilgold.uz", "user@vakilgold.uz"]

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "error":
        return <XCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getLevelBadge = (level: string) => {
    const levelConfig = logLevels.find((l) => l.value === level)
    return (
      <Badge className={levelConfig?.color}>
        {getLevelIcon(level)}
        <span className="ml-1">{levelConfig?.label}</span>
      </Badge>
    )
  }

  const handleExport = () => {
    toast({
      title: "Audit loglar eksport qilinmoqda",
      description: "Audit loglar Excel formatida yuklab olinmoqda...",
    })
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      user: "",
      action: "",
      level: "",
      search: "",
    })
  }

  const filteredLogs = auditLogs.filter((log) => {
    if (filters.user && log.user !== filters.user) return false
    if (filters.action && log.action !== filters.action) return false
    if (filters.level && log.level !== filters.level) return false
    if (filters.search && !log.details.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{auditLogs.filter((log) => log.level === "info").length}</div>
                <div className="text-sm text-muted-foreground">Ma'lumot</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{auditLogs.filter((log) => log.level === "success").length}</div>
                <div className="text-sm text-muted-foreground">Muvaffaqiyat</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{auditLogs.filter((log) => log.level === "warning").length}</div>
                <div className="text-sm text-muted-foreground">Ogohlantirish</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{auditLogs.filter((log) => log.level === "error").length}</div>
                <div className="text-sm text-muted-foreground">Xato</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filtrlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Boshlanish sanasi</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tugash sanasi</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Foydalanuvchi</Label>
              <Select value={filters.user} onValueChange={(value) => handleFilterChange("user", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Harakat</Label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange("action", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Daraja</Label>
              <Select value={filters.level} onValueChange={(value) => handleFilterChange("level", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {logLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Qidirish</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Qidirish..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={clearFilters} variant="outline">
              Filtrlarni tozalash
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Eksport qilish
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Audit loglar ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vaqt</TableHead>
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead>Harakat</TableHead>
                <TableHead>Tafsilotlar</TableHead>
                <TableHead>Daraja</TableHead>
                <TableHead>IP manzil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {log.user}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      {log.action}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={log.details}>
                      {log.details}
                    </div>
                  </TableCell>
                  <TableCell>{getLevelBadge(log.level)}</TableCell>
                  <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Hech qanday audit log topilmadi</div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Xavfsizlik tavsiyalari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Muntazam monitoring</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Audit loglarni muntazam ravishda tekshiring va shubhali faoliyatni kuzating.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Kirish urinishlarini kuzatish</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Muvaffaqiyatsiz kirish urinishlarini kuzating va IP manzillarni bloklashni ko'rib chiqing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Loglarni arxivlash</h4>
                <p className="text-sm text-green-700 mt-1">
                  Eski audit loglarni muntazam ravishda arxivlang va xavfsiz joyda saqlang.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Kritik hodisalar</h4>
                <p className="text-sm text-red-700 mt-1">
                  Kritik xatolik va xavfsizlik hodisalari uchun darhol bildirishnoma o'rnating.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

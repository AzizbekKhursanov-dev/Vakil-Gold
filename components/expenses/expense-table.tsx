"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/currency"
import { Edit, Trash2, Check, X, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { updateDoc, doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { useToast } from "@/hooks/use-toast"

interface Expense {
  id: string
  category: string
  subcategory?: string
  amount: number
  description: string
  date: string
  branchName?: string
  paymentMethod: string
  reference?: string
  status: "pending" | "approved" | "paid" | "rejected"
  createdAt: string
}

interface ExpenseTableProps {
  expenses: Expense[]
  loading?: boolean
  onEdit?: (expense: Expense) => void
  showActions?: boolean
}

export function ExpenseTable({ expenses, loading, onEdit, showActions = true }: ExpenseTableProps) {
  const { toast } = useToast()
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Kutilayotgan
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Tasdiqlangan
          </Badge>
        )
      case "paid":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            To'langan
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rad etilgan</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleStatusUpdate = async (expenseId: string, newStatus: string) => {
    try {
      setUpdatingStatus(expenseId)
      await updateDoc(doc(db, "expenses", expenseId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...(newStatus === "approved" && { approvedAt: new Date().toISOString(), approvedBy: "current-user" }),
      })

      toast({
        title: "Holat yangilandi",
        description: `Xarajat holati "${newStatus}" ga o'zgartirildi`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Xatolik",
        description: "Holat yangilashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDelete = async (expenseId: string) => {
    if (!confirm("Bu xarajatni o'chirishni xohlaysizmi?")) return

    try {
      await deleteDoc(doc(db, "expenses", expenseId))
      toast({
        title: "O'chirildi",
        description: "Xarajat muvaffaqiyatli o'chirildi",
      })
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast({
        title: "Xatolik",
        description: "Xarajatni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Yuklanmoqda...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xarajatlar ro'yxati ({expenses.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>Kategoriya</TableHead>
                  <TableHead>Tavsif</TableHead>
                  <TableHead>Filial</TableHead>
                  <TableHead className="text-right">Summa</TableHead>
                  <TableHead>To'lov usuli</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Ma'lumotnoma</TableHead>
                  {showActions && <TableHead className="w-12">Amallar</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{expense.category}</div>
                        {expense.subcategory && (
                          <div className="text-xs text-muted-foreground">{expense.subcategory}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate" title={expense.description}>
                        {expense.description}
                      </div>
                    </TableCell>
                    <TableCell>{expense.branchName || "Umumiy"}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell>{expense.reference || "—"}</TableCell>
                    {showActions && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={updatingStatus === expense.id}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(expense)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Tahrirlash
                              </DropdownMenuItem>
                            )}

                            {expense.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(expense.id, "approved")}>
                                  <Check className="mr-2 h-4 w-4" />
                                  Tasdiqlash
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(expense.id, "rejected")}>
                                  <X className="mr-2 h-4 w-4" />
                                  Rad etish
                                </DropdownMenuItem>
                              </>
                            )}

                            {expense.status === "approved" && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(expense.id, "paid")}>
                                <Check className="mr-2 h-4 w-4" />
                                To'langan deb belgilash
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(expense.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              O'chirish
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">Xarajatlar topilmadi</div>
        )}
      </CardContent>
    </Card>
  )
}

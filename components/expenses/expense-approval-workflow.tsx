"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/utils/currency"
import { CheckCircle, XCircle, Clock, User, Calendar } from "lucide-react"
import { updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/config/firebase"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ExpenseApprovalWorkflowProps {
  expenses: any[]
  onExpenseUpdate: () => void
}

export function ExpenseApprovalWorkflow({ expenses, onExpenseUpdate }: ExpenseApprovalWorkflowProps) {
  const { toast } = useToast()
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null)
  const [approvalComment, setApprovalComment] = useState("")
  const [processing, setProcessing] = useState(false)

  const handleApprovalAction = async (expense: any, action: "approve" | "reject") => {
    setSelectedExpense(expense)
    setApprovalAction(action)
    setShowApprovalDialog(true)
  }

  const processApproval = async () => {
    if (!selectedExpense || !approvalAction) return

    setProcessing(true)
    try {
      const updateData: any = {
        status: approvalAction === "approve" ? "approved" : "rejected",
        updatedAt: new Date().toISOString(),
      }

      if (approvalAction === "approve") {
        updateData.approvedBy = updateData.approvedBy || []
        updateData.approvedBy.push("current-user") // Should come from auth context
        updateData.approvedAt = new Date().toISOString()
        updateData.approvalLevel = (selectedExpense.approvalLevel || 0) + 1
      } else {
        updateData.rejectedBy = "current-user"
        updateData.rejectedAt = new Date().toISOString()
        updateData.rejectionReason = approvalComment
      }

      if (approvalComment) {
        updateData.approvalComments = updateData.approvalComments || []
        updateData.approvalComments.push({
          comment: approvalComment,
          by: "current-user",
          date: new Date().toISOString(),
          action: approvalAction,
        })
      }

      await updateDoc(doc(db, "expenses", selectedExpense.id), updateData)

      toast({
        title: approvalAction === "approve" ? "Tasdiqlandi" : "Rad etildi",
        description: `Xarajat ${approvalAction === "approve" ? "tasdiqlandi" : "rad etildi"}`,
      })

      setShowApprovalDialog(false)
      setApprovalComment("")
      onExpenseUpdate()
    } catch (error) {
      console.error("Error processing approval:", error)
      toast({
        title: "Xatolik",
        description: "Tasdiqlovni amalga oshirishda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const getApprovalLevelBadge = (level: number) => {
    const levels = [
      { level: 0, label: "Boshlang'ich", color: "bg-gray-100 text-gray-800" },
      { level: 1, label: "Menejer", color: "bg-blue-100 text-blue-800" },
      { level: 2, label: "Direktor", color: "bg-green-100 text-green-800" },
      { level: 3, label: "Bosh direktor", color: "bg-purple-100 text-purple-800" },
    ]

    const levelInfo = levels.find((l) => l.level === level) || levels[0]
    return <Badge className={levelInfo.color}>{levelInfo.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    }
    return <Badge className={colors[priority as keyof typeof colors] || colors.medium}>{priority}</Badge>
  }

  const pendingExpenses = expenses.filter((e) => e.status === "pending")
  const approvedExpenses = expenses.filter((e) => e.status === "approved")

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Tasdiq kutayotgan xarajatlar ({pendingExpenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingExpenses.length > 0 ? (
            <div className="space-y-4">
              {pendingExpenses.map((expense) => (
                <div key={expense.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{expense.description}</h3>
                        {getPriorityBadge(expense.priority)}
                        {getApprovalLevelBadge(expense.approvalLevel || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>Kategoriya: {expense.category}</span>
                          <span>Filial: {expense.branchName || "Umumiy"}</span>
                          <span>Sana: {new Date(expense.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(expense.amount)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprovalAction(expense, "approve")}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Tasdiqlash
                      </Button>
                      <Button onClick={() => handleApprovalAction(expense, "reject")} size="sm" variant="destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Rad etish
                      </Button>
                    </div>
                  </div>

                  {expense.notes && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm">{expense.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Yaratuvchi: {expense.createdBy}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Yaratilgan: {new Date(expense.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Tasdiq kutayotgan xarajatlar yo'q</div>
          )}
        </CardContent>
      </Card>

      {/* Recently Approved */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Yaqinda tasdiqlangan xarajatlar ({approvedExpenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedExpenses.length > 0 ? (
            <div className="space-y-4">
              {approvedExpenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{expense.description}</h3>
                        <Badge className="bg-green-100 text-green-800">Tasdiqlangan</Badge>
                      </div>
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(expense.amount)}</div>
                      <div className="text-sm text-muted-foreground">
                        Tasdiqlangan: {expense.approvedAt ? new Date(expense.approvedAt).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Tasdiqlangan xarajatlar yo'q</div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalAction === "approve" ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {approvalAction === "approve" ? "Xarajatni tasdiqlash" : "Xarajatni rad etish"}
            </DialogTitle>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium">{selectedExpense.description}</h3>
                <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(selectedExpense.amount)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedExpense.category} • {selectedExpense.branchName || "Umumiy"}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {approvalAction === "approve" ? "Tasdiqlash izohi" : "Rad etish sababi"}
                  {approvalAction === "reject" && " *"}
                </label>
                <Textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder={
                    approvalAction === "approve" ? "Qo'shimcha izoh (ixtiyoriy)" : "Rad etish sababini kiriting"
                  }
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                  Bekor qilish
                </Button>
                <Button
                  onClick={processApproval}
                  disabled={processing || (approvalAction === "reject" && !approvalComment.trim())}
                  className={approvalAction === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
                  variant={approvalAction === "reject" ? "destructive" : "default"}
                >
                  {processing ? "Amalga oshirilmoqda..." : approvalAction === "approve" ? "Tasdiqlash" : "Rad etish"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

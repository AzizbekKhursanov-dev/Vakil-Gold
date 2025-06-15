"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/currency"
import { Calendar, FileText, Download, Eye } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SupplierTransaction {
  id: string
  type: "payment" | "purchase" | "adjustment"
  itemIds?: string[]
  totalAmount: number
  payedLomNarxi: number
  originalLomNarxi?: number
  priceDifference?: number
  supplierName: string
  transactionDate: string
  paymentDate?: string
  description?: string
  reference?: string
  notes?: string
  attachments?: Array<{
    name: string
    type: string
    size: number
    url: string
  }>
  createdAt: string
  updatedAt: string
}

interface TransactionTableProps {
  transactions?: SupplierTransaction[]
  loading?: boolean
}

export function TransactionTable({ transactions = [], loading = false }: TransactionTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<SupplierTransaction | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Safe array handling
  const safeTransactions = Array.isArray(transactions) ? transactions : []

  const getTransactionTypeBadge = (type: string) => {
    const typeConfig = {
      payment: { color: "bg-green-100 text-green-800", text: "To'lov" },
      purchase: { color: "bg-blue-100 text-blue-800", text: "Sotib olish" },
      adjustment: { color: "bg-orange-100 text-orange-800", text: "Tuzatish" },
    }

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.payment
    return <Badge className={config.color}>{config.text}</Badge>
  }

  const handleViewDetails = (transaction: SupplierTransaction) => {
    setSelectedTransaction(transaction)
    setShowDetails(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Tranzaksiyalar yuklanmoqda...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (safeTransactions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground">Tranzaksiyalar topilmadi</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tranzaksiyalar ({safeTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turi</TableHead>
                  <TableHead>Ta'minotchi</TableHead>
                  <TableHead>Miqdor</TableHead>
                  <TableHead>Lom narxi</TableHead>
                  <TableHead>Narx farqi</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Ma'lumotnoma</TableHead>
                  <TableHead>Qo'shimcha</TableHead>
                  <TableHead>Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{getTransactionTypeBadge(transaction.type)}</TableCell>
                    <TableCell className="font-medium">{transaction.supplierName}</TableCell>
                    <TableCell>{formatCurrency(transaction.totalAmount || 0)}</TableCell>
                    <TableCell>{formatCurrency(transaction.payedLomNarxi || 0)}/g</TableCell>
                    <TableCell className={(transaction.priceDifference || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                      {(transaction.priceDifference || 0) >= 0 ? "+" : ""}
                      {formatCurrency(transaction.priceDifference || 0)}/g
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(transaction.transactionDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.reference || "—"}</TableCell>
                    <TableCell>
                      {transaction.attachments && transaction.attachments.length > 0 ? (
                        <Badge variant="outline">{transaction.attachments.length} fayl</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(transaction)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Jami tranzaksiyalar: </span>
                <span className="font-medium">{safeTransactions.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Jami to'lovlar: </span>
                <span className="font-medium">
                  {formatCurrency(
                    safeTransactions
                      .filter((t) => t.type === "payment")
                      .reduce((sum, t) => sum + (t.totalAmount || 0), 0),
                  )}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">O'rtacha lom narxi: </span>
                <span className="font-medium">
                  {safeTransactions.length > 0
                    ? formatCurrency(
                        safeTransactions.reduce((sum, t) => sum + (t.payedLomNarxi || 0), 0) / safeTransactions.length,
                      )
                    : "0"}
                  /g
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Jami narx farqi: </span>
                <span
                  className={`font-medium ${
                    safeTransactions.reduce((sum, t) => sum + (t.priceDifference || 0), 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(safeTransactions.reduce((sum, t) => sum + (t.priceDifference || 0), 0))}/g
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tranzaksiya tafsilotlari</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Turi:</span>
                  <div>{getTransactionTypeBadge(selectedTransaction.type)}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Ta'minotchi:</span>
                  <p className="font-medium">{selectedTransaction.supplierName}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Jami miqdor:</span>
                  <p className="font-medium">{formatCurrency(selectedTransaction.totalAmount || 0)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">To'langan lom narxi:</span>
                  <p>{formatCurrency(selectedTransaction.payedLomNarxi || 0)}/g</p>
                </div>
                {selectedTransaction.originalLomNarxi && (
                  <div>
                    <span className="text-sm text-muted-foreground">Asl lom narxi:</span>
                    <p>{formatCurrency(selectedTransaction.originalLomNarxi)}/g</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">Narx farqi:</span>
                  <p className={(selectedTransaction.priceDifference || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                    {(selectedTransaction.priceDifference || 0) >= 0 ? "+" : ""}
                    {formatCurrency(selectedTransaction.priceDifference || 0)}/g
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Tranzaksiya sanasi:</span>
                  <p>{new Date(selectedTransaction.transactionDate).toLocaleDateString()}</p>
                </div>
                {selectedTransaction.paymentDate && (
                  <div>
                    <span className="text-sm text-muted-foreground">To'lov sanasi:</span>
                    <p>{new Date(selectedTransaction.paymentDate).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedTransaction.reference && (
                  <div>
                    <span className="text-sm text-muted-foreground">Ma'lumotnoma:</span>
                    <p>{selectedTransaction.reference}</p>
                  </div>
                )}
                {selectedTransaction.itemIds && selectedTransaction.itemIds.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Mahsulotlar soni:</span>
                    <p>{selectedTransaction.itemIds.length} ta</p>
                  </div>
                )}
              </div>

              {selectedTransaction.notes && (
                <div>
                  <span className="text-sm text-muted-foreground">Izohlar:</span>
                  <div className="mt-1 p-3 bg-muted rounded text-sm">{selectedTransaction.notes}</div>
                </div>
              )}

              {selectedTransaction.attachments && selectedTransaction.attachments.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Qo'shimcha hujjatlar:</span>
                  <div className="mt-2 space-y-2">
                    {selectedTransaction.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <div>
                            <div className="font-medium text-sm">{attachment.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {attachment.type} • {formatFileSize(attachment.size)}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Yaratilgan: {new Date(selectedTransaction.createdAt).toLocaleString()}
                {selectedTransaction.updatedAt !== selectedTransaction.createdAt && (
                  <> • Yangilangan: {new Date(selectedTransaction.updatedAt).toLocaleString()}</>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

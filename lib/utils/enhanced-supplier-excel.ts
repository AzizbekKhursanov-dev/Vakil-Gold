import * as XLSX from "xlsx"
import { formatCurrency } from "./currency"
import { format } from "date-fns"
import type { Item } from "@/lib/types/item"

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

interface SupplierDocumentConfirmation {
  id: string
  supplierName: string
  itemIds: string[]
  documentNumber: string
  status: "draft" | "pdf_generated" | "sent_to_supplier" | "confirmed" | "rejected"
  confirmedDate?: string
  rejectedDate?: string
  adminNotes?: string
  rejectionReason?: string
  createdAt: string
}

interface ExportData {
  transactions: SupplierTransaction[]
  confirmations: SupplierDocumentConfirmation[]
  items: Item[]
  paidItems: Item[]
  unpaidItems: Item[]
  confirmedItems: Item[]
  unconfirmedItems: Item[]
  totals: {
    totalItems: number
    paidItems: number
    unpaidItems: number
    confirmedItems: number
    unconfirmedItems: number
    partiallyPaidItems: number
    totalValue: number
    paidValue: number
    unpaidValue: number
    priceDifference: number
  }
  filters: {
    search?: string
    supplierFilter?: string
    paymentStatus?: string
    confirmationStatus?: string
    startDate?: string
    endDate?: string
  }
}

export async function exportEnhancedSupplierAccountingToExcel(data: ExportData) {
  try {
    const {
      transactions = [],
      confirmations = [],
      items = [],
      paidItems = [],
      unpaidItems = [],
      confirmedItems = [],
      unconfirmedItems = [],
      totals,
      filters,
    } = data

    // Create workbook
    const wb = XLSX.utils.book_new()

    // 1. Enhanced Summary Sheet
    const summaryData = [
      ["Ta'minotchi hisobi va tasdiqlash xulosasi", ""],
      ["", ""],
      ["Umumiy ko'rsatkichlar", ""],
      ["Jami mahsulotlar", totals.totalItems || 0],
      ["To'langan mahsulotlar", totals.paidItems || 0],
      ["To'lanmagan mahsulotlar", totals.unpaidItems || 0],
      ["Tasdiqlangan mahsulotlar", totals.confirmedItems || 0],
      ["Tasdiqlanmagan mahsulotlar", totals.unconfirmedItems || 0],
      ["Qisman to'langan mahsulotlar", totals.partiallyPaidItems || 0],
      ["", ""],
      ["Moliyaviy ko'rsatkichlar", ""],
      ["Jami qiymat", formatCurrency(totals.totalValue || 0)],
      ["To'langan qiymat", formatCurrency(totals.paidValue || 0)],
      ["To'lanmagan qiymat", formatCurrency(totals.unpaidValue || 0)],
      ["Narx farqi", formatCurrency(totals.priceDifference || 0)],
      ["", ""],
      ["Tasdiqlash holati", ""],
      [
        "Tasdiqlangan mahsulotlar foizi",
        totals.totalItems > 0 ? `${(((totals.confirmedItems || 0) / totals.totalItems) * 100).toFixed(1)}%` : "0%",
      ],
      ["To'lov holati", ""],
      [
        "To'langan mahsulotlar foizi",
        totals.totalItems > 0 ? `${(((totals.paidItems || 0) / totals.totalItems) * 100).toFixed(1)}%` : "0%",
      ],
      ["", ""],
      ["Filtrlar", ""],
      ["Qidiruv", filters.search || "Yo'q"],
      ["Ta'minotchi", filters.supplierFilter || "Barchasi"],
      ["To'lov holati", filters.paymentStatus || "Barchasi"],
      ["Tasdiqlash holati", filters.confirmationStatus || "Barchasi"],
      ["Boshlanish sanasi", filters.startDate || "Belgilanmagan"],
      ["Tugash sanasi", filters.endDate || "Belgilanmagan"],
      ["", ""],
      ["Eksport sanasi", format(new Date(), "dd/MM/yyyy HH:mm")],
    ]

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
    summaryWs["!cols"] = [{ wch: 30 }, { wch: 25 }]
    XLSX.utils.book_append_sheet(wb, summaryWs, "Xulosa")

    // 2. All Items Sheet with Enhanced Fields
    if (items.length > 0) {
      const itemsData = items.map((item, index) => ({
        "№": index + 1,
        Model: item.model || "—",
        Kategoriya: item.category || "—",
        "Ta'minotchi": item.supplierName || "—",
        "Og'irlik (g)": item.weight || 0,
        "Lom narxi (so'm/g)": item.lomNarxi || 0,
        "To'langan narx (so'm/g)": item.payedLomNarxi || "—",
        "Jami qiymat (so'm)": (item.weight || 0) * (item.lomNarxi || 0),
        "To'langan qiymat (so'm)": item.payedLomNarxi ? (item.weight || 0) * item.payedLomNarxi : "—",
        "Narx farqi (so'm)": item.priceDifference ? item.priceDifference * (item.weight || 0) : 0,
        "To'lov holati": getPaymentStatusText(item.paymentStatus),
        Tasdiqlangan: item.confirmed ? "Ha" : "Yo'q",
        "Tasdiqlash sanasi": item.confirmedDate ? format(new Date(item.confirmedDate), "dd/MM/yyyy") : "—",
        "Sotib olingan sana": item.purchaseDate
          ? format(new Date(item.purchaseDate), "dd/MM/yyyy")
          : item.createdAt
            ? format(new Date(item.createdAt), "dd/MM/yyyy")
            : "—",
        "To'lov sanasi": item.paymentDate ? format(new Date(item.paymentDate), "dd/MM/yyyy") : "—",
        "Tasdiqlash izohi": item.supplierConfirmationNotes || "—",
        "Yaratilgan sana": item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm") : "—",
      }))

      const itemsWs = XLSX.utils.json_to_sheet(itemsData)
      itemsWs["!cols"] = [
        { wch: 5 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
      ]
      XLSX.utils.book_append_sheet(wb, itemsWs, "Barcha mahsulotlar")
    }

    // 3. Confirmed Items Sheet
    if (confirmedItems.length > 0) {
      const confirmedData = confirmedItems.map((item, index) => ({
        "№": index + 1,
        Model: item.model || "—",
        Kategoriya: item.category || "—",
        "Ta'minotchi": item.supplierName || "—",
        "Og'irlik (g)": item.weight || 0,
        "Lom narxi (so'm/g)": item.lomNarxi || 0,
        "To'langan narx (so'm/g)": item.payedLomNarxi || item.lomNarxi || 0,
        "Jami qiymat (so'm)": (item.weight || 0) * (item.lomNarxi || 0),
        "Tasdiqlash sanasi": item.confirmedDate ? format(new Date(item.confirmedDate), "dd/MM/yyyy") : "—",
        "Tasdiqlash hujjati": item.confirmationId || "—",
        "Ta'minotchi izohi": item.supplierConfirmationNotes || "—",
        "To'lov holati": getPaymentStatusText(item.paymentStatus),
      }))

      const confirmedWs = XLSX.utils.json_to_sheet(confirmedData)
      confirmedWs["!cols"] = [
        { wch: 5 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
      ]
      XLSX.utils.book_append_sheet(wb, confirmedWs, "Tasdiqlangan mahsulotlar")
    }

    // 4. Unconfirmed Items Sheet
    if (unconfirmedItems.length > 0) {
      const unconfirmedData = unconfirmedItems.map((item, index) => ({
        "№": index + 1,
        Model: item.model || "—",
        Kategoriya: item.category || "—",
        "Ta'minotchi": item.supplierName || "—",
        "Og'irlik (g)": item.weight || 0,
        "Lom narxi (so'm/g)": item.lomNarxi || 0,
        "Jami qiymat (so'm)": (item.weight || 0) * (item.lomNarxi || 0),
        "Sotib olingan sana": item.purchaseDate
          ? format(new Date(item.purchaseDate), "dd/MM/yyyy")
          : item.createdAt
            ? format(new Date(item.createdAt), "dd/MM/yyyy")
            : "—",
        "Kutish muddati (kun)": item.purchaseDate
          ? Math.floor((new Date().getTime() - new Date(item.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
          : item.createdAt
            ? Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
        "To'lov holati": getPaymentStatusText(item.paymentStatus),
        Izohlar: item.notes || "—",
      }))

      const unconfirmedWs = XLSX.utils.json_to_sheet(unconfirmedData)
      unconfirmedWs["!cols"] = [
        { wch: 5 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 20 },
      ]
      XLSX.utils.book_append_sheet(wb, unconfirmedWs, "Tasdiqlanmagan mahsulotlar")
    }

    // 5. Enhanced Transactions Sheet
    if (transactions.length > 0) {
      const transactionsData = transactions.map((transaction, index) => ({
        "№": index + 1,
        Turi: getTransactionTypeText(transaction.type),
        "Ta'minotchi": transaction.supplierName || "—",
        "Jami miqdor (so'm)": transaction.totalAmount || 0,
        "To'langan narx (so'm/g)": transaction.payedLomNarxi || 0,
        "Asl narx (so'm/g)": transaction.originalLomNarxi || "—",
        "Narx farqi (so'm/g)": transaction.priceDifference || 0,
        "Tranzaksiya sanasi": transaction.transactionDate
          ? format(new Date(transaction.transactionDate), "dd/MM/yyyy")
          : "—",
        "To'lov sanasi": transaction.paymentDate ? format(new Date(transaction.paymentDate), "dd/MM/yyyy") : "—",
        "Ma'lumotnoma": transaction.reference || "—",
        "Qo'shimcha hujjatlar": transaction.attachments ? `${transaction.attachments.length} ta fayl` : "Yo'q",
        Izohlar: transaction.notes || "—",
      }))

      const transactionsWs = XLSX.utils.json_to_sheet(transactionsData)
      transactionsWs["!cols"] = [
        { wch: 5 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 20 },
      ]
      XLSX.utils.book_append_sheet(wb, transactionsWs, "Tranzaksiyalar")
    }

    // 6. Document Confirmations Sheet
    if (confirmations.length > 0) {
      const confirmationsData = confirmations.map((confirmation, index) => ({
        "№": index + 1,
        "Hujjat raqami": confirmation.documentNumber || "—",
        "Ta'minotchi": confirmation.supplierName || "—",
        "Mahsulotlar soni": confirmation.itemIds ? confirmation.itemIds.length : 0,
        Holat: getConfirmationStatusText(confirmation.status),
        "Yaratilgan sana": confirmation.createdAt ? format(new Date(confirmation.createdAt), "dd/MM/yyyy") : "—",
        "Tasdiqlash sanasi": confirmation.confirmedDate
          ? format(new Date(confirmation.confirmedDate), "dd/MM/yyyy")
          : "—",
        "Rad etilgan sana": confirmation.rejectedDate ? format(new Date(confirmation.rejectedDate), "dd/MM/yyyy") : "—",
        "Admin izohi": confirmation.adminNotes || "—",
        "Rad etish sababi": confirmation.rejectionReason || "—",
      }))

      const confirmationsWs = XLSX.utils.json_to_sheet(confirmationsData)
      confirmationsWs["!cols"] = [
        { wch: 5 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 25 },
        { wch: 25 },
      ]
      XLSX.utils.book_append_sheet(wb, confirmationsWs, "Tasdiqlash hujjatlari")
    }

    // 7. Enhanced Supplier Analysis Sheet
    const supplierAnalysis = items.reduce(
      (acc, item) => {
        const supplier = item.supplierName || "Noma'lum"
        if (!acc[supplier]) {
          acc[supplier] = {
            totalItems: 0,
            confirmedItems: 0,
            unconfirmedItems: 0,
            paidItems: 0,
            unpaidItems: 0,
            totalValue: 0,
            paidValue: 0,
            unpaidValue: 0,
            priceDifference: 0,
          }
        }

        acc[supplier].totalItems++
        acc[supplier].totalValue += (item.weight || 0) * (item.lomNarxi || 0)

        if (item.confirmed) {
          acc[supplier].confirmedItems++
        } else {
          acc[supplier].unconfirmedItems++
        }

        if (item.paymentStatus === "paid") {
          acc[supplier].paidItems++
          acc[supplier].paidValue += (item.weight || 0) * (item.payedLomNarxi || item.lomNarxi || 0)
          acc[supplier].priceDifference += (item.priceDifference || 0) * (item.weight || 0)
        } else if (item.paymentStatus === "unpaid") {
          acc[supplier].unpaidItems++
          acc[supplier].unpaidValue += (item.weight || 0) * (item.lomNarxi || 0)
        }

        return acc
      },
      {} as Record<string, any>,
    )

    if (Object.keys(supplierAnalysis).length > 0) {
      const supplierData = Object.entries(supplierAnalysis).map(([supplier, data], index) => ({
        "№": index + 1,
        "Ta'minotchi": supplier,
        "Jami mahsulotlar": data.totalItems,
        "Tasdiqlangan mahsulotlar": data.confirmedItems,
        "Tasdiqlanmagan mahsulotlar": data.unconfirmedItems,
        "To'langan mahsulotlar": data.paidItems,
        "To'lanmagan mahsulotlar": data.unpaidItems,
        "Jami qiymat (so'm)": data.totalValue,
        "To'langan qiymat (so'm)": data.paidValue,
        "To'lanmagan qiymat (so'm)": data.unpaidValue,
        "Narx farqi (so'm)": data.priceDifference,
        "Tasdiqlash foizi (%)": data.totalItems > 0 ? ((data.confirmedItems / data.totalItems) * 100).toFixed(1) : "0",
        "To'lov foizi (%)": data.totalItems > 0 ? ((data.paidItems / data.totalItems) * 100).toFixed(1) : "0",
      }))

      const supplierWs = XLSX.utils.json_to_sheet(supplierData)
      supplierWs["!cols"] = [
        { wch: 5 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
      ]
      XLSX.utils.book_append_sheet(wb, supplierWs, "Ta'minotchi tahlili")
    }

    // Generate filename with timestamp
    const filename = `taminotchi-hisobi-takomillashtirilgan-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`

    // Write file
    XLSX.writeFile(wb, filename)

    return filename
  } catch (error) {
    console.error("Excel export error:", error)
    throw new Error("Excel faylni yaratishda xatolik yuz berdi")
  }
}

function getPaymentStatusText(status?: string) {
  switch (status) {
    case "paid":
      return "To'langan"
    case "partially_paid":
      return "Qisman to'langan"
    case "unpaid":
      return "To'lanmagan"
    default:
      return "Noma'lum"
  }
}

function getTransactionTypeText(type: string) {
  switch (type) {
    case "payment":
      return "To'lov"
    case "purchase":
      return "Sotib olish"
    case "adjustment":
      return "Tuzatish"
    default:
      return type || "Noma'lum"
  }
}

function getConfirmationStatusText(status: string) {
  switch (status) {
    case "draft":
      return "Qoralama"
    case "pdf_generated":
      return "PDF yaratilgan"
    case "sent_to_supplier":
      return "Ta'minotchiga yuborilgan"
    case "confirmed":
      return "Tasdiqlangan"
    case "rejected":
      return "Rad etilgan"
    default:
      return status || "Noma'lum"
  }
}

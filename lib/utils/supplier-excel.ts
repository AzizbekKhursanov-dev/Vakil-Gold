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
  createdAt: string
  updatedAt: string
}

interface ExportData {
  transactions: SupplierTransaction[]
  items: Item[]
  paidItems: Item[]
  unpaidItems: Item[]
  totals: {
    totalItems: number
    paidItems: number
    unpaidItems: number
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
    startDate?: string
    endDate?: string
  }
}

export async function exportSupplierAccountingToExcel(data: ExportData) {
  const { transactions, items, paidItems, unpaidItems, totals, filters } = data

  // Create workbook
  const wb = XLSX.utils.book_new()

  // 1. Summary Sheet
  const summaryData = [
    ["Ta'minotchi hisobi xulosasi", ""],
    ["", ""],
    ["Umumiy ko'rsatkichlar", ""],
    ["Jami mahsulotlar", totals.totalItems],
    ["To'langan mahsulotlar", totals.paidItems],
    ["To'lanmagan mahsulotlar", totals.unpaidItems],
    ["Qisman to'langan mahsulotlar", totals.partiallyPaidItems],
    ["Jami qiymat", formatCurrency(totals.totalValue)],
    ["To'langan qiymat", formatCurrency(totals.paidValue)],
    ["To'lanmagan qiymat", formatCurrency(totals.unpaidValue)],
    ["Narx farqi", formatCurrency(totals.priceDifference)],
    ["", ""],
    ["Filtrlar", ""],
    ["Qidiruv", filters.search || "Yo'q"],
    ["Ta'minotchi", filters.supplierFilter || "Barchasi"],
    ["To'lov holati", filters.paymentStatus || "Barchasi"],
    ["Boshlanish sanasi", filters.startDate || "Belgilanmagan"],
    ["Tugash sanasi", filters.endDate || "Belgilanmagan"],
    ["", ""],
    ["Eksport sanasi", format(new Date(), "dd/MM/yyyy HH:mm")],
  ]

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
  summaryWs["!cols"] = [{ wch: 25 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, summaryWs, "Xulosa")

  // 2. All Items Sheet
  const itemsData = items.map((item, index) => ({
    "№": index + 1,
    Model: item.model,
    Kategoriya: item.category,
    "Ta'minotchi": item.supplierName || "—",
    "Og'irlik (g)": item.weight,
    "Lom narxi (so'm/g)": item.lomNarxi,
    "To'langan narx (so'm/g)": item.payedLomNarxi || "—",
    "Jami qiymat (so'm)": item.weight * item.lomNarxi,
    "To'langan qiymat (so'm)": item.payedLomNarxi ? item.weight * item.payedLomNarxi : "—",
    "Narx farqi (so'm)": item.priceDifference ? item.priceDifference * item.weight : 0,
    "To'lov holati": getPaymentStatusText(item.paymentStatus),
    "Sotib olingan sana": item.purchaseDate ? format(new Date(item.purchaseDate), "dd/MM/yyyy") : "—",
    "To'lov sanasi": item.paymentDate ? format(new Date(item.paymentDate), "dd/MM/yyyy") : "—",
    "Yaratilgan sana": format(new Date(item.createdAt), "dd/MM/yyyy HH:mm"),
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
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
  ]
  XLSX.utils.book_append_sheet(wb, itemsWs, "Barcha mahsulotlar")

  // 3. Unpaid Items Sheet
  const unpaidData = unpaidItems.map((item, index) => ({
    "№": index + 1,
    Model: item.model,
    Kategoriya: item.category,
    "Ta'minotchi": item.supplierName || "—",
    "Og'irlik (g)": item.weight,
    "Lom narxi (so'm/g)": item.lomNarxi,
    "Jami qiymat (so'm)": item.weight * item.lomNarxi,
    "Sotib olingan sana": item.purchaseDate ? format(new Date(item.purchaseDate), "dd/MM/yyyy") : "—",
    "Kechikish (kun)": item.purchaseDate
      ? Math.floor((new Date().getTime() - new Date(item.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
  }))

  const unpaidWs = XLSX.utils.json_to_sheet(unpaidData)
  unpaidWs["!cols"] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, unpaidWs, "To'lanmagan mahsulotlar")

  // 4. Paid Items Sheet
  const paidData = paidItems.map((item, index) => ({
    "№": index + 1,
    Model: item.model,
    Kategoriya: item.category,
    "Ta'minotchi": item.supplierName || "—",
    "Og'irlik (g)": item.weight,
    "Lom narxi (so'm/g)": item.lomNarxi,
    "To'langan narx (so'm/g)": item.payedLomNarxi || item.lomNarxi,
    "Narx farqi (so'm/g)": (item.payedLomNarxi || item.lomNarxi) - item.lomNarxi,
    "Jami narx farqi (so'm)": ((item.payedLomNarxi || item.lomNarxi) - item.lomNarxi) * item.weight,
    "To'lov sanasi": item.paymentDate ? format(new Date(item.paymentDate), "dd/MM/yyyy") : "—",
    "Ma'lumotnoma": item.paymentReference || "—",
  }))

  const paidWs = XLSX.utils.json_to_sheet(paidData)
  paidWs["!cols"] = [
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
  ]
  XLSX.utils.book_append_sheet(wb, paidWs, "To'langan mahsulotlar")

  // 5. Transactions Sheet
  const transactionsData = transactions.map((transaction, index) => ({
    "№": index + 1,
    Turi: getTransactionTypeText(transaction.type),
    "Ta'minotchi": transaction.supplierName,
    "Jami miqdor (so'm)": transaction.totalAmount,
    "To'langan narx (so'm/g)": transaction.payedLomNarxi,
    "Asl narx (so'm/g)": transaction.originalLomNarxi || "—",
    "Narx farqi (so'm/g)": transaction.priceDifference || 0,
    "Tranzaksiya sanasi": format(new Date(transaction.transactionDate), "dd/MM/yyyy"),
    "To'lov sanasi": transaction.paymentDate ? format(new Date(transaction.paymentDate), "dd/MM/yyyy") : "—",
    "Ma'lumotnoma": transaction.reference || "—",
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
    { wch: 20 },
  ]
  XLSX.utils.book_append_sheet(wb, transactionsWs, "Tranzaksiyalar")

  // 6. Supplier Analysis Sheet
  const supplierAnalysis = items.reduce(
    (acc, item) => {
      const supplier = item.supplierName || "Noma'lum"
      if (!acc[supplier]) {
        acc[supplier] = {
          totalItems: 0,
          paidItems: 0,
          unpaidItems: 0,
          totalValue: 0,
          paidValue: 0,
          unpaidValue: 0,
          priceDifference: 0,
        }
      }

      acc[supplier].totalItems++
      acc[supplier].totalValue += item.weight * item.lomNarxi

      if (item.paymentStatus === "paid") {
        acc[supplier].paidItems++
        acc[supplier].paidValue += item.weight * (item.payedLomNarxi || item.lomNarxi)
        acc[supplier].priceDifference += (item.priceDifference || 0) * item.weight
      } else if (item.paymentStatus === "unpaid") {
        acc[supplier].unpaidItems++
        acc[supplier].unpaidValue += item.weight * item.lomNarxi
      }

      return acc
    },
    {} as Record<string, any>,
  )

  const supplierData = Object.entries(supplierAnalysis).map(([supplier, data], index) => ({
    "№": index + 1,
    "Ta'minotchi": supplier,
    "Jami mahsulotlar": data.totalItems,
    "To'langan mahsulotlar": data.paidItems,
    "To'lanmagan mahsulotlar": data.unpaidItems,
    "Jami qiymat (so'm)": data.totalValue,
    "To'langan qiymat (so'm)": data.paidValue,
    "To'lanmagan qiymat (so'm)": data.unpaidValue,
    "Narx farqi (so'm)": data.priceDifference,
    "To'lov foizi (%)": data.totalItems > 0 ? ((data.paidItems / data.totalItems) * 100).toFixed(1) : "0",
  }))

  const supplierWs = XLSX.utils.json_to_sheet(supplierData)
  supplierWs["!cols"] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, supplierWs, "Ta'minotchi tahlili")

  // 7. Returned to Supplier Items
  const returnedToSupplierItems = items.filter((item) => item.status === "returned_to_supplier")
  if (returnedToSupplierItems.length > 0) {
    const returnedData = returnedToSupplierItems.map((item, index) => ({
      "№": index + 1,
      Model: item.model,
      Kategoriya: item.category,
      "Ta'minotchi": item.supplierName || "—",
      "Og'irlik (g)": item.weight,
      "Lom narxi (so'm/g)": item.lomNarxi,
      "Jami qiymat (so'm)": item.weight * item.lomNarxi,
      "Qaytarilgan sana": item.returnToSupplierDate ? format(new Date(item.returnToSupplierDate), "dd/MM/yyyy") : "—",
      "Qaytarish sababi": item.returnToSupplierReason || "—",
      "Ma'lumotnoma": item.returnToSupplierReference || "—",
    }))

    const returnedWs = XLSX.utils.json_to_sheet(returnedData)
    returnedWs["!cols"] = [
      { wch: 5 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
    ]
    XLSX.utils.book_append_sheet(wb, returnedWs, "Qaytarilgan mahsulotlar")
  }

  // Generate filename with timestamp
  const filename = `taminotchi-hisobi-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`

  // Write file
  XLSX.writeFile(wb, filename)

  return filename
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
      return type
  }
}

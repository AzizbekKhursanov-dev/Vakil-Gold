import * as XLSX from "xlsx"
import { formatCurrency } from "./currency"
import { format } from "date-fns"
import type { Item } from "@/lib/types/item"
import type { DateRange } from "react-day-picker"

interface ProfitData {
  supposedProfit: number
  actualProfit: number
  totalRevenue: number
  totalCost: number
  profitMargin: number
  itemCount: number
  averageProfit: number
  priceDifferenceImpact: number
}

interface ExportData {
  items: Item[]
  profitData: ProfitData
  filters: {
    timePeriod?: string
    dateRange?: DateRange
    branchFilter?: string
    categoryFilter?: string
    paymentStatusFilter?: string
  }
}

export async function exportProfitAnalysisToExcel(data: ExportData) {
  const { items, profitData, filters } = data

  // Create workbook
  const wb = XLSX.utils.book_new()

  // 1. Summary Sheet
  const summaryData = [
    ["Foyda tahlili xulosasi", ""],
    ["", ""],
    ["Umumiy ko'rsatkichlar", ""],
    ["Jami mahsulotlar", profitData.itemCount],
    ["Nazariy foyda", formatCurrency(profitData.supposedProfit)],
    ["Haqiqiy foyda", formatCurrency(profitData.actualProfit)],
    ["Jami daromad", formatCurrency(profitData.totalRevenue)],
    ["Jami xarajat", formatCurrency(profitData.totalCost)],
    ["Foyda marjasi (%)", profitData.profitMargin.toFixed(2)],
    ["O'rtacha foyda", formatCurrency(profitData.averageProfit)],
    ["Narx farqi ta'siri", formatCurrency(profitData.priceDifferenceImpact)],
    ["", ""],
    ["Filtrlar", ""],
    ["Vaqt oralig'i", filters.timePeriod || "Belgilanmagan"],
    ["Filial", filters.branchFilter || "Barchasi"],
    ["Kategoriya", filters.categoryFilter || "Barchasi"],
    ["To'lov holati", filters.paymentStatusFilter || "Barchasi"],
    ["", ""],
    ["Eksport sanasi", format(new Date(), "dd/MM/yyyy HH:mm")],
  ]

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
  summaryWs["!cols"] = [{ wch: 25 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, summaryWs, "Xulosa")

  // 2. Detailed Items Analysis
  const itemsWithProfit = items.map((item, index) => {
    const supposedProfitPerGram = item.lomNarxiKirim - item.lomNarxi
    const supposedProfit = supposedProfitPerGram * item.weight

    const actualCost = item.weight * (item.payedLomNarxi || item.lomNarxi) + item.laborCost * item.weight
    const actualRevenue = item.status === "sold" ? item.sellingPrice * item.weight : 0
    const actualProfit = actualRevenue - actualCost
    const profitMargin = actualRevenue > 0 ? (actualProfit / actualRevenue) * 100 : 0

    return {
      "№": index + 1,
      Model: item.model,
      Kategoriya: item.category,
      "Ta'minotchi": item.supplierName || "—",
      "Og'irlik (g)": item.weight,
      "Lom narxi (so'm/g)": item.lomNarxi,
      "Lom narxi kirim (so'm/g)": item.lomNarxiKirim,
      "To'langan narx (so'm/g)": item.payedLomNarxi || "—",
      "Ishchi haqi (so'm/g)": item.laborCost,
      "Sotuv narxi (so'm/g)": item.sellingPrice,
      "Nazariy foyda (so'm)": supposedProfit,
      "Haqiqiy foyda (so'm)": actualProfit,
      "Foyda marjasi (%)": profitMargin.toFixed(2),
      "Daromad (so'm)": actualRevenue,
      "Xarajat (so'm)": actualCost,
      "Mahsulot holati":
        item.status === "sold"
          ? "Sotilgan"
          : item.status === "available"
            ? "Mavjud"
            : item.status === "transferred"
              ? "O'tkazilgan"
              : item.status === "returned"
                ? "Qaytarilgan"
                : item.status,
      "To'lov holati":
        item.paymentStatus === "paid"
          ? "To'langan"
          : item.paymentStatus === "unpaid"
            ? "To'lanmagan"
            : "Qisman to'langan",
      "Sotib olingan sana": format(new Date(item.purchaseDate), "dd/MM/yyyy"),
      "To'lov sanasi": item.paymentDate ? format(new Date(item.paymentDate), "dd/MM/yyyy") : "—",
      "Sotilgan sana": item.soldDate ? format(new Date(item.soldDate), "dd/MM/yyyy") : "—",
      Filial: item.branch || "—",
      Izohlar: item.notes || "—",
    }
  })

  const itemsWs = XLSX.utils.json_to_sheet(itemsWithProfit)
  itemsWs["!cols"] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
  ]

  // Add conditional formatting for profit columns
  const range = XLSX.utils.decode_range(itemsWs["!ref"] || "A1")
  for (let row = 1; row <= range.e.r; row++) {
    const actualProfitCell = `L${row + 1}` // Haqiqiy foyda column
    const profitMarginCell = `M${row + 1}` // Foyda marjasi column

    if (itemsWs[actualProfitCell]) {
      const value = itemsWs[actualProfitCell].v
      if (typeof value === "number") {
        if (value > 0) {
          itemsWs[actualProfitCell].s = { fill: { fgColor: { rgb: "90EE90" } } } // Light green
        } else if (value < 0) {
          itemsWs[actualProfitCell].s = { fill: { fgColor: { rgb: "FFB6C1" } } } // Light red
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, itemsWs, "Mahsulotlar tahlili")

  // 3. Profit by Category
  const categoryAnalysis = items.reduce(
    (acc, item) => {
      const category = item.category
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          totalWeight: 0,
          supposedProfit: 0,
          actualProfit: 0,
          totalRevenue: 0,
          totalCost: 0,
        }
      }

      const supposedProfitPerGram = item.lomNarxiKirim - item.lomNarxi
      const supposedProfit = supposedProfitPerGram * item.weight
      const actualCost = item.weight * (item.payedLomNarxi || item.lomNarxi) + item.laborCost * item.weight
      const actualRevenue = item.status === "sold" ? item.sellingPrice * item.weight : 0
      const actualProfit = actualRevenue - actualCost

      acc[category].count++
      acc[category].totalWeight += item.weight
      acc[category].supposedProfit += supposedProfit
      acc[category].actualProfit += actualProfit
      acc[category].totalRevenue += actualRevenue
      acc[category].totalCost += actualCost

      return acc
    },
    {} as Record<string, any>,
  )

  const categoryData = Object.entries(categoryAnalysis).map(([category, data], index) => ({
    "№": index + 1,
    Kategoriya: category,
    "Mahsulotlar soni": data.count,
    "Jami og'irlik (g)": data.totalWeight.toFixed(2),
    "Nazariy foyda (so'm)": data.supposedProfit,
    "Haqiqiy foyda (so'm)": data.actualProfit,
    "Jami daromad (so'm)": data.totalRevenue,
    "Jami xarajat (so'm)": data.totalCost,
    "Foyda marjasi (%)": data.totalRevenue > 0 ? ((data.actualProfit / data.totalRevenue) * 100).toFixed(2) : "0",
    "O'rtacha foyda (so'm)": data.count > 0 ? (data.actualProfit / data.count).toFixed(0) : "0",
  }))

  const categoryWs = XLSX.utils.json_to_sheet(categoryData)
  categoryWs["!cols"] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(wb, categoryWs, "Kategoriya tahlili")

  // 4. Profit by Branch
  const branchAnalysis = items.reduce(
    (acc, item) => {
      const branch = item.branch || "Markaz"
      if (!acc[branch]) {
        acc[branch] = {
          count: 0,
          totalWeight: 0,
          supposedProfit: 0,
          actualProfit: 0,
          totalRevenue: 0,
          totalCost: 0,
        }
      }

      const supposedProfitPerGram = item.lomNarxiKirim - item.lomNarxi
      const supposedProfit = supposedProfitPerGram * item.weight
      const actualCost = item.weight * (item.payedLomNarxi || item.lomNarxi) + item.laborCost * item.weight
      const actualRevenue = item.status === "sold" ? item.sellingPrice * item.weight : 0
      const actualProfit = actualRevenue - actualCost

      acc[branch].count++
      acc[branch].totalWeight += item.weight
      acc[branch].supposedProfit += supposedProfit
      acc[branch].actualProfit += actualProfit
      acc[branch].totalRevenue += actualRevenue
      acc[branch].totalCost += actualCost

      return acc
    },
    {} as Record<string, any>,
  )

  const branchData = Object.entries(branchAnalysis).map(([branch, data], index) => ({
    "№": index + 1,
    Filial: branch,
    "Mahsulotlar soni": data.count,
    "Jami og'irlik (g)": data.totalWeight.toFixed(2),
    "Nazariy foyda (so'm)": data.supposedProfit,
    "Haqiqiy foyda (so'm)": data.actualProfit,
    "Jami daromad (so'm)": data.totalRevenue,
    "Jami xarajat (so'm)": data.totalCost,
    "Foyda marjasi (%)": data.totalRevenue > 0 ? ((data.actualProfit / data.totalRevenue) * 100).toFixed(2) : "0",
    "Samaradorlik (%)": data.supposedProfit > 0 ? ((data.actualProfit / data.supposedProfit) * 100).toFixed(2) : "0",
  }))

  const branchWs = XLSX.utils.json_to_sheet(branchData)
  branchWs["!cols"] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ]
  XLSX.utils.book_append_sheet(wb, branchWs, "Filial tahlili")

  // 5. Monthly Profit Trends
  const monthlyData = items.reduce(
    (acc, item) => {
      const date = item.paymentDate || item.purchaseDate
      const month = format(new Date(date), "yyyy-MM")

      if (!acc[month]) {
        acc[month] = {
          count: 0,
          supposedProfit: 0,
          actualProfit: 0,
          totalRevenue: 0,
          soldItems: 0,
        }
      }

      const supposedProfitPerGram = item.lomNarxiKirim - item.lomNarxi
      const supposedProfit = supposedProfitPerGram * item.weight
      const actualCost = item.weight * (item.payedLomNarxi || item.lomNarxi) + item.laborCost * item.weight
      const actualRevenue = item.status === "sold" ? item.sellingPrice * item.weight : 0
      const actualProfit = actualRevenue - actualCost

      acc[month].count++
      acc[month].supposedProfit += supposedProfit
      acc[month].actualProfit += actualProfit
      acc[month].totalRevenue += actualRevenue
      if (item.status === "sold") acc[month].soldItems++

      return acc
    },
    {} as Record<string, any>,
  )

  const monthlyDataArray = Object.entries(monthlyData)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, data], index) => ({
      "№": index + 1,
      Oy: month,
      "Jami mahsulotlar": data.count,
      "Sotilgan mahsulotlar": data.soldItems,
      "Nazariy foyda (so'm)": data.supposedProfit,
      "Haqiqiy foyda (so'm)": data.actualProfit,
      "Jami daromad (so'm)": data.totalRevenue,
      "Foyda marjasi (%)": data.totalRevenue > 0 ? ((data.actualProfit / data.totalRevenue) * 100).toFixed(2) : "0",
      "Samaradorlik (%)": data.supposedProfit > 0 ? ((data.actualProfit / data.supposedProfit) * 100).toFixed(2) : "0",
    }))

  const monthlyWs = XLSX.utils.json_to_sheet(monthlyDataArray)
  monthlyWs["!cols"] = [
    { wch: 5 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ]
  XLSX.utils.book_append_sheet(wb, monthlyWs, "Oylik tendensiya")

  // 6. Top Performing Items
  const topItems = itemsWithProfit
    .filter((item) => item["Haqiqiy foyda (so'm)"] > 0)
    .sort((a, b) => b["Haqiqiy foyda (so'm)"] - a["Haqiqiy foyda (so'm)"])
    .slice(0, 50)
    .map((item, index) => ({
      "№": index + 1,
      Model: item.Model,
      Kategoriya: item.Kategoriya,
      "Haqiqiy foyda (so'm)": item["Haqiqiy foyda (so'm)"],
      "Foyda marjasi (%)": item["Foyda marjasi (%)"],
      "Sotilgan sana": item["Sotilgan sana"],
      Filial: item.Filial,
    }))

  const topItemsWs = XLSX.utils.json_to_sheet(topItems)
  topItemsWs["!cols"] = [{ wch: 5 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, topItemsWs, "Eng foydali mahsulotlar")

  // 7. Loss Analysis
  const lossItems = itemsWithProfit
    .filter((item) => item["Haqiqiy foyda (so'm)"] < 0)
    .sort((a, b) => a["Haqiqiy foyda (so'm)"] - b["Haqiqiy foyda (so'm)"])
    .map((item, index) => ({
      "№": index + 1,
      Model: item.Model,
      Kategoriya: item.Kategoriya,
      "Zarar (so'm)": Math.abs(item["Haqiqiy foyda (so'm)"]),
      "Zarar sababi":
        item["Mahsulot holati"] === "returned"
          ? "Qaytarilgan"
          : item["To'lov holati"] === "unpaid"
            ? "To'lanmagan"
            : "Boshqa",
      "Sotib olingan sana": item["Sotib olingan sana"],
      Filial: item.Filial,
    }))

  if (lossItems.length > 0) {
    const lossWs = XLSX.utils.json_to_sheet(lossItems)
    lossWs["!cols"] = [{ wch: 5 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, lossWs, "Zarar tahlili")
  }

  // Generate filename with timestamp
  const filename = `foyda-tahlili-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`

  // Write file
  XLSX.writeFile(wb, filename)

  return filename
}

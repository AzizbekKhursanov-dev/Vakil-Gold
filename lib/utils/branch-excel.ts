import * as XLSX from "xlsx"
import type { Branch } from "@/lib/types/branch"
import { formatCurrency } from "./currency"
import { format } from "date-fns"

interface EnhancedBranch extends Branch {
  itemCount?: number
  availableItemsCount?: number
  soldItemsCount?: number
  reservedItemsCount?: number
  totalValue?: number
  soldValue?: number
  totalWeight?: number
  monthlyRevenue?: number
  totalProfit?: number
  profitMargin?: number
  transactionCount?: number
  averageItemValue?: number
  topCategory?: string
  categoryCount?: number
}

export async function exportBranchesToExcel(branches: EnhancedBranch[], filename: string) {
  try {
    // Prepare main branch data
    const branchData = branches.map((branch, index) => ({
      "№": index + 1,
      "Filial nomi": branch.name,
      Joylashuv: branch.location,
      Boshqaruvchi: branch.manager,
      Turi: branch.isProvider ? "Ta'minotchi" : "Filial",
      Status: branch.status === "active" ? "Faol" : "Nofaol",
      Telefon: branch.phone || "N/A",
      Email: branch.email || "N/A",
      Manzil: branch.address || "N/A",
    }))

    // Prepare inventory statistics
    const inventoryData = branches.map((branch, index) => ({
      "№": index + 1,
      "Filial nomi": branch.name,
      "Jami mahsulotlar": branch.itemCount || 0,
      "Mavjud mahsulotlar": branch.availableItemsCount || 0,
      "Sotilgan mahsulotlar": branch.soldItemsCount || 0,
      "Rezerv mahsulotlar": branch.reservedItemsCount || 0,
      "Jami og'irlik (g)": (branch.totalWeight || 0).toFixed(2),
      "Kategoriyalar soni": branch.categoryCount || 0,
      "Eng ko'p sotilgan kategoriya": branch.topCategory || "N/A",
    }))

    // Prepare financial statistics
    const financialData = branches.map((branch, index) => ({
      "№": index + 1,
      "Filial nomi": branch.name,
      "Jami qiymat": formatCurrency(branch.totalValue || 0),
      "Sotilgan qiymat": formatCurrency(branch.soldValue || 0),
      "Oylik daromad": formatCurrency(branch.monthlyRevenue || 0),
      "Jami foyda": formatCurrency(branch.totalProfit || 0),
      "Foyda foizi": `${(branch.profitMargin || 0).toFixed(2)}%`,
      "O'rtacha mahsulot qiymati": formatCurrency(branch.averageItemValue || 0),
      "Tranzaksiyalar soni": branch.transactionCount || 0,
    }))

    // Prepare summary data
    const totalBranches = branches.length
    const activeBranches = branches.filter((b) => b.status === "active").length
    const totalItems = branches.reduce((sum, b) => sum + (b.itemCount || 0), 0)
    const totalValue = branches.reduce((sum, b) => sum + (b.totalValue || 0), 0)
    const totalRevenue = branches.reduce((sum, b) => sum + (b.monthlyRevenue || 0), 0)
    const totalProfit = branches.reduce((sum, b) => sum + (b.totalProfit || 0), 0)

    const summaryData = [
      { "Ko'rsatkich": "Jami filiallar", Qiymat: totalBranches },
      { "Ko'rsatkich": "Faol filiallar", Qiymat: activeBranches },
      { "Ko'rsatkich": "Jami mahsulotlar", Qiymat: totalItems },
      { "Ko'rsatkich": "Jami qiymat", Qiymat: formatCurrency(totalValue) },
      { "Ko'rsatkich": "Oylik daromad", Qiymat: formatCurrency(totalRevenue) },
      { "Ko'rsatkich": "Jami foyda", Qiymat: formatCurrency(totalProfit) },
      {
        "Ko'rsatkich": "O'rtacha foyda foizi",
        Qiymat: `${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0}%`,
      },
      { "Ko'rsatkich": "Hisobot sanasi", Qiymat: format(new Date(), "dd/MM/yyyy HH:mm") },
    ]

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Add summary sheet
    const summaryWs = XLSX.utils.json_to_sheet(summaryData)
    summaryWs["!cols"] = [{ wch: 25 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, summaryWs, "Umumiy ma'lumot")

    // Add branch data sheet
    const branchWs = XLSX.utils.json_to_sheet(branchData)
    branchWs["!cols"] = [
      { wch: 5 }, // №
      { wch: 25 }, // Filial nomi
      { wch: 20 }, // Joylashuv
      { wch: 20 }, // Boshqaruvchi
      { wch: 15 }, // Turi
      { wch: 10 }, // Status
      { wch: 15 }, // Telefon
      { wch: 25 }, // Email
      { wch: 30 }, // Manzil
    ]
    XLSX.utils.book_append_sheet(wb, branchWs, "Filiallar ma'lumoti")

    // Add inventory sheet
    const inventoryWs = XLSX.utils.json_to_sheet(inventoryData)
    inventoryWs["!cols"] = [
      { wch: 5 }, // №
      { wch: 25 }, // Filial nomi
      { wch: 15 }, // Jami mahsulotlar
      { wch: 18 }, // Mavjud mahsulotlar
      { wch: 18 }, // Sotilgan mahsulotlar
      { wch: 18 }, // Rezerv mahsulotlar
      { wch: 18 }, // Jami og'irlik
      { wch: 18 }, // Kategoriyalar soni
      { wch: 25 }, // Eng ko'p sotilgan kategoriya
    ]
    XLSX.utils.book_append_sheet(wb, inventoryWs, "Inventar hisoboti")

    // Add financial sheet
    const financialWs = XLSX.utils.json_to_sheet(financialData)
    financialWs["!cols"] = [
      { wch: 5 }, // №
      { wch: 25 }, // Filial nomi
      { wch: 18 }, // Jami qiymat
      { wch: 18 }, // Sotilgan qiymat
      { wch: 18 }, // Oylik daromad
      { wch: 15 }, // Jami foyda
      { wch: 15 }, // Foyda foizi
      { wch: 22 }, // O'rtacha mahsulot qiymati
      { wch: 18 }, // Tranzaksiyalar soni
    ]
    XLSX.utils.book_append_sheet(wb, financialWs, "Moliyaviy hisobot")

    // Generate Excel file and download
    XLSX.writeFile(wb, filename)

    return true
  } catch (error) {
    console.error("Excel export error:", error)
    throw new Error("Excel eksport xatoligi")
  }
}

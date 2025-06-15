import * as XLSX from "xlsx"

export const exportItemsToExcel = async (items: any[], filename: string) => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new()

    // Prepare data for export
    const exportData = items.map((item, index) => ({
      "№": index + 1,
      ID: item.id,
      Model: item.model || "",
      Kategoriya: item.category || "",
      "Og'irlik (g)": item.weight || 0,
      Miqdor: item.quantity || 0,
      "Sotuv narxi": item.sellingPrice || 0,
      "Lom narxi (g)": item.lomNarxi || 0,
      "Lom narxi kirim (g)": item.lomNarxiKirim || 0,
      "Mehnat haqi (g)": item.laborCost || 0,
      "Foyda foizi": item.profitPercentage || 0,
      Holat: getStatusText(item.status),
      "To'lov holati": getPaymentStatusText(item.paymentStatus),
      Filial: item.isProvider ? "Markaz" : item.branchName || item.branch || "",
      "Ta'minotchi": item.supplierName || "",
      Rang: item.color || "",
      Tozalik: item.purity || "",
      "Tosh turi": item.stoneType || "",
      "Tosh og'irligi": item.stoneWeight || "",
      "Ishlab chiqaruvchi": item.manufacturer || "",
      Izohlar: item.notes || "",
      "Yaratilgan sana": formatExcelDate(item.createdAt),
      "Sotib olingan sana": formatExcelDate(item.purchaseDate),
      "Sotilgan sana": formatExcelDate(item.soldDate),
    }))

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    const colWidths = [
      { wch: 5 }, // №
      { wch: 15 }, // ID
      { wch: 20 }, // Model
      { wch: 15 }, // Kategoriya
      { wch: 12 }, // Og'irlik
      { wch: 8 }, // Miqdor
      { wch: 15 }, // Sotuv narxi
      { wch: 15 }, // Lom narxi (g)
      { wch: 15 }, // Lom narxi kirim (g)
      { wch: 15 }, // Mehnat haqi (g)
      { wch: 12 }, // Foyda foizi
      { wch: 15 }, // Holat
      { wch: 15 }, // To'lov holati
      { wch: 15 }, // Filial
      { wch: 20 }, // Ta'minotchi
      { wch: 12 }, // Rang
      { wch: 12 }, // Tozalik
      { wch: 15 }, // Tosh turi
      { wch: 15 }, // Tosh og'irligi
      { wch: 20 }, // Ishlab chiqaruvchi
      { wch: 30 }, // Izohlar
      { wch: 15 }, // Yaratilgan sana
      { wch: 15 }, // Sotib olingan sana
      { wch: 15 }, // Sotilgan sana
    ]
    worksheet["!cols"] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mahsulotlar")

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

    // Create blob and download
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error("Excel export error:", error)
    throw error
  }
}

// Helper functions
const getStatusText = (status: string) => {
  switch (status) {
    case "available":
      return "Mavjud"
    case "sold":
      return "Sotilgan"
    case "returned":
      return "Qaytarilgan"
    case "transferred":
      return "Ko'chirilgan"
    case "reserved":
      return "Zahirada"
    case "returned_to_supplier":
      return "Ta'minotchiga qaytarilgan"
    default:
      return status
  }
}

const getPaymentStatusText = (status?: string) => {
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

const formatExcelDate = (dateString?: string) => {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    return date.toLocaleDateString()
  } catch (error) {
    return ""
  }
}

// Branch export function
export const exportBranchesToExcel = async (branches: any[], filename: string) => {
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
      { "Ko'rsatkich": "Hisobot sanasi", Qiymat: new Date().toLocaleDateString() },
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

// Helper function for currency formatting in Excel
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("uz-UZ", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

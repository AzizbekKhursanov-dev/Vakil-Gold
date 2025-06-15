"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { itemService } from "@/lib/services/item.service"
import { branchService } from "@/lib/services/branch.service"
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  BarChart3,
  Search,
  RefreshCw,
  AlertTriangle,
  Info,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/utils/currency"
import { calculateSellingPrice } from "@/lib/calculations/pricing"
import * as XLSX from "xlsx"
import type { ItemFormData, BulkImportItem, BulkImportResult } from "@/lib/types/item"

interface BulkImportFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface ImportSummary {
  totalRows: number
  validRows: number
  invalidRows: number
  warningRows: number
  duplicateRows: number
  totalValue: number
  categories: Record<string, number>
  suppliers: Record<string, number>
  branches: Record<string, number>
}

interface Branch {
  id: string
  name: string
  location: string
  isProvider: boolean
}

const VALID_CATEGORIES = ["Uzuk", "Sirg'a", "Bilakuzuk", "Zanjir", "Boshqa"]
const VALID_PURITIES = ["14K", "18K", "21K", "22K", "24K"]
const VALID_PAYMENT_STATUSES = ["paid", "partially_paid", "unpaid"]
const VALID_COLORS = ["Sariq", "Oq", "Qizil", "Aralash"]

export function BulkImportForm({ onSuccess, onCancel }: BulkImportFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<BulkImportResult | null>(null)
  const [previewData, setPreviewData] = useState<BulkImportItem[]>([])
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [importStatus, setImportStatus] = useState<"idle" | "preview" | "uploading" | "success" | "error">("idle")
  const [showAllRows, setShowAllRows] = useState(false)
  const [activeTab, setActiveTab] = useState("preview")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [importNotes, setImportNotes] = useState("")
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchNameToIdMap, setBranchNameToIdMap] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Fetch branches for mapping
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchList = await branchService.getBranches()
        setBranches(branchList)

        // Create a mapping of branch names to IDs
        const nameToIdMap: Record<string, string> = {}
        branchList.forEach((branch) => {
          nameToIdMap[branch.name.toLowerCase()] = branch.id
          // Add common variations and translations
          if (branch.name.toLowerCase() === "markaz") {
            nameToIdMap["markaz"] = branch.id
            nameToIdMap["марказ"] = branch.id
            nameToIdMap["center"] = branch.id
          }
        })
        setBranchNameToIdMap(nameToIdMap)
      } catch (error) {
        console.error("Error fetching branches:", error)
      }
    }

    fetchBranches()
  }, [])

  const updateProgress = (step: string, percentage: number) => {
    setProgress(percentage)
    console.log(`${step}: ${percentage}%`)
  }

  const downloadTemplate = useCallback(() => {
    try {
      // Get actual branch names from the system
      const branchNames = branches
        .filter((branch) => !branch.isProvider)
        .map((branch) => branch.name)
        .join(", ")

      const template = [
        {
          model: "D MJ 001",
          kategoriya: "Uzuk",
          ogirlik: 3.62,
          olcham: 18.5,
          miqdor: 1,
          lomNarxi: 800000,
          lomNarxiKirim: 850000,
          ishchiHaqi: 70000,
          foydaFoizi: 20,
          markaziyInventar: "FALSE",
          filial: branches.length > 0 ? branches.find((b) => !b.isProvider)?.name || "Narpay" : "Narpay",
          rang: "Sariq",
          tozalik: "18K",
          toshTuri: "Olmos",
          toshOgirligi: 0.5,
          ishlab_chiqaruvchi: "Vakil Gold",
          izoh: "Yangi model",
          xaridSanasi: "19/05/25", // DD/MM/YY format
          taminotchi: "ABC Ta'minotchi",
          tolovHolati: "unpaid",
        },
        {
          model: "D MJ 001", // Same model name is allowed
          kategoriya: "Uzuk",
          ogirlik: 4.2,
          olcham: 19,
          miqdor: 1,
          lomNarxi: 800000,
          lomNarxiKirim: 850000,
          ishchiHaqi: 70000,
          foydaFoizi: 20,
          markaziyInventar: "FALSE",
          filial: branches.length > 0 ? branches.find((b) => !b.isProvider)?.name || "Narpay" : "Narpay",
          rang: "Oq",
          tozalik: "18K",
          toshTuri: "Olmos",
          toshOgirligi: 0.3,
          ishlab_chiqaruvchi: "Vakil Gold",
          izoh: "Xuddi shu model, boshqa o'lcham",
          xaridSanasi: "2024-01-15", // YYYY-MM-DD format
          taminotchi: "ABC Ta'minotchi",
          tolovHolati: "unpaid",
        },
        {
          model: "S MJ 002",
          kategoriya: "Sirg'a",
          ogirlik: 2.15,
          olcham: "",
          miqdor: 2,
          lomNarxi: 800000,
          lomNarxiKirim: 850000,
          ishchiHaqi: 80000,
          foydaFoizi: 25,
          markaziyInventar: "TRUE",
          filial: "",
          rang: "Oq",
          tozalik: "21K",
          toshTuri: "Marvarid",
          toshOgirligi: 0.2,
          ishlab_chiqaruvchi: "Vakil Gold",
          izoh: "Juft sirg'a",
          xaridSanasi: "", // Empty - will use today's date
          taminotchi: "XYZ Ta'minotchi",
          tolovHolati: "paid",
        },
      ]

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(template)

      // Set column widths for better readability
      ws["!cols"] = [
        { wch: 15 }, // model
        { wch: 12 }, // kategoriya
        { wch: 10 }, // ogirlik
        { wch: 8 }, // olcham
        { wch: 8 }, // miqdor
        { wch: 12 }, // lomNarxi
        { wch: 15 }, // lomNarxiKirim
        { wch: 12 }, // ishchiHaqi
        { wch: 12 }, // foydaFoizi
        { wch: 15 }, // markaziyInventar
        { wch: 12 }, // filial
        { wch: 10 }, // rang
        { wch: 8 }, // tozalik
        { wch: 12 }, // toshTuri
        { wch: 12 }, // toshOgirligi
        { wch: 15 }, // ishlab_chiqaruvchi
        { wch: 20 }, // izoh
        { wch: 12 }, // xaridSanasi
        { wch: 15 }, // taminotchi
        { wch: 12 }, // tolovHolati
      ]

      XLSX.utils.book_append_sheet(wb, ws, "Mahsulotlar")

      // Add instructions sheet
      const instructions = [
        {
          Maydon: "model",
          Tavsif: "Mahsulot modeli (majburiy, bir xil model nomlari bo'lishi mumkin)",
          Misol: "D MJ 001",
        },
        { Maydon: "kategoriya", Tavsif: "Uzuk, Sirg'a, Bilakuzuk, Zanjir, Boshqa", Misol: "Uzuk" },
        { Maydon: "ogirlik", Tavsif: "Gramm hisobida (majburiy)", Misol: "3.62" },
        { Maydon: "olcham", Tavsif: "O'lcham (ixtiyoriy)", Misol: "18.5" },
        { Maydon: "miqdor", Tavsif: "Dona hisobida", Misol: "1" },
        { Maydon: "lomNarxi", Tavsif: "So'm/gram (majburiy)", Misol: "800000" },
        { Maydon: "lomNarxiKirim", Tavsif: "So'm/gram (majburiy)", Misol: "850000" },
        { Maydon: "ishchiHaqi", Tavsif: "So'm/gram (majburiy)", Misol: "70000" },
        { Maydon: "foydaFoizi", Tavsif: "Foiz hisobida", Misol: "20" },
        { Maydon: "markaziyInventar", Tavsif: "TRUE/FALSE - ombor inventari", Misol: "FALSE" },
        {
          Maydon: "filial",
          Tavsif: `Filial nomi (${branchNames || "Markaz, Narpay, Kitob, Andijon, Farg'ona, Namangan"})`,
          Misol: branches.length > 0 ? branches.find((b) => !b.isProvider)?.name || "Narpay" : "Narpay",
        },
        { Maydon: "rang", Tavsif: "Sariq, Oq, Qizil, Aralash", Misol: "Sariq" },
        { Maydon: "tozalik", Tavsif: "14K, 18K, 21K, 22K, 24K", Misol: "18K" },
        { Maydon: "toshTuri", Tavsif: "Tosh turi (ixtiyoriy)", Misol: "Olmos" },
        { Maydon: "toshOgirligi", Tavsif: "Tosh og'irligi gramm", Misol: "0.5" },
        { Maydon: "ishlab_chiqaruvchi", Tavsif: "Ishlab chiqaruvchi", Misol: "Vakil Gold" },
        { Maydon: "izoh", Tavsif: "Qo'shimcha izohlar", Misol: "Yangi model" },
        {
          Maydon: "xaridSanasi",
          Tavsif:
            "MM/DD/YY (05/19/25) yoki YYYY-MM-DD (2024-01-15) formatida. Bo'sh qoldirilsa bugungi sana ishlatiladi",
          Misol: "05/19/25",
        },
        { Maydon: "taminotchi", Tavsif: "Ta'minotchi nomi", Misol: "ABC Ta'minotchi" },
        { Maydon: "tolovHolati", Tavsif: "paid, partially_paid, unpaid", Misol: "unpaid" },
      ]

      const instructionsWs = XLSX.utils.json_to_sheet(instructions)
      instructionsWs["!cols"] = [{ wch: 20 }, { wch: 50 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, instructionsWs, "Yo'riqnoma")

      // Add validation rules sheet
      const validationRules = [
        { Qoida: "Majburiy maydonlar", Qiymat: "model, kategoriya, ogirlik, lomNarxi, lomNarxiKirim, ishchiHaqi" },
        { Qoida: "Kategoriyalar", Qiymat: "Uzuk, Sirg'a, Bilakuzuk, Zanjir, Boshqa" },
        { Qoida: "Tozalik", Qiymat: "14K, 18K, 21K, 22K, 24K" },
        { Qoida: "Ranglar", Qiymat: "Sariq, Oq, Qizil, Aralash" },
        { Qoida: "To'lov holati", Qiymat: "paid, partially_paid, unpaid" },
        { Qoida: "Markaziy inventar", Qiymat: "TRUE yoki FALSE" },
        { Qoida: "Filiallar", Qiymat: branchNames || "Markaz, Narpay, Kitob, Andijon, Farg'ona, Namangan" },
        {
          Qoida: "Sana formati",
          Qiymat: "MM/DD/YY (05/19/25) yoki YYYY-MM-DD (2024-01-15). Bo'sh qoldirilsa bugungi sana",
        },
        { Qoida: "Raqamli maydonlar", Qiymat: "ogirlik, lomNarxi, lomNarxiKirim, ishchiHaqi - musbat raqamlar" },
      ]

      const validationWs = XLSX.utils.json_to_sheet(validationRules)
      validationWs["!cols"] = [{ wch: 25 }, { wch: 50 }]
      XLSX.utils.book_append_sheet(wb, validationWs, "Tekshirish qoidalari")

      // Use browser-compatible file download
      const filename = "mahsulot-import-shablon.xlsx"
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Shablon yuklandi",
        description: "Excel shablon fayli muvaffaqiyatli yuklab olindi",
      })
    } catch (error) {
      console.error("Template download error:", error)
      toast({
        title: "Xatolik",
        description: "Shablonni yuklab olishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }, [toast, branches])

  const validateItem = useCallback(
    (item: any, rowIndex: number): BulkImportItem => {
      const errors: string[] = []
      const warnings: string[] = []

      // Required fields validation
      if (!item.model || typeof item.model !== "string" || item.model.trim() === "") {
        errors.push("Model nomi kiritilmagan")
      }

      if (!item.category || !VALID_CATEGORIES.includes(item.category)) {
        errors.push(`Kategoriya noto'g'ri. Quyidagilardan birini tanlang: ${VALID_CATEGORIES.join(", ")}`)
      }

      const weight = Number(item.weight)
      if (!weight || weight <= 0) {
        errors.push("Og'irlik 0 dan katta bo'lishi kerak")
      }

      const lomNarxi = Number(item.lomNarxi)
      if (!lomNarxi || lomNarxi <= 0) {
        errors.push("Lom narxi 0 dan katta bo'lishi kerak")
      }

      const lomNarxiKirim = Number(item.lomNarxiKirim)
      if (!lomNarxiKirim || lomNarxiKirim <= 0) {
        errors.push("Lom narxi kirim 0 dan katta bo'lishi kerak")
      }

      const laborCost = Number(item.laborCost)
      if (isNaN(laborCost) || laborCost < 0) {
        errors.push("Ishchi haqi manfiy bo'lishi mumkin emas")
      }

      // Optional fields validation
      const profitPercentage = Number(item.profitPercentage) || 20
      if (profitPercentage < 0) {
        errors.push("Foyda foizi manfiy bo'lishi mumkin emas")
      }
      if (profitPercentage > 100) {
        warnings.push("Foyda foizi juda yuqori (100% dan ortiq)")
      }
      if (profitPercentage < 10) {
        warnings.push("Foyda foizi past (10% dan kam)")
      }

      const quantity = Number(item.quantity) || 1
      if (quantity <= 0) {
        errors.push("Miqdor 0 dan katta bo'lishi kerak")
      }

      // Validate isProvider and branch logic
      const isProvider = item.isProvider === "TRUE" || item.isProvider === true

      // Branch validation with improved mapping
      let branchId = ""
      let branchName = ""

      if (!isProvider && item.branch) {
        const branchNameLower = item.branch.toString().trim().toLowerCase()

        // Try to find branch ID from our mapping
        branchId = branchNameToIdMap[branchNameLower] || ""

        // If we couldn't find the branch ID, warn the user
        if (!branchId) {
          warnings.push(`Filial nomi "${item.branch}" tizimda topilmadi. Iltimos tekshiring.`)
        } else {
          // Find the branch object to get the proper name
          const branchObj = branches.find((b) => b.id === branchId)
          branchName = branchObj ? branchObj.name : item.branch
        }
      }

      if (!isProvider && !branchId) {
        warnings.push("Filial nomi ko'rsatilmagan (ombor inventari emas)")
      }

      if (isProvider && item.branch && item.branch.trim() !== "") {
        warnings.push("Ombor inventari uchun filial ko'rsatilmasligi kerak")
      }

      // Validate color if provided
      if (item.color && !VALID_COLORS.includes(item.color)) {
        warnings.push(`Rang noto'g'ri: ${item.color}. Quyidagilardan birini tanlang: ${VALID_COLORS.join(", ")}`)
      }

      // Validate purity if provided
      if (item.purity && !VALID_PURITIES.includes(item.purity)) {
        warnings.push(
          `Tozalik qiymati noto'g'ri: ${item.purity}. Quyidagilardan birini tanlang: ${VALID_PURITIES.join(", ")}`,
        )
      }

      // Validate payment status if provided
      if (item.paymentStatus && !VALID_PAYMENT_STATUSES.includes(item.paymentStatus)) {
        warnings.push(`To'lov holati noto'g'ri: ${item.paymentStatus}`)
      }

      // Validate stone weight
      const stoneWeight = Number(item.stoneWeight)
      if (item.stoneWeight && (stoneWeight <= 0 || stoneWeight > weight)) {
        warnings.push("Tosh og'irligi mahsulot og'irligidan katta bo'lishi mumkin emas")
      }

      // Business logic warnings
      if (lomNarxiKirim < lomNarxi) {
        warnings.push("Lom narxi kirim lom narxidan kam")
      }

      if (laborCost > lomNarxi) {
        warnings.push("Ishchi haqi lom narxidan yuqori")
      }

      // Calculate costs and selling price
      let totalCost = 0
      let sellingPrice = 0

      if (errors.length === 0) {
        try {
          // Calculate selling price using the pricing utility
          sellingPrice = calculateSellingPrice(weight, lomNarxi, lomNarxiKirim, laborCost, profitPercentage, isProvider)

          // Calculate total cost
          const materialCost = weight * (isProvider ? lomNarxi : lomNarxiKirim)
          const laborTotal = weight * laborCost
          totalCost = materialCost + laborTotal
        } catch (error) {
          console.error("Price calculation error:", error)
          errors.push("Narx hisoblashda xatolik")
        }
      }

      // Generate a unique ID for this item
      const uniqueId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${rowIndex}`

      // Date parsing and validation
      let purchaseDate = new Date().toISOString().split("T")[0] // Default to today
      if (item.purchaseDate || item.xaridSanasi) {
        // Handle both purchaseDate and xaridSanasi fields
        const dateStr = (item.purchaseDate || item.xaridSanasi).toString().trim()

        // Handle MM/DD/YY format (e.g., 5/19/25)
        if (dateStr.includes("/")) {
          const parts = dateStr.split("/")
          if (parts.length === 3) {
            const [month, day, year] = parts.map((part) => part.trim())

            // Ensure parts are numeric
            if (!/^\d+$/.test(month) || !/^\d+$/.test(day) || !/^\d+$/.test(year)) {
              warnings.push(`Noto'g'ri sana formati: ${dateStr}. MM/DD/YY yoki YYYY-MM-DD formatidan foydalaning`)
            } else {
              // Convert to numbers
              const monthNum = Number.parseInt(month)
              const dayNum = Number.parseInt(day)
              let yearNum = Number.parseInt(year)

              // Handle two-digit year
              if (year.length === 2) {
                const currentYear = new Date().getFullYear()
                const currentCentury = Math.floor(currentYear / 100) * 100
                yearNum = yearNum <= 30 ? currentCentury + yearNum : currentCentury + yearNum - 100
              }

              // Create date object
              const parsedDate = new Date(yearNum, monthNum - 1, dayNum)
              if (
                !isNaN(parsedDate.getTime()) &&
                parsedDate.getMonth() === monthNum - 1 &&
                parsedDate.getDate() === dayNum
              ) {
                purchaseDate = parsedDate.toISOString().split("T")[0]
              } else {
                warnings.push(`Noto'g'ri sana formati: ${dateStr}. MM/DD/YY yoki YYYY-MM-DD formatidan foydalaning`)
              }
            }
          } else {
            warnings.push(`Noto'g'ri sana formati: ${dateStr}. MM/DD/YY yoki YYYY-MM-DD formatidan foydalaning`)
          }
        }
        // Handle YYYY-MM-DD format
        else if (dateStr.includes("-")) {
          const testDate = new Date(dateStr)
          if (!isNaN(testDate.getTime())) {
            purchaseDate = dateStr
          } else {
            warnings.push(`Noto'g'ri sana formati: ${dateStr}. MM/DD/YY yoki YYYY-MM-DD formatidan foydalaning`)
          }
        } else {
          warnings.push(`Noto'g'ri sana formati: ${dateStr}. MM/DD/YY yoki YYYY-MM-DD formatidan foydalaning`)
        }
      }

      return {
        id: uniqueId,
        model: item.model?.toString().trim() || "",
        category: item.category || "",
        weight,
        size: item.size ? Number(item.size) : undefined,
        quantity,
        lomNarxi,
        lomNarxiKirim,
        laborCost,
        profitPercentage,
        isProvider,
        branch: branchId,
        branchName: branchName,
        color: item.color?.toString().trim() || undefined,
        purity: item.purity?.toString().trim() || undefined,
        stoneType: item.stoneType?.toString().trim() || undefined,
        stoneWeight: item.stoneWeight ? Number(item.stoneWeight) : undefined,
        manufacturer: item.manufacturer?.toString().trim() || undefined,
        notes: item.notes?.toString().trim() || undefined,
        purchaseDate: purchaseDate,
        supplierName: item.supplierName?.toString().trim() || undefined,
        paymentStatus: (item.paymentStatus as any) || "unpaid",
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        totalCost,
        sellingPrice,
        rowIndex,
      }
    },
    [branchNameToIdMap, branches],
  )

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (!selectedFile) return

      // Reset previous state
      setPreviewData([])
      setImportSummary(null)
      setImportStatus("idle")
      setResult(null)

      // Validate file type
      const validExtensions = [".xlsx", ".xls", ".csv"]
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf("."))

      if (!validExtensions.includes(fileExtension)) {
        toast({
          title: "Noto'g'ri fayl turi",
          description: "Iltimos Excel (.xlsx, .xls) yoki CSV (.csv) faylini yuklang",
          variant: "destructive",
        })
        return
      }

      // Add better file size validation
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "Fayl hajmi katta",
          description: "Fayl hajmi 10MB dan oshmasligi kerak",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
      await parseExcelFile(selectedFile)
    },
    [toast, validateItem],
  )

  const parseExcelFile = async (file: File) => {
    try {
      updateProgress("Fayl o'qilmoqda", 10)
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      updateProgress("Ma'lumotlar tahlil qilinmoqda", 30)

      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        blankrows: false,
      }) as any[][]

      if (jsonData.length < 2) {
        toast({
          title: "Fayl bo'sh",
          description: "Excel faylida ma'lumotlar topilmadi",
          variant: "destructive",
        })
        return
      }

      setProgress(50)

      // Get headers and data rows
      const headers = jsonData[0].map((h) => h.toString().toLowerCase().trim())
      const dataRows = jsonData.slice(1)

      // Map headers to expected field names (both English and Uzbek)
      const fieldMapping: Record<string, string> = {
        model: "model",
        kategoriya: "category",
        category: "category",
        ogirlik: "weight",
        weight: "weight",
        olcham: "size",
        size: "size",
        miqdor: "quantity",
        quantity: "quantity",
        "lom narxi": "lomNarxi",
        lomnarxi: "lomNarxi",
        "lom narxi kirim": "lomNarxiKirim",
        lomnarxikirim: "lomNarxiKirim",
        "ishchi haqi": "laborCost",
        ishchihaqi: "laborCost",
        laborcost: "laborCost",
        "foyda foizi": "profitPercentage",
        foydafoizi: "profitPercentage",
        foyda: "profitPercentage",
        profit: "profitPercentage",
        profitpercentage: "profitPercentage",
        "markaziy inventar": "isProvider",
        markaziyinventar: "isProvider",
        markaz: "isProvider",
        provider: "isProvider",
        isprovider: "isProvider",
        ombor: "isProvider",
        filial: "branch",
        branch: "branch",
        rang: "color",
        color: "color",
        tozalik: "purity",
        purity: "purity",
        "tosh turi": "stoneType",
        toshturi: "stoneType",
        tosh: "stoneType",
        stone: "stoneType",
        stonetype: "stoneType",
        "tosh og'irligi": "stoneWeight",
        toshogirligi: "stoneWeight",
        "tosh ogirlik": "stoneWeight",
        stoneweight: "stoneWeight",
        "ishlab chiqaruvchi": "manufacturer",
        ishlab_chiqaruvchi: "manufacturer",
        manufacturer: "manufacturer",
        taminotchi: "supplierName",
        supplier: "supplierName",
        suppliername: "supplierName",
        "xarid sanasi": "purchaseDate",
        xaridsanasi: "purchaseDate",
        "sotib olingan sana": "purchaseDate",
        "sotib olingan sanasi": "purchaseDate",
        sana: "purchaseDate",
        date: "purchaseDate",
        purchasedate: "purchaseDate",
        "to'lov holati": "paymentStatus",
        tolovholati: "paymentStatus",
        tolov: "paymentStatus",
        payment: "paymentStatus",
        paymentstatus: "paymentStatus",
        izoh: "notes",
        notes: "notes",
      }

      updateProgress("Tekshirish", 70)

      // Process each row
      const processedItems: BulkImportItem[] = []

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        const item: any = {}

        // Map row data to item fields
        headers.forEach((header, index) => {
          const fieldName = fieldMapping[header]
          if (fieldName && row[index] !== undefined && row[index] !== "") {
            item[fieldName] = row[index]
          }
        })

        // Skip empty rows
        if (Object.keys(item).length === 0) continue

        // Validate and process item
        const validatedItem = validateItem(item, i + 2) // +2 for header row and 0-based index
        processedItems.push(validatedItem)
      }

      updateProgress("Yakunlanmoqda", 100)

      // Calculate summary
      const summary: ImportSummary = {
        totalRows: processedItems.length,
        validRows: processedItems.filter((item) => item.isValid).length,
        invalidRows: processedItems.filter((item) => !item.isValid).length,
        warningRows: processedItems.filter((item) => item.warnings && item.warnings.length > 0).length,
        duplicateRows: 0,
        totalValue: processedItems
          .filter((item) => item.isValid && item.sellingPrice)
          .reduce((sum, item) => sum + (item.sellingPrice || 0) * (item.quantity || 1), 0),
        categories: processedItems.reduce(
          (acc, item) => {
            if (item.category) {
              acc[item.category] = (acc[item.category] || 0) + 1
            }
            return acc
          },
          {} as Record<string, number>,
        ),
        suppliers: processedItems.reduce(
          (acc, item) => {
            if (item.supplierName) {
              acc[item.supplierName] = (acc[item.supplierName] || 0) + 1
            }
            return acc
          },
          {} as Record<string, number>,
        ),
        branches: processedItems.reduce(
          (acc, item) => {
            if (item.branchName) {
              acc[item.branchName] = (acc[item.branchName] || 0) + 1
            } else if (item.isProvider) {
              acc["Ombor"] = (acc["Ombor"] || 0) + 1
            }
            return acc
          },
          {} as Record<string, number>,
        ),
      }

      setProgress(100)
      setPreviewData(processedItems)
      setImportSummary(summary)
      setImportStatus("preview")

      toast({
        title: "Fayl muvaffaqiyatli yuklandi",
        description: `${summary.totalRows} ta qator topildi, ${summary.validRows} ta yaroqli`,
      })
    } catch (error: any) {
      console.error("Error parsing Excel file:", error)
      toast({
        title: "Fayl o'qishda xatolik",
        description: "Excel faylini o'qishda xatolik yuz berdi. Fayl formatini tekshiring.",
        variant: "destructive",
      })
      setProgress(0)
    }
  }

  const handleImport = async () => {
    if (!file || !previewData.length) return

    const validItems = previewData.filter((item) => item.isValid)
    if (validItems.length === 0) {
      toast({
        title: "Import mumkin emas",
        description: "Yaroqli ma'lumotlar topilmadi",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setImportStatus("uploading")
    setProgress(0)

    try {
      // Convert to ItemFormData format
      const itemsToImport: ItemFormData[] = validItems.map((item) => ({
        model: item.model,
        category: item.category,
        weight: item.weight,
        size: item.size,
        quantity: item.quantity || 1,
        lomNarxi: item.lomNarxi,
        lomNarxiKirim: item.lomNarxiKirim,
        laborCost: item.laborCost,
        profitPercentage: item.profitPercentage || 20,
        isProvider: item.isProvider || false,
        branch: item.branch,
        branchName: item.branchName,
        color: item.color,
        purity: item.purity,
        stoneType: item.stoneType,
        stoneWeight: item.stoneWeight,
        manufacturer: item.manufacturer,
        notes: importNotes ? `${item.notes || ""}\n\nImport izoh: ${importNotes}`.trim() : item.notes,
        purchaseDate: item.purchaseDate || new Date().toISOString().split("T")[0],
        supplierName: item.supplierName,
        paymentStatus: item.paymentStatus || "unpaid",
        sellingPrice: item.sellingPrice,
      }))

      setProgress(25)

      // Import items using the service
      const result = await itemService.createBulkItems(itemsToImport)

      setProgress(100)
      setIsProcessing(false)
      setImportStatus("success")

      const finalResult: BulkImportResult = {
        success: result.success,
        failed: result.failed,
        errors: result.errors,
        warnings: previewData
          .filter((item) => item.warnings?.length)
          .map((item) => `${item.model}: ${item.warnings?.join(", ")}`),
        duplicates: 0,
        totalValue: validItems.reduce((sum, item) => sum + (item.sellingPrice || 0) * (item.quantity || 1), 0),
      }

      setResult(finalResult)

      toast({
        title: "Import muvaffaqiyatli yakunlandi",
        description: `${result.success} ta mahsulot muvaffaqiyatli import qilindi`,
      })

      if (result.success > 0 && result.failed === 0 && onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 3000)
      }
    } catch (error: any) {
      console.error("Error importing items:", error)
      setIsProcessing(false)
      setImportStatus("error")

      const errorResult: BulkImportResult = {
        success: 0,
        failed: validItems.length,
        errors: [error.message || "Ma'lumotlarni import qilishda xatolik yuz berdi"],
        warnings: [],
        duplicates: 0,
        totalValue: 0,
      }

      setResult(errorResult)

      toast({
        title: "Import xatosi",
        description: "Ma'lumotlarni import qilishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const removeFile = () => {
    setFile(null)
    setPreviewData([])
    setImportSummary(null)
    setImportStatus("idle")
    setProgress(0)
    setResult(null)
    setImportNotes("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const filteredData = previewData.filter((item) => {
    const matchesCategory = filterCategory === "all" || item.category === filterCategory
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "valid" && item.isValid) ||
      (filterStatus === "invalid" && !item.isValid) ||
      (filterStatus === "warning" && item.warnings?.length)
    const matchesSearch =
      !searchTerm ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.branchName?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesCategory && matchesStatus && matchesSearch
  })

  const displayedData = showAllRows ? filteredData : filteredData.slice(0, 10)

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Ko'p mahsulot import qilish</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Excel fayl orqali bir vaqtda ko'p mahsulot qo'shing. Kengaytirilgan tekshirish va tahlil bilan.
        </p>
      </div>

      {/* Important Notes */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Muhim eslatmalar</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Ombor inventari uchun "markaziyInventar" ustuniga "TRUE" yozing</li>
            <li>Filial mahsulotlari uchun "FALSE" yozing va filial nomini ko'rsating</li>
            <li>
              Barcha majburiy maydonlarni to'ldiring: model, kategoriya, og'irlik, lomNarxi, lomNarxiKirim, ishchiHaqi
            </li>
            <li>Model nomlari bir xil bo'lishi mumkin - har bir mahsulot uchun noyob ID avtomatik yaratiladi</li>
            <li>Filial nomlarini to'g'ri yozing, tizimda mavjud filiallar bilan mos kelishi kerak</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Download className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            1-qadam: Excel shablonini yuklab oling
          </CardTitle>
          <CardDescription className="text-sm">
            Birinchi marta import qilayotgan bo'lsangiz, shablonni yuklab oling va uni to'ldiring. Shablon barcha
            kerakli ustunlar va namuna ma'lumotlarni o'z ichiga oladi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-md">
                <FileSpreadsheet className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 text-sm sm:text-base">Excel shablon fayli</h4>
                <p className="text-xs sm:text-sm text-blue-700">
                  Namuna mahsulotlar, yo'riqnoma va tekshirish qoidalari bilan
                </p>
              </div>
            </div>
            <Button onClick={downloadTemplate} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Shablonni yuklab olish
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            2-qadam: To'ldirilgan faylni yuklang
          </CardTitle>
          <CardDescription className="text-sm">
            Shablonni to'ldirgandan so'ng, uni shu yerga yuklang. Fayl avtomatik tekshiriladi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-green-400 transition-colors">
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center cursor-pointer space-y-4"
              >
                <div className="p-3 sm:p-4 bg-green-100 rounded-full">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-medium">Faylni tanlang yoki shu yerga tashlang</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Excel (.xlsx, .xls) yoki CSV fayllar (maksimal 10MB)
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-md">
                  <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900 text-sm sm:text-base">{file.name}</p>
                  <p className="text-xs sm:text-sm text-green-700">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.lastModified).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={removeFile} className="text-red-600 hover:text-red-700">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Progress Bar */}
          {progress > 0 && progress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fayl tahlil qilinmoqda...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Summary */}
      {importSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              Import xulosasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{importSummary.totalRows}</div>
                <div className="text-xs sm:text-sm text-gray-600">Jami qatorlar</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{importSummary.validRows}</div>
                <div className="text-xs sm:text-sm text-green-700">Yaroqli</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-red-600">{importSummary.invalidRows}</div>
                <div className="text-xs sm:text-sm text-red-700">Xatolar</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">{importSummary.warningRows}</div>
                <div className="text-xs sm:text-sm text-yellow-700">Ogohlantirishlar</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg col-span-2 sm:col-span-1">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">
                  {formatCurrency(importSummary.totalValue)}
                </div>
                <div className="text-xs sm:text-sm text-blue-700">Jami qiymat</div>
              </div>
            </div>

            {/* Category and Supplier Breakdown */}
            <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-3">
              <div>
                <h4 className="font-medium mb-2 text-sm sm:text-base">Kategoriyalar</h4>
                <div className="space-y-1">
                  {Object.entries(importSummary.categories).map(([category, count]) => (
                    <div key={category} className="flex justify-between text-sm">
                      <span>{category}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-sm sm:text-base">Ta'minotchilar</h4>
                <div className="space-y-1">
                  {Object.entries(importSummary.suppliers)
                    .slice(0, 5)
                    .map(([supplier, count]) => (
                      <div key={supplier} className="flex justify-between text-sm">
                        <span className="truncate">{supplier}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-sm sm:text-base">Filiallar</h4>
                <div className="space-y-1">
                  {Object.entries(importSummary.branches)
                    .slice(0, 5)
                    .map(([branch, count]) => (
                      <div key={branch} className="flex justify-between text-sm">
                        <span className="truncate">{branch}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Alerts */}
      {importSummary && (
        <div className="space-y-3">
          {importSummary.invalidRows > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Tekshirish xatolari</AlertTitle>
              <AlertDescription>
                {importSummary.invalidRows} ta qatorda xatolar mavjud. Import qilishdan oldin ularni tuzating.
              </AlertDescription>
            </Alert>
          )}

          {importSummary.warningRows > 0 && (
            <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Ogohlantirishlar</AlertTitle>
              <AlertDescription>
                {importSummary.warningRows} ta qatorda ogohlantirishlar mavjud. Tekshirib ko'ring.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Data Preview */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  Ma'lumotlar ko'rinishi
                </CardTitle>
                <CardDescription className="text-sm">
                  Import qilinadigan ma'lumotlarni tekshiring va tasdiqlang
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllRows(!showAllRows)}
                  className="text-xs sm:text-sm"
                >
                  {showAllRows ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
                  {showAllRows ? "Kamroq ko'rsatish" : "Barchasini ko'rsatish"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview" className="text-xs sm:text-sm">
                  Ko'rinish
                </TabsTrigger>
                <TabsTrigger value="errors" className="text-xs sm:text-sm">
                  Xatolar va ogohlantirishlar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Model, ta'minotchi yoki filial bo'yicha qidirish..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 text-sm"
                      />
                    </div>
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Kategoriya" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                      {VALID_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Holat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha holatlar</SelectItem>
                      <SelectItem value="valid">Yaroqli</SelectItem>
                      <SelectItem value="invalid">Xatolar</SelectItem>
                      <SelectItem value="warning">Ogohlantirishlar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Table */}
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[400px] sm:h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px] text-xs sm:text-sm">№</TableHead>
                          <TableHead className="text-xs sm:text-sm">Model</TableHead>
                          <TableHead className="text-xs sm:text-sm">Kategoriya</TableHead>
                          <TableHead className="text-xs sm:text-sm">Og'irlik</TableHead>
                          <TableHead className="text-xs sm:text-sm">Filial</TableHead>
                          <TableHead className="text-xs sm:text-sm">Sotuv narxi</TableHead>
                          <TableHead className="text-xs sm:text-sm">Holat</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedData.map((item, index) => (
                          <TableRow key={index} className={!item.isValid ? "bg-red-50" : ""}>
                            <TableCell className="text-xs sm:text-sm">{item.rowIndex}</TableCell>
                            <TableCell className="font-medium text-xs sm:text-sm">{item.model}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{item.category}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{item.weight}g</TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {item.isProvider ? "Ombor" : item.branchName || "—"}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {item.sellingPrice ? formatCurrency(item.sellingPrice) : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {item.isValid ? (
                                  <Badge variant="default" className="text-xs">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Yaroqli
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    Xato
                                  </Badge>
                                )}
                                {item.warnings && item.warnings.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                    Ogohlantirish
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                {!showAllRows && filteredData.length > 10 && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {filteredData.length - 10} ta qator ko'rsatilmagan.{" "}
                      <Button variant="link" onClick={() => setShowAllRows(true)} className="p-0 h-auto text-sm">
                        Barchasini ko'rsatish
                      </Button>
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="errors" className="space-y-4">
                <ScrollArea className="h-[400px] sm:h-[500px]">
                  <div className="space-y-3">
                    {previewData
                      .filter((item) => !item.isValid || (item.warnings && item.warnings.length > 0))
                      .map((item, index) => (
                        <div
                          key={index}
                          className={`p-3 sm:p-4 rounded-lg border ${
                            !item.isValid ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm sm:text-base">
                                  {item.rowIndex}-qator: {item.model}
                                </span>
                                {!item.isValid && (
                                  <Badge variant="destructive" className="text-xs">
                                    Xato
                                  </Badge>
                                )}
                                {item.warnings && item.warnings.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    Ogohlantirish
                                  </Badge>
                                )}
                              </div>
                              {item.errors && item.errors.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-red-700">Xatolar:</p>
                                  <ul className="list-disc list-inside space-y-1">
                                    {item.errors.map((error, errorIndex) => (
                                      <li key={errorIndex} className="text-sm text-red-600">
                                        {error}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {item.warnings && item.warnings.length > 0 && (
                                <div className="space-y-1 mt-2">
                                  <p className="text-sm font-medium text-yellow-700">Ogohlantirishlar:</p>
                                  <ul className="list-disc list-inside space-y-1">
                                    {item.warnings.map((warning, warningIndex) => (
                                      <li key={warningIndex} className="text-sm text-yellow-600">
                                        {warning}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Import Notes */}
      {previewData.length > 0 && importSummary && importSummary.validRows > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Import izohi (ixtiyoriy)</CardTitle>
            <CardDescription className="text-sm">
              Ushbu import haqida qo'shimcha ma'lumot qo'shing. Bu izoh barcha mahsulotlarga qo'shiladi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Masalan: 2024-yil yanvar oyining birinchi partiyasi..."
              value={importNotes}
              onChange={(e) => setImportNotes(e.target.value)}
              className="min-h-[80px] text-sm"
            />
          </CardContent>
        </Card>
      )}

      {/* Import Actions */}
      {previewData.length > 0 && importSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              3-qadam: Import qilish
            </CardTitle>
            <CardDescription className="text-sm">
              Ma'lumotlarni tekshirib bo'lgandan so'ng, import jarayonini boshlang.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="font-medium text-green-900 text-sm sm:text-base">
                  {importSummary.validRows} ta mahsulot import qilishga tayyor
                </p>
                <p className="text-xs sm:text-sm text-green-700">
                  Jami qiymat: {formatCurrency(importSummary.totalValue)}
                </p>
                {importSummary.invalidRows > 0 && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">
                    {importSummary.invalidRows} ta qator xatolar tufayli o'tkazib yuboriladi
                  </p>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel} disabled={isProcessing} className="flex-1 sm:flex-none">
                    Bekor qilish
                  </Button>
                )}
                <Button
                  onClick={handleImport}
                  disabled={isProcessing || importSummary.validRows === 0}
                  className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Import qilinmoqda...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Import qilish
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Import Progress */}
            {isProcessing && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ma'lumotlar import qilinmoqda...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Result Display */}
      {result && importStatus === "success" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Import natijalari</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Muvaffaqiyatli</AlertTitle>
              <AlertDescription>{result.success} ta mahsulot muvaffaqiyatli import qilindi.</AlertDescription>
            </Alert>

            {result.failed > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Xatolar</AlertTitle>
                <AlertDescription>
                  {result.failed} ta mahsulot import qilinmadi.
                  {result.errors && result.errors.length > 0 && (
                    <ul className="list-disc list-inside mt-2">
                      {result.errors.map((error, index) => (
                        <li key={index} className="text-sm">
                          {error}
                        </li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {result.warnings && result.warnings.length > 0 && (
              <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ogohlantirishlar</AlertTitle>
                <AlertDescription>
                  Quyidagi mahsulotlarda ogohlantirishlar mavjud:
                  <ul className="list-disc list-inside mt-2">
                    {result.warnings.map((warning, index) => (
                      <li key={index} className="text-sm">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-4">
              <p className="text-sm">Jami import qilingan qiymat: {formatCurrency(result.totalValue)}</p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Yopish
                </Button>
              )}
              {onSuccess && <Button onClick={onSuccess}>Yangi mahsulot qo'shish</Button>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

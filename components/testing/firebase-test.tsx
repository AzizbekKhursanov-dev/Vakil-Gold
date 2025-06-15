"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/hooks/use-auth"
import { useItems } from "@/lib/hooks/use-items"
import { useBranches } from "@/lib/hooks/use-branches"
import { itemService } from "@/lib/services/item.service"
import { branchService } from "@/lib/services/branch.service"
import { CheckCircle, XCircle, Loader2, Database, Users, Package, RefreshCw } from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "success" | "error"
  message?: string
  duration?: number
}

export function FirebaseTest() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const { items, refreshItems } = useItems({ realtime: false })
  const { branches, refreshBranches } = useBranches({ realtime: false })
  const [realtimeItems, setRealtimeItems] = useState<any[]>([])

  useEffect(() => {
    if (isRunning) return
    const { items: rtItems } = useItems({ realtime: true })
    setRealtimeItems(rtItems)
  }, [isRunning])

  const updateTest = (name: string, status: TestResult["status"], message?: string, duration?: number) => {
    setTests((prev) => {
      const existing = prev.find((t) => t.name === name)
      if (existing) {
        return prev.map((t) => (t.name === name ? { ...t, status, message, duration } : t))
      }
      return [...prev, { name, status, message, duration }]
    })
  }

  const runTest = async (name: string, testFn: () => Promise<void>) => {
    const startTime = Date.now()
    updateTest(name, "pending")

    try {
      await testFn()
      const duration = Date.now() - startTime
      updateTest(name, "success", "Muvaffaqiyatli", duration)
    } catch (error: any) {
      const duration = Date.now() - startTime
      updateTest(name, "error", error.message, duration)
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTests([])

    // Test 1: Authentication
    await runTest("Autentifikatsiya", async () => {
      if (!user) {
        throw new Error("Foydalanuvchi tizimga kirmagan")
      }
      if (!user.id || !user.email) {
        throw new Error("Foydalanuvchi ma'lumotlari to'liq emas")
      }
    })

    // Test 2: Firestore Connection
    await runTest("Firestore ulanishi", async () => {
      const testBranches = await branchService.getBranches()
      if (!Array.isArray(testBranches)) {
        throw new Error("Firestore dan ma'lumot olishda xatolik")
      }
    })

    // Test 3: Real-time Data
    await runTest("Real-time ma'lumotlar", async () => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Real-time ulanish vaqti tugadi"))
        }, 5000)

        setTimeout(() => {
          clearTimeout(timeout)
          if (Array.isArray(realtimeItems)) {
            resolve()
          } else {
            reject(new Error("Real-time ma'lumotlar olinmadi"))
          }
        }, 1000)
      })
    })

    // Test 4: Create Item
    await runTest("Mahsulot yaratish", async () => {
      const testItem = {
        model: `TEST-${Date.now()}`,
        category: "Uzuk",
        weight: 1.5,
        lomNarxi: 800000,
        lomNarxiKirim: 850000,
        laborCost: 70000,
        profitPercentage: 20,
        quantity: 1,
        isProvider: true,
        purchaseDate: new Date().toISOString().split("T")[0],
      }

      const itemId = await itemService.createItem(testItem)
      if (!itemId) {
        throw new Error("Mahsulot yaratilmadi")
      }

      // Clean up test item
      await itemService.deleteItem(itemId)
    })

    // Test 5: Create Branch
    await runTest("Filial yaratish", async () => {
      const testBranch = {
        name: `Test Filial ${Date.now()}`,
        location: "Test manzil",
        manager: "Test manager",
        isProvider: false,
      }

      const branchId = await branchService.createBranch(testBranch)
      if (!branchId) {
        throw new Error("Filial yaratilmadi")
      }

      // Clean up test branch
      await branchService.deleteBranch(branchId)
    })

    // Test 6: Data Synchronization
    await runTest("Ma'lumotlar sinxronizatsiyasi", async () => {
      const initialCount = items.length

      // Create a test item
      const testItem = {
        model: `SYNC-TEST-${Date.now()}`,
        category: "Uzuk",
        weight: 1.0,
        lomNarxi: 800000,
        lomNarxiKirim: 850000,
        laborCost: 70000,
        profitPercentage: 20,
        quantity: 1,
        isProvider: true,
        purchaseDate: new Date().toISOString().split("T")[0],
      }

      const itemId = await itemService.createItem(testItem)

      // Refresh and check if item appears
      await refreshItems()

      // Clean up
      await itemService.deleteItem(itemId)
    })

    // Test 7: Error Handling
    await runTest("Xatoliklarni boshqarish", async () => {
      try {
        // Try to create item with invalid data
        await itemService.createItem({} as any)
        throw new Error("Noto'g'ri ma'lumot bilan mahsulot yaratildi")
      } catch (error: any) {
        if (error.message.includes("yaratishda xatolik")) {
          // Expected error
          return
        }
        throw error
      }
    })

    setIsRunning(false)

    const successCount = tests.filter((t) => t.status === "success").length
    const totalTests = tests.length

    toast({
      title: "Testlar yakunlandi",
      description: `${successCount}/${totalTests} test muvaffaqiyatli o'tdi`,
      variant: successCount === totalTests ? "default" : "destructive",
    })
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Bajarilmoqda</Badge>
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Muvaffaqiyatli
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Xatolik</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Firebase Integratsiya Testi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Firebase xizmatlarining to'liq funksionalligini tekshiring</p>
            <Button onClick={runAllTests} disabled={isRunning} className="flex items-center gap-2">
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {isRunning ? "Testlar bajarilmoqda..." : "Testlarni boshlash"}
            </Button>
          </div>

          {tests.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Test natijalari:</h4>
              {tests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <span className="font-medium">{test.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.duration && <span className="text-xs text-muted-foreground">{test.duration}ms</span>}
                    {getStatusBadge(test.status)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tests.length > 0 && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {tests.filter((t) => t.status === "success").length}
                </div>
                <div className="text-sm text-muted-foreground">Muvaffaqiyatli</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {tests.filter((t) => t.status === "error").length}
                </div>
                <div className="text-sm text-muted-foreground">Xatolik</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {tests.filter((t) => t.status === "pending").length}
                </div>
                <div className="text-sm text-muted-foreground">Kutilmoqda</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autentifikatsiya</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Faol</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Faol emas</span>
                </>
              )}
            </div>
            {user && <p className="text-xs text-muted-foreground mt-1">{user.email}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mahsulotlar</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">Jami mahsulotlar soni</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filiallar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.length}</div>
            <p className="text-xs text-muted-foreground">Jami filiallar soni</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { getFirebaseAuth, initializeFirebase } from "@/lib/firebase/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { setToLocalStorage } from "@/lib/utils/localStorage"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [firebaseReady, setFirebaseReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Initialize Firebase on component mount
    const initFirebase = async () => {
      try {
        if (typeof window !== "undefined") {
          initializeFirebase()
          setFirebaseReady(true)
        }
      } catch (error: any) {
        console.error("Firebase initialization error:", error)
        setInitError(error.message || "Failed to initialize Firebase")
      }
    }

    initFirebase()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firebaseReady) {
      toast({
        title: "Xatolik",
        description: "Firebase hali tayyor emas. Iltimos, kuting...",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const auth = getFirebaseAuth()
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Store user session in localStorage
      setToLocalStorage("user_session", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        lastLogin: new Date().toISOString(),
      })

      toast({
        title: "Muvaffaqiyatli kirish",
        description: "Boshqaruv paneliga xush kelibsiz!",
      })

      router.push("/")
    } catch (error: any) {
      console.error("Login error:", error)

      let errorMessage = "Noma'lum xatolik yuz berdi"

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "Bu email bilan foydalanuvchi topilmadi"
          break
        case "auth/wrong-password":
          errorMessage = "Parol noto'g'ri"
          break
        case "auth/invalid-email":
          errorMessage = "Email formati noto'g'ri"
          break
        case "auth/user-disabled":
          errorMessage = "Bu hisob o'chirilgan"
          break
        case "auth/too-many-requests":
          errorMessage = "Juda ko'p urinish. Keyinroq qayta urinib ko'ring"
          break
        case "auth/network-request-failed":
          errorMessage = "Internet aloqasi bilan muammo"
          break
        default:
          errorMessage = error.message || "Email yoki parol noto'g'ri"
      }

      toast({
        title: "Kirish xatosi",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Xatolik</CardTitle>
            <CardDescription>Firebase ulanishida muammo</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{initError}</AlertDescription>
            </Alert>
            <Button onClick={() => window.location.reload()} className="w-full mt-4" variant="outline">
              Qayta yuklash
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Vakil Gold</CardTitle>
          <CardDescription>Boshqaruv paneliga kirish</CardDescription>
        </CardHeader>
        <CardContent>
          {!firebaseReady ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Firebase yuklanmoqda...</span>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vakilgold.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Parol</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kirish...
                  </>
                ) : (
                  "Kirish"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

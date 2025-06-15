"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { AppLayout } from "@/components/layout/app-layout"
import { Dashboard } from "@/components/dashboard/dashboard"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Yuklanmoqda...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null // Let the useEffect handle the redirect
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <Dashboard />
      </AppLayout>
    </ProtectedRoute>
  )
}

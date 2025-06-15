import type { Metadata } from "next"
import { AppLayout } from "@/components/layout/app-layout"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { FirebaseTest } from "@/components/testing/firebase-test"

export const metadata: Metadata = {
  title: "Tizim testi - Vakil Gold",
  description: "Firebase integratsiya va funksionallik testi",
}

export default function TestingPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Tizim testi</h1>
            <p className="text-muted-foreground">Firebase integratsiya va barcha funksionalliklarni tekshiring</p>
          </div>
          <FirebaseTest />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

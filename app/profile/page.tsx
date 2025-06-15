import type { Metadata } from "next"
import { AppLayout } from "@/components/layout/app-layout"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { ProfileSettings } from "@/components/auth/profile-settings"

export const metadata: Metadata = {
  title: "Profil sozlamalari - Vakil Gold",
  description: "Foydalanuvchi profili va sozlamalar",
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Profil sozlamalari</h1>
            <p className="text-muted-foreground">Shaxsiy ma'lumotlaringizni va hisob sozlamalaringizni boshqaring</p>
          </div>
          <ProfileSettings />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

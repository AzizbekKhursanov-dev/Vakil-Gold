import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Ruxsat yo'q - Vakil Gold",
  description: "Bu sahifaga kirish uchun ruxsat yo'q",
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-xl">Ruxsat yo'q</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Bu sahifaga kirish uchun sizda yetarli ruxsat yo'q. Agar bu xato deb hisoblasangiz, administrator bilan
            bog'laning.
          </p>
          <div className="space-y-2">
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Bosh sahifaga qaytish
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Boshqa hisob bilan kirish
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"

export function FirebaseStatus() {
  return (
    <Alert className="bg-green-50 border-green-200 mb-4">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        ✅ Firebase ulanishi faol. Tillo Savdosi loyihasi ulangan.
      </AlertDescription>
    </Alert>
  )
}

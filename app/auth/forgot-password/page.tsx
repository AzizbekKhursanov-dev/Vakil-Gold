import type { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Parolni tiklash - Vakil Gold",
  description: "Parolingizni tiklang",
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vakil Gold</h1>
          <p className="text-gray-600">Parolingizni tiklang</p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

const forgotPasswordSchema = z.object({
  email: z.string().email("Noto'g'ri email format"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { resetPassword } = useAuth()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true)
      await resetPassword(data.email)
      setEmailSent(true)

      toast({
        title: "Email yuborildi",
        description: "Parolni tiklash uchun emailingizni tekshiring",
      })
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Email yuborildi</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Parolni tiklash uchun <strong>{getValues("email")}</strong> manziliga email yuborildi.
          </p>
          <p className="text-sm text-gray-500">Email kelmadimi? Spam papkasini tekshiring yoki qayta urinib ko'ring.</p>
          <div className="space-y-2">
            <Button onClick={() => setEmailSent(false)} variant="outline" className="w-full">
              Qayta yuborish
            </Button>
            <Link href="/auth/login">
              <Button variant="link" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Tizimga kirishga qaytish
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Parolni tiklash</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email manzil</Label>
            <Input id="email" type="email" placeholder="email@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Parolni tiklash emailini yuborish
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/auth/login">
            <Button variant="link">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tizimga kirishga qaytish
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

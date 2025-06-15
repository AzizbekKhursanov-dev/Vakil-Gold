"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Lock, Mail } from "lucide-react"

const profileSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  email: z.string().email("Noto'g'ri email format"),
})

const passwordSchema = z
  .object({
    newPassword: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Parollar mos kelmaydi",
    path: ["confirmPassword"],
  })

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export function ProfileSettings() {
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const { user, updateUserProfile, changePassword } = useAuth()
  const { toast } = useToast()

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onUpdateProfile = async (data: ProfileFormData) => {
    try {
      setIsUpdatingProfile(true)
      await updateUserProfile(data)

      toast({
        title: "Profil yangilandi",
        description: "Ma'lumotlaringiz muvaffaqiyatli yangilandi",
      })
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const onChangePassword = async (data: PasswordFormData) => {
    try {
      setIsChangingPassword(true)
      await changePassword(data.newPassword)

      passwordForm.reset()
      toast({
        title: "Parol o'zgartirildi",
        description: "Parolingiz muvaffaqiyatli o'zgartirildi",
      })
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Administrator ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">To'liq ism</Label>
              <Input id="name" {...profileForm.register("name")} placeholder="Ismingizni kiriting" />
              {profileForm.formState.errors.name && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10"
                  {...profileForm.register("email")}
                  placeholder="email@example.com"
                  disabled // Email changes require re-authentication
                />
              </div>
              {profileForm.formState.errors.email && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Email o'zgartirish uchun qo'llab-quvvatlash xizmatiga murojaat qiling
              </p>
            </div>

            <Button type="submit" disabled={isUpdatingProfile}>
              {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Profilni yangilash
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Parolni o'zgartirish
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Yangi parol</Label>
              <Input
                id="newPassword"
                type="password"
                {...passwordForm.register("newPassword")}
                placeholder="Yangi parolingizni kiriting"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Parolni tasdiqlang</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...passwordForm.register("confirmPassword")}
                placeholder="Parolni qayta kiriting"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Parolni o'zgartirish
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Hisob ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Administrator ID:</span>
            <span className="font-mono text-sm">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rol:</span>
            <span className="capitalize">Administrator</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ro'yxatdan o'tgan sana:</span>
            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Oxirgi yangilanish:</span>
            <span>{new Date(user.updatedAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

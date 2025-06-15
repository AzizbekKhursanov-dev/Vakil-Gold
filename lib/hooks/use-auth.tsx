"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { getFirebaseAuth, getFirebaseDb, initializeFirebase, waitForPersistence } from "@/lib/firebase/config"
import type { User as AppUser, AuthState } from "@/lib/types/user"

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (data: Partial<AppUser>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  changePassword: (newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    let unsubscribe: (() => void) | null = null

    const initAuth = async () => {
      try {
        // Initialize Firebase
        initializeFirebase()
        await waitForPersistence()

        const auth = getFirebaseAuth()
        const db = getFirebaseDb()

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
          if (firebaseUser) {
            try {
              // Get user data from Firestore
              const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
              if (userDoc.exists()) {
                const userData = userDoc.data() as AppUser
                setAuthState({
                  user: { ...userData, id: firebaseUser.uid },
                  loading: false,
                  error: null,
                })
              } else {
                // Create default admin user if doesn't exist
                const defaultUser: AppUser = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  name: firebaseUser.displayName || "Administrator",
                  role: "admin", // Always admin in single-user version
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }

                await setDoc(doc(db, "users", firebaseUser.uid), defaultUser)

                setAuthState({
                  user: defaultUser,
                  loading: false,
                  error: null,
                })
              }
            } catch (error) {
              console.error("Auth error:", error)
              setAuthState({
                user: null,
                loading: false,
                error: "Foydalanuvchi ma'lumotlarini yuklashda xatolik",
              })
            }
          } else {
            setAuthState({
              user: null,
              loading: false,
              error: null,
            })
          }
        })
      } catch (error) {
        console.error("Firebase initialization error:", error)
        setAuthState({
          user: null,
          loading: false,
          error: "Firebase ulanishida xatolik",
        })
      }
    }

    initAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))
      const auth = getFirebaseAuth()
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      const errorMessage =
        error.code === "auth/user-not-found" || error.code === "auth/wrong-password"
          ? "Email yoki parol noto'g'ri"
          : "Tizimga kirishda xatolik yuz berdi"

      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      throw new Error(errorMessage)
    }
  }

  const logout = async () => {
    try {
      const auth = getFirebaseAuth()
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const updateUserProfile = async (data: Partial<AppUser>) => {
    try {
      if (!authState.user) throw new Error("Foydalanuvchi tizimga kirmagan")

      const db = getFirebaseDb()
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      }

      await updateDoc(doc(db, "users", authState.user.id), updateData)

      // Update local state
      setAuthState((prev) => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updateData } : null,
      }))

      // Update Firebase Auth profile if name changed
      const auth = getFirebaseAuth()
      if (data.name && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: data.name })
      }
    } catch (error: any) {
      throw new Error("Profilni yangilashda xatolik yuz berdi")
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const auth = getFirebaseAuth()
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      let errorMessage = "Parolni tiklashda xatolik yuz berdi"

      if (error.code === "auth/user-not-found") {
        errorMessage = "Bu email bilan foydalanuvchi topilmadi"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Noto'g'ri email format"
      }

      throw new Error(errorMessage)
    }
  }

  const changePassword = async (newPassword: string) => {
    try {
      const auth = getFirebaseAuth()
      if (!auth.currentUser) throw new Error("Foydalanuvchi tizimga kirmagan")

      await updatePassword(auth.currentUser, newPassword)
    } catch (error: any) {
      let errorMessage = "Parolni o'zgartirishda xatolik yuz berdi"

      if (error.code === "auth/weak-password") {
        errorMessage = "Parol juda zaif. Kamida 6 ta belgi kiriting"
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Parolni o'zgartirish uchun qayta tizimga kiring"
      }

      throw new Error(errorMessage)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        updateUserProfile,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

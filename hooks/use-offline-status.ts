"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface OfflineStatus {
  isOnline: boolean
  isOffline: boolean
  wasOffline: boolean
}

export function useOfflineStatus(): OfflineStatus {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Initial status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        toast({
          title: "🌐 Internetga ulanish tiklandi",
          description: "Ma'lumotlar sinxronlashtirilmoqda...",
          duration: 3000,
        })
        setWasOffline(false)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      toast({
        title: "📱 Oflayn rejim",
        description: "Internet aloqasi yo'q. Keshdan ma'lumotlar yuklanmoqda.",
        variant: "destructive",
        duration: 5000,
      })
    }

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [wasOffline, toast])

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
  }
}

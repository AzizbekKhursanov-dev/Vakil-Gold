"use client"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/hooks/use-auth"
import { BranchProvider } from "@/lib/contexts/branch-context"
import { FirebaseStatus } from "@/components/firebase-status"
import { initializePerformanceMonitoring } from "@/lib/config/performance-monitoring"
import { addResourceHints, detectLongTasks, detectMemoryLeaks } from "@/lib/utils/performance"
import { useEffect } from "react"

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
})

// Client-side performance initialization
function ClientPerformanceInit() {
  useEffect(() => {
    // Initialize performance monitoring
    initializePerformanceMonitoring()

    // Add resource hints
    addResourceHints()

    // Detect long tasks and memory leaks
    const cleanupLongTasks = detectLongTasks()
    const cleanupMemoryLeaks = detectMemoryLeaks()

    return () => {
      cleanupLongTasks()
      cleanupMemoryLeaks()
    }
  }, [])

  return null
}

export default function ClientRootLayout({
  children,
}: {
  children: import("react").ReactNode
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebase.googleapis.com" />

        {/* Critical CSS inlined */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            body { margin: 0; padding: 0; }
            .loading-spinner { 
              display: inline-block; 
              width: 20px; 
              height: 20px; 
              border: 3px solid #f3f3f3; 
              border-top: 3px solid #3498db; 
              border-radius: 50%; 
              animation: spin 1s linear infinite; 
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <BranchProvider>
              <div className="min-h-screen bg-background">
                <FirebaseStatus />
                {children}
              </div>
              <Toaster />
            </BranchProvider>
          </AuthProvider>
        </ThemeProvider>
        <ClientPerformanceInit />
      </body>
    </html>
  )
}

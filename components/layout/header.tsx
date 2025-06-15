"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { BranchSelector } from "./branch-selector"
import { Bell, User, Settings, LogOut, Gem } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"

export function Header() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [notifications] = useState(3) // Mock notification count

  // Define pages where branch selector should be shown
  const branchRelevantPages = [
    "/items",
    "/branches",
    "/monthly-revenue",
    "/profit-analysis",
    "/supplier-accounting",
    "/reports",
    "/analytics",
    "/recommendations",
    "/expenses",
  ]

  // Check if current page needs branch selector
  const shouldShowBranchSelector = branchRelevantPages.some((page) => pathname.startsWith(page))

  // Don't show branch selector on auth pages, settings, dashboard, etc.
  const hideOnPages = [
    "/auth",
    "/settings",
    "/profile",
    "/backup",
    "/testing",
    "/unauthorized",
    "/", // dashboard
  ]

  const shouldHideBranchSelector = hideOnPages.some(
    (page) => pathname === page || (page !== "/" && pathname.startsWith(page)),
  )

  const showBranchSelector = shouldShowBranchSelector && !shouldHideBranchSelector

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <Gem className="h-6 w-6 text-yellow-600" />
            <span className="hidden font-bold sm:inline-block">Vakil Gold</span>
          </a>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* Branch Selector - only show on relevant pages */}
          {showBranchSelector && (
            <div className="flex-1 md:flex-none">
              <BranchSelector />
            </div>
          )}

          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                    <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.displayName || "Foydalanuvchi"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Sozlamalar</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Chiqish</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

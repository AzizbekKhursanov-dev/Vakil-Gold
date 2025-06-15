"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { sidebarLinks } from "@/lib/utils/sidebar-links"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close mobile sidebar when route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0">
          <MobileSidebar pathname={pathname} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className={cn("hidden md:block", className)}>
        <DesktopSidebar pathname={pathname} />
      </div>
    </>
  )
}

function MobileSidebar({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">Vakil Gold</h2>
      </div>
      <ScrollArea className="flex-1 overflow-auto">
        <div className="px-3 py-2">
          {sidebarLinks.map((group) => (
            <div key={group.title} className="py-2">
              <h3 className="mb-1 px-4 text-sm font-medium text-muted-foreground">{group.title}</h3>
              <div className="space-y-1">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === link.href ? "bg-accent text-accent-foreground" : "transparent",
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function DesktopSidebar({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Vakil Gold</h2>
      </div>
      <ScrollArea className="flex-1 overflow-auto">
        <div className="px-3 py-2">
          {sidebarLinks.map((group) => (
            <div key={group.title} className="py-2">
              <h3 className="mb-1 px-4 text-sm font-medium text-muted-foreground">{group.title}</h3>
              <div className="space-y-1">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === link.href ? "bg-accent text-accent-foreground" : "transparent",
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

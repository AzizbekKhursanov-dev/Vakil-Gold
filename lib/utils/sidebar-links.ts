import {
  LayoutDashboard,
  Package,
  CreditCard,
  Settings,
  Building,
  BarChart3,
  FileText,
  DollarSign,
  Calendar,
  Users,
  ShoppingBag,
  Truck,
} from "lucide-react"

export const sidebarLinks = [
  {
    title: "Asosiy",
    links: [
      {
        title: "Boshqaruv paneli",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        title: "Mahsulotlar",
        href: "/items",
        icon: Package,
      },
      {
        title: "Filiallar",
        href: "/branches",
        icon: Building,
      },
      {
        title: "Xarajatlar",
        href: "/expenses",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Tahlil",
    links: [
      {
        title: "Analitika paneli",
        href: "/analytics-dashboard",
        icon: BarChart3,
      },
      {
        title: "Hisobotlar",
        href: "/reports",
        icon: FileText,
      },
      {
        title: "Foyda tahlili",
        href: "/profit-analysis",
        icon: DollarSign,
      },
      {
        title: "Oylik daromad",
        href: "/monthly-revenue",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Boshqaruv",
    links: [
      {
        title: "Yetkazib beruvchilar",
        href: "/supplier-accounting",
        icon: Truck,
      },
      {
        title: "Foydalanuvchilar",
        href: "/profile",
        icon: Users,
      },
      {
        title: "Zaxira nusxa",
        href: "/backup",
        icon: ShoppingBag,
      },
      {
        title: "Sozlamalar",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
]

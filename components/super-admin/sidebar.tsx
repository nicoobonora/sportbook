/**
 * Sidebar di navigazione per il super-admin.
 * Collassabile su mobile tramite Sheet di shadcn.
 */
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Plus,
  LogOut,
  Menu,
  ShieldQuestion,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const NAV_ITEMS = [
  { href: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/clubs", label: "Circoli", icon: Building2 },
  { href: "/super-admin/claims", label: "Richieste reclamo", icon: ShieldQuestion },
  { href: "/super-admin/clubs/new", label: "Nuovo Circolo", icon: Plus },
]

function NavContent({ pathname }: { pathname: string }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/super-admin/login")
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b p-4">
        <Link href="/super-admin/dashboard" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold uppercase tracking-tight">
            SportBook
          </span>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">Super Admin</p>
      </div>

      {/* Navigazione */}
      <nav className="flex-1 space-y-1 p-4" aria-label="Navigazione principale">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors touch-target",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Esci
        </Button>
      </div>
    </div>
  )
}

export function SuperAdminSidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden w-64 border-r bg-card lg:block" aria-label="Menu laterale">
        <NavContent pathname={pathname} />
      </aside>

      {/* Menu mobile hamburger */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center border-b bg-card px-4 py-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="touch-target" aria-label="Apri menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavContent pathname={pathname} />
          </SheetContent>
        </Sheet>
        <span className="ml-3 font-display text-lg font-bold uppercase tracking-tight">
          SportBook
        </span>
      </div>

      {/* Spacer per la barra mobile */}
      <div className="h-14 lg:hidden" />
    </>
  )
}

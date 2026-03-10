/**
 * Sidebar di navigazione per il pannello admin del circolo.
 * Collassabile su mobile tramite Sheet di shadcn.
 * Si chiude automaticamente su mobile quando si clicca una voce.
 */
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  Megaphone,
  Settings,
  LogOut,
  Menu,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/prenotazioni", label: "Prenotazioni", icon: CalendarCheck },
  { path: "/admin/slot", label: "Slot & Orari", icon: Clock },
  { path: "/admin/annunci", label: "Annunci", icon: Megaphone },
  { path: "/admin/impostazioni", label: "Impostazioni", icon: Settings },
]

function NavContent({
  basePath,
  pathname,
  clubName,
  onNavigate,
}: {
  basePath: string
  pathname: string
  clubName: string
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <Link
          href={`${basePath}/admin/dashboard`}
          className="block"
          onClick={onNavigate}
        >
          <span className="font-display text-lg font-bold uppercase tracking-tight">
            {clubName}
          </span>
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">Pannello Admin</p>
      </div>

      {/* Navigazione */}
      <nav className="flex-1 space-y-1 p-4" aria-label="Menu admin">
        {NAV_ITEMS.map((item) => {
          const href = `${basePath}${item.path}`
          const isActive =
            pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={item.path}
              href={href}
              onClick={onNavigate}
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

      {/* Link al sito pubblico + Logout (solo desktop) */}
      <div className="border-t p-4 space-y-1">
        <Link
          href={`${basePath}/`}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground touch-target"
        >
          Vai al sito pubblico
        </Link>
        <LogoutButton basePath={basePath} className="hidden lg:flex" />
      </div>
    </div>
  )
}

function LogoutButton({ basePath, className }: { basePath: string; className?: string }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`${basePath}/admin/login`)
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      className={cn("w-full justify-start gap-3 text-muted-foreground", className)}
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Esci
    </Button>
  )
}

export function AdminSidebar({ clubName, basePath = "" }: { clubName: string; basePath?: string }) {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  function handleMobileNavigate() {
    setSheetOpen(false)
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside
        className="hidden w-64 shrink-0 border-r bg-card lg:block"
        aria-label="Menu laterale admin"
      >
        <NavContent basePath={basePath} pathname={pathname} clubName={clubName} />
      </aside>

      {/* Barra mobile */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center border-b bg-card px-4 py-3 lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="touch-target"
              aria-label="Apri menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavContent
              basePath={basePath}
              pathname={pathname}
              clubName={clubName}
              onNavigate={handleMobileNavigate}
            />
          </SheetContent>
        </Sheet>
        <span className="ml-3 flex-1 font-display text-lg font-bold uppercase tracking-tight">
          {clubName}
        </span>
      </div>
    </>
  )
}

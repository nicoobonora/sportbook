/**
 * Header del sito pubblico del circolo.
 * Mobile-first con menu hamburger.
 */
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import type { Club } from "@/lib/types/database"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const NAV_ITEMS = [
  { path: "/", label: "Home" },
  { path: "/prenota", label: "Prenota" },
  { path: "/annunci", label: "Annunci" },
  { path: "/contatti", label: "Contatti" },
]

function NavLinks({
  basePath,
  pathname,
  onClick,
}: {
  basePath: string
  pathname: string
  onClick?: () => void
}) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const href = `${basePath}${item.path}`
        const isActive =
          pathname === href || (item.path !== "/" && pathname.startsWith(href))
        return (
          <Link
            key={item.path}
            href={href}
            onClick={onClick}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors touch-target",
              isActive
                ? "bg-primary/10 text-primary font-semibold"
                : "text-foreground hover:bg-muted"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        )
      })}
    </>
  )
}

export function ClubHeader({ club, basePath = "" }: { club: Club; basePath?: string }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container-sportbook flex h-14 items-center justify-between sm:h-16">
        {/* Logo e nome circolo */}
        <Link href={`${basePath}/`} className="flex items-center gap-2">
          {club.logo_url && (
            <Image
              src={club.logo_url}
              alt=""
              width={32}
              height={32}
              className="rounded"
            />
          )}
          <span className="font-display text-lg font-bold uppercase tracking-tight">
            {club.name}
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigazione principale">
          <NavLinks basePath={basePath} pathname={pathname} />
        </nav>

        {/* CTA desktop */}
        <div className="hidden md:block">
          <Button asChild size="sm">
            <Link href={`${basePath}/prenota`}>Prenota ora</Link>
          </Button>
        </div>

        {/* Menu mobile */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="touch-target" aria-label="Apri menu di navigazione">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="mt-8 flex flex-col gap-2" aria-label="Navigazione principale">
              <NavLinks basePath={basePath} pathname={pathname} />
              <div className="mt-4 border-t pt-4">
                <Button asChild className="w-full">
                  <Link href={`${basePath}/prenota`}>Prenota ora</Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

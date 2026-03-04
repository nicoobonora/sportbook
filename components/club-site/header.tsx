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
  { href: "/", label: "Home" },
  { href: "/prenota", label: "Prenota" },
  { href: "/annunci", label: "Annunci" },
  { href: "/contatti", label: "Contatti" },
]

function NavLinks({ pathname, onClick }: { pathname: string; onClick?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
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

export function ClubHeader({ club }: { club: Club }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container-sportbook flex h-14 items-center justify-between sm:h-16">
        {/* Logo e nome circolo */}
        <Link href="/" className="flex items-center gap-2">
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
          <NavLinks pathname={pathname} />
        </nav>

        {/* CTA desktop */}
        <div className="hidden md:block">
          <Button asChild size="sm">
            <Link href="/prenota">Prenota ora</Link>
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
              <NavLinks pathname={pathname} />
              <div className="mt-4 border-t pt-4">
                <Button asChild className="w-full">
                  <Link href="/prenota">Prenota ora</Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

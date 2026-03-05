/**
 * Footer del sito pubblico del circolo.
 * Contatti rapidi, link social e legali.
 */
import Link from "next/link"
import { Phone, Mail, MapPin, Lock } from "lucide-react"
import type { Club } from "@/lib/types/database"

export function ClubFooter({ club, basePath = "" }: { club: Club; basePath?: string }) {
  return (
    <footer className="border-t bg-card" role="contentinfo">
      <div className="container-sportbook py-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Colonna 1: Info circolo */}
          <div>
            <p className="font-display text-lg font-bold uppercase tracking-tight">
              {club.name}
            </p>
            {club.tagline && (
              <p className="mt-1 text-sm text-muted-foreground">{club.tagline}</p>
            )}
          </div>

          {/* Colonna 2: Contatti rapidi */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Contatti</p>
            {club.address && (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {club.address}{club.city ? `, ${club.city}` : ""}
              </p>
            )}
            {club.phone && (
              <p className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <a href={`tel:${club.phone}`} className="hover:underline">
                  {club.phone}
                </a>
              </p>
            )}
            {club.email && (
              <p className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <a href={`mailto:${club.email}`} className="hover:underline">
                  {club.email}
                </a>
              </p>
            )}
          </div>

          {/* Colonna 3: Link */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Link utili</p>
            <nav className="flex flex-col gap-1" aria-label="Link footer">
              <Link href={`${basePath}/prenota`} className="text-sm text-muted-foreground hover:underline">
                Prenotazioni
              </Link>
              <Link href={`${basePath}/annunci`} className="text-sm text-muted-foreground hover:underline">
                Annunci
              </Link>
              <Link href={`${basePath}/contatti`} className="text-sm text-muted-foreground hover:underline">
                Contatti
              </Link>
              <Link
                href={`${basePath}/admin/login`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:underline"
              >
                <Lock className="h-3 w-3" aria-hidden="true" />
                Area Riservata
              </Link>
            </nav>
          </div>
        </div>

        {/* Riga copyright */}
        <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {club.name}. Tutti i diritti riservati.
          </p>
          <p className="mt-1">
            Realizzato con{" "}
            <span className="font-semibold">SportBook</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

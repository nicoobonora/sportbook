/**
 * Landing page SEO per singolo sport.
 * Es: /calcetto → tutte le città con circoli di calcetto.
 *
 * Serve come pagina "hub" per lo sport, con link alle sotto-pagine città.
 */
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { MapPin, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const VALID_SPORTS = [
  "calcetto", "calcio", "padel", "tennis", "basket",
  "pallavolo", "nuoto", "beach-volley", "ping-pong",
  "badminton", "fitness", "crossfit", "yoga", "golf",
  "rugby", "atletica",
] as const

function capitalize(s: string): string {
  return s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

interface PageProps {
  params: { sport: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const sport = params.sport
  if (!VALID_SPORTS.includes(sport as (typeof VALID_SPORTS)[number])) {
    return { title: "Sport non trovato" }
  }

  const sportLabel = capitalize(sport)

  return {
    title: `${sportLabel} in Italia — Trova Circoli e Prenota Campi | PrenotaUnCampetto`,
    description: `Trova circoli e campi da ${sportLabel.toLowerCase()} in tutta Italia. Confronta, scegli e prenota online su PrenotaUnCampetto.`,
    alternates: { canonical: `/${sport}` },
  }
}

export default async function SportIndexPage({ params }: PageProps) {
  const sport = params.sport
  if (!VALID_SPORTS.includes(sport as (typeof VALID_SPORTS)[number])) {
    notFound()
  }

  const sportLabel = capitalize(sport)
  const supabase = createAdminClient()

  // Recupera tutte le città uniche con questo sport
  const { data: clubs } = await supabase
    .from("clubs")
    .select("city, province")
    .eq("is_active", true)
    .contains("sports", [sport])
    .not("city", "is", null)

  // Aggrega per città con conteggio
  const cityMap = new Map<string, { city: string; province: string | null; count: number }>()
  for (const club of clubs || []) {
    if (!club.city) continue
    const key = club.city.toLowerCase()
    if (cityMap.has(key)) {
      cityMap.get(key)!.count++
    } else {
      cityMap.set(key, {
        city: club.city,
        province: club.province,
        count: 1,
      })
    }
  }

  const cities = Array.from(cityMap.values()).sort((a, b) => b.count - a.count)

  return (
    <main id="main-content" className="min-h-screen bg-background">
      {/* ── Header ── */}
      <section className="border-b bg-card py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4">
          <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1">
              <li>
                <Link href="/" className="hover:text-primary hover:underline">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li className="font-medium text-foreground">{sportLabel}</li>
            </ol>
          </nav>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {sportLabel} in Italia
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {cities.length > 0
              ? `Trova campi da ${sportLabel.toLowerCase()} in ${cities.length} ${cities.length === 1 ? "città" : "città"} italiane. Scegli la tua zona e prenota online.`
              : `Stiamo espandendo la copertura per ${sportLabel.toLowerCase()}. Riprova presto!`}
          </p>
        </div>
      </section>

      {/* ── Griglia città ── */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4">
          {cities.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cities.map((entry) => {
                const citySlug = entry.city.toLowerCase().replace(/\s+/g, "-")
                return (
                  <Link
                    key={citySlug}
                    href={`/${sport}/${citySlug}`}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <span className="font-medium">{entry.city}</span>
                        {entry.province && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({entry.province})
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {entry.count} {entry.count === 1 ? "circolo" : "circoli"}
                    </Badge>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">
                Nessun circolo trovato per {sportLabel}.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/">
                  Esplora la mappa
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── Link ad altri sport ── */}
      <section className="border-t bg-card py-10">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-lg font-semibold">Altri sport</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {VALID_SPORTS.filter((s) => s !== sport).map((s) => (
              <Link
                key={s}
                href={`/${s}`}
                className="inline-flex items-center rounded-full border px-3 py-1 text-sm capitalize text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {capitalize(s)}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

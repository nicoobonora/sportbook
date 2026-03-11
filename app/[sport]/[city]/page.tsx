/**
 * Landing page SEO per combinazione sport+città.
 * Es: /calcetto/bologna → lista di tutti i circoli con calcetto a Bologna.
 *
 * Queste pagine sono fondamentali per il posizionamento su query
 * come "calcetto bologna", "padel roma", "tennis milano" ecc.
 */
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, ArrowRight, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

// Sport validi (deve corrispondere a SPORTS_OPTIONS in lib/validations/club.ts)
const VALID_SPORTS = [
  "calcetto", "calcio", "padel", "tennis", "basket",
  "pallavolo", "nuoto", "beach-volley", "ping-pong",
  "badminton", "fitness", "crossfit", "yoga", "golf",
  "rugby", "atletica",
] as const

/** Capitalizza e gestisce nomi con trattini */
function capitalize(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

/** Normalizza slug città per confronto con DB (slug → minuscolo senza trattini) */
function citySlugToSearchTerm(slug: string): string {
  return slug.replace(/-/g, " ").toLowerCase()
}

interface PageProps {
  params: { sport: string; city: string }
}

async function getClubsForSportCity(sport: string, citySlug: string) {
  const supabase = createAdminClient()
  const citySearch = citySlugToSearchTerm(citySlug)

  const { data: clubs } = await supabase
    .from("clubs")
    .select(
      "id, slug, name, tagline, sports, city, province, address, phone, logo_url, google_rating, google_total_ratings, latitude, longitude"
    )
    .eq("is_active", true)
    .contains("sports", [sport])
    .ilike("city", `%${citySearch}%`)
    .order("google_rating", { ascending: false, nullsFirst: false })

  return clubs || []
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const sport = params.sport
  const citySlug = params.city

  if (!VALID_SPORTS.includes(sport as (typeof VALID_SPORTS)[number])) {
    return { title: "Sport non trovato" }
  }

  const sportLabel = capitalize(sport)
  const cityLabel = capitalize(citySlug)
  const clubs = await getClubsForSportCity(sport, citySlug)
  const count = clubs.length

  const title = `${sportLabel} a ${cityLabel} — ${count > 0 ? `${count} Circoli dove Giocare` : "Circoli sportivi"} | PrenotaUnCampetto`
  const description = count > 0
    ? `Trova e prenota campi da ${sportLabel.toLowerCase()} a ${cityLabel}. ${count} circoli disponibili con prenotazione online, orari e prezzi aggiornati.`
    : `Cerchi campi da ${sportLabel.toLowerCase()} a ${cityLabel}? Scopri i circoli sportivi su PrenotaUnCampetto e prenota online.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "it_IT",
      siteName: "PrenotaUnCampetto",
    },
    alternates: {
      canonical: `/${sport}/${citySlug}`,
    },
  }
}

export default async function SportCityPage({ params }: PageProps) {
  const sport = params.sport
  const citySlug = params.city

  // Valida sport
  if (!VALID_SPORTS.includes(sport as (typeof VALID_SPORTS)[number])) {
    notFound()
  }

  const sportLabel = capitalize(sport)
  const cityLabel = capitalize(citySlug)
  const clubs = await getClubsForSportCity(sport, citySlug)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const rootDomain = baseUrl.replace(/^https?:\/\/(app\.)?/, "")
  const isLocalhost = baseUrl.includes("localhost")

  // JSON-LD per la pagina aggregata
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${sportLabel} a ${cityLabel}`,
    description: `Circoli e campi da ${sportLabel.toLowerCase()} a ${cityLabel}`,
    about: {
      "@type": "SportsActivityLocation",
      sport: sportLabel,
      address: {
        "@type": "PostalAddress",
        addressLocality: cityLabel,
        addressCountry: "IT",
      },
    },
    numberOfItems: clubs.length,
    itemListElement: clubs.map((club, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SportsActivityLocation",
        name: club.name,
        url: isLocalhost
          ? `${baseUrl}/club/${club.slug}`
          : `https://${club.slug}.${rootDomain}`,
        sport: club.sports.map(capitalize),
        ...(club.address && {
          address: {
            "@type": "PostalAddress",
            streetAddress: club.address,
            addressLocality: club.city,
            addressCountry: "IT",
          },
        }),
        ...(club.google_rating && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: club.google_rating,
            reviewCount: club.google_total_ratings,
          },
        }),
      },
    })),
  }

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Header SEO-friendly ── */}
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
              <li>
                <Link href={`/${sport}`} className="hover:text-primary hover:underline capitalize">
                  {sportLabel}
                </Link>
              </li>
              <li>/</li>
              <li className="font-medium text-foreground">{cityLabel}</li>
            </ol>
          </nav>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {sportLabel} a {cityLabel}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {clubs.length > 0
              ? `Abbiamo trovato ${clubs.length} ${clubs.length === 1 ? "circolo" : "circoli"} con campi da ${sportLabel.toLowerCase()} a ${cityLabel} e dintorni. Prenota online il tuo campo.`
              : `Non abbiamo ancora circoli con ${sportLabel.toLowerCase()} a ${cityLabel}. Stiamo espandendo la copertura — riprova presto!`}
          </p>
        </div>
      </section>

      {/* ── Lista circoli ── */}
      <section className="py-8 sm:py-12" aria-label={`Circoli di ${sportLabel} a ${cityLabel}`}>
        <div className="mx-auto max-w-5xl px-4">
          {clubs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {clubs.map((club) => {
                const clubUrl = isLocalhost
                  ? `/club/${club.slug}`
                  : `https://${club.slug}.${rootDomain}`

                return (
                  <Card key={club.id} className="overflow-hidden transition-shadow hover:shadow-md">
                    <CardContent className="flex gap-4 p-4 sm:p-5">
                      {/* Logo */}
                      {club.logo_url && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={club.logo_url}
                            alt={`Logo ${club.name}`}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        {/* Nome e rating */}
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="text-base font-semibold leading-tight">
                            <Link href={clubUrl} className="hover:text-primary hover:underline">
                              {club.name}
                            </Link>
                          </h2>
                          {club.google_rating && (
                            <div className="flex shrink-0 items-center gap-1 text-sm">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{club.google_rating}</span>
                              {club.google_total_ratings && (
                                <span className="text-muted-foreground">
                                  ({club.google_total_ratings})
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Tagline */}
                        {club.tagline && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                            {club.tagline}
                          </p>
                        )}

                        {/* Indirizzo */}
                        {(club.address || club.city) && (
                          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {[club.address, club.city].filter(Boolean).join(", ")}
                          </p>
                        )}

                        {/* Telefono */}
                        {club.phone && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            {club.phone}
                          </p>
                        )}

                        {/* Sport badges */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {club.sports.map((s) => (
                            <Badge
                              key={s}
                              variant={s === sport ? "default" : "secondary"}
                              className="text-xs capitalize"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>

                        {/* CTA */}
                        <div className="mt-3">
                          <Button asChild size="sm" variant="outline">
                            <Link href={clubUrl}>
                              Vedi circolo
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">
                Nessun circolo trovato per {sportLabel} a {cityLabel}.
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

      {/* ── Sezione SEO con contenuto testuale ── */}
      <section className="border-t bg-card py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-xl font-semibold">
            Dove giocare a {sportLabel.toLowerCase()} a {cityLabel}
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Stai cercando un campo da {sportLabel.toLowerCase()} a {cityLabel}?
              Su PrenotaUnCampetto puoi trovare e confrontare i migliori circoli
              sportivi della zona, consultare orari e disponibilità, e prenotare
              online in pochi click.
            </p>
            <p>
              {clubs.length > 0
                ? `Attualmente ci sono ${clubs.length} ${clubs.length === 1 ? "circolo" : "circoli"} che offrono ${sportLabel.toLowerCase()} a ${cityLabel} e provincia. Ogni circolo ha la sua pagina dedicata con informazioni dettagliate, contatti e sistema di prenotazione.`
                : `Stiamo ampliando la nostra copertura a ${cityLabel}. Se conosci un circolo con campi da ${sportLabel.toLowerCase()} nella zona, segnalacelo!`}
            </p>
          </div>

          {/* Link ad altri sport nella stessa città */}
          {clubs.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-muted-foreground">
                Altri sport a {cityLabel}:
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {VALID_SPORTS.filter((s) => s !== sport)
                  .slice(0, 6)
                  .map((s) => (
                    <Link
                      key={s}
                      href={`/${s}/${citySlug}`}
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs capitalize text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {capitalize(s)}
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

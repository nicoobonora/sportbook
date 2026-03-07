/**
 * Home page del sito pubblico del circolo.
 * Mostra hero, sport, annunci in evidenza e preview about.
 */
import type { Metadata } from "next"
import Link from "next/link"
import { getClubFromHeaders, getClubBasePath } from "@/lib/hooks/use-club"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/utils/dates"
import { DiscoveryPage } from "@/components/discovery/discovery-page"

export async function generateMetadata(): Promise<Metadata> {
  const club = await getClubFromHeaders()
  if (!club) {
    return { title: "SportBook" }
  }
  return {
    title: `${club.name} — ${club.tagline || "Circolo sportivo"}`,
    description: club.tagline || `Sito ufficiale di ${club.name}`,
  }
}

export default async function ClubHomePage() {
  const club = await getClubFromHeaders()

  // Pagina discovery quando non c'è un club (root del sito)
  if (!club) {
    return (
      <main id="main-content">
        <DiscoveryPage />
      </main>
    )
  }

  const basePath = getClubBasePath()

  // Recupera annunci in evidenza
  const supabase = createClient()
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .eq("club_id", club.id)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(3)

  return (
    <main id="main-content">
      {/* ── Hero Section ── */}
      <section
        role="banner"
        className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-primary sm:min-h-[70vh]"
        style={
          club.cover_image_url
            ? {
                backgroundImage: `url(${club.cover_image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {/* Overlay scuro per garantire contrasto testo */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="container-sportbook relative z-10 text-center text-white">
          <h1 className="font-display text-display-xl uppercase tracking-tight sm:text-[4rem]">
            {club.name}
          </h1>
          {club.tagline && (
            <p className="mt-3 text-lg opacity-90 sm:text-xl">{club.tagline}</p>
          )}
          <div className="mt-8">
            {club.claim_status === "claimed" ? (
              <Button
                asChild
                size="lg"
                className="touch-target text-base font-semibold"
              >
                <Link href={`${basePath}/prenota`}>
                  Prenota ora
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <div className="mx-auto max-w-md rounded-lg bg-white/10 px-6 py-4 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 text-white/90">
                  <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <p className="text-sm">
                    Questa struttura non ha ancora attivato le prenotazioni online.
                    Se conosci il proprietario, invitalo a registrarsi su prenotauncampetto.it
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Sport disponibili ── */}
      {club.sports.length > 0 && (
        <section className="border-b bg-card py-6" aria-label="Sport disponibili">
          <div className="container-sportbook">
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
              <span className="text-sm font-medium text-muted-foreground">
                I nostri sport:
              </span>
              {club.sports.map((sport) => (
                <Badge key={sport} variant="secondary" className="capitalize">
                  {sport}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Annunci in evidenza ── */}
      {announcements && announcements.length > 0 && (
        <section className="py-12" aria-labelledby="announcements-heading">
          <div className="container-sportbook">
            <div className="flex items-center justify-between">
              <h2
                id="announcements-heading"
                className="font-display text-display-md uppercase tracking-tight"
              >
                Annunci
              </h2>
              <Link
                href={`${basePath}/annunci`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Vedi tutti
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {announcements.map((ann) => (
                <Card key={ann.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{ann.title}</CardTitle>
                      {ann.is_pinned && (
                        <Badge variant="secondary" className="shrink-0">
                          In evidenza
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(ann.published_at)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {ann.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── About preview ── */}
      {club.about_text && (
        <section className="border-t bg-card py-12" aria-labelledby="about-heading">
          <div className="container-sportbook">
            <h2
              id="about-heading"
              className="font-display text-display-md uppercase tracking-tight"
            >
              Chi siamo
            </h2>
            <p className="mt-4 line-clamp-3 max-w-2xl text-muted-foreground">
              {club.about_text}
            </p>
            <Link
              href={`${basePath}/contatti`}
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Scopri di più &rarr;
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}

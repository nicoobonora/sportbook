/**
 * Pagina "Reclama questo circolo" — form pubblico per gestori.
 * Accessibile solo per club unclaimed/pending.
 */
import type { Metadata } from "next"
import Link from "next/link"
import { getClubFromHeaders, getClubBasePath } from "@/lib/hooks/use-club"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react"
import { ClaimForm } from "@/components/club-site/claim-form"

export async function generateMetadata(): Promise<Metadata> {
  const club = await getClubFromHeaders()
  if (!club) return { title: "Reclama — SportBook" }
  return {
    title: `Reclama ${club.name} — PrenotaUnCampetto`,
    description: `Sei il gestore di ${club.name}? Reclama la tua pagina e attiva le prenotazioni online.`,
  }
}

export default async function ReclamaPage() {
  const club = await getClubFromHeaders()
  if (!club) return null

  const basePath = getClubBasePath()

  // Club già claimed → redirect/messaggio
  if (club.claim_status === "claimed") {
    return (
      <main id="main-content" className="min-h-screen bg-background">
        <div className="container-sportbook py-8 sm:py-12">
          <div className="mx-auto max-w-lg">
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">
                    Circolo già verificato
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Questo circolo è già stato reclamato e verificato.
                    Se sei il gestore e hai bisogno di supporto, contattaci.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href={basePath || "/"}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Torna alla pagina del circolo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    )
  }

  // Club pending → richiesta già inviata
  if (club.claim_status === "pending") {
    return (
      <main id="main-content" className="min-h-screen bg-background">
        <div className="container-sportbook py-8 sm:py-12">
          <div className="mx-auto max-w-lg">
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">
                    Richiesta in fase di verifica
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Abbiamo già ricevuto una richiesta di reclamo per questo circolo.
                    Il nostro team la sta verificando — ti contatteremo a breve
                    via email o telefono.
                  </p>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  In attesa di verifica
                </Badge>
                <Button variant="outline" asChild>
                  <Link href={basePath || "/"}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Torna alla pagina del circolo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    )
  }

  // Club unclaimed → mostra il form di reclamo
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="container-sportbook py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link href={basePath || "/"}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Torna al circolo
              </Link>
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-display-lg uppercase tracking-tight">
              Reclama {club.name}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sei il gestore di questa struttura? Compila il form qui sotto per
              attivare le prenotazioni online sulla tua pagina. Verificheremo
              la tua identità e ti contatteremo entro 24 ore.
            </p>
          </div>

          {/* Riepilogo circolo */}
          <Card className="mb-8">
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{club.name}</p>
                  {club.address && (
                    <p className="text-sm text-muted-foreground">{club.address}</p>
                  )}
                  {club.sports && club.sports.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {club.sports.map((sport) => (
                        <Badge key={sport} variant="secondary" className="text-xs capitalize">
                          {sport}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0 border-amber-300 text-amber-600">
                  Non reclamato
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Form di reclamo */}
          <ClaimForm clubId={club.id} clubName={club.name} />

          {/* Info aggiuntive */}
          <div className="mt-8 rounded-lg border bg-muted/50 p-6">
            <h2 className="font-semibold">Come funziona?</h2>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  1
                </span>
                <span>Compila il form con i tuoi dati di contatto e il tuo ruolo nella struttura.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </span>
                <span>Il nostro team verificherà la tua identità (potremmo chiamarti o inviarti una email).</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </span>
                <span>Una volta verificato, riceverai l&apos;accesso al pannello di gestione con prenotazioni online attive.</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  )
}

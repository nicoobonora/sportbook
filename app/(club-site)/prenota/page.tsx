/**
 * Pagina Prenotazione del sito pubblico del circolo.
 * Stepper in 4 step: Struttura → Data → Orario → Dati
 */
import type { Metadata } from "next"
import Link from "next/link"
import { getClubFromHeaders, getClubBasePath } from "@/lib/hooks/use-club"
import { createClient } from "@/lib/supabase/server"
import { BookingStepper } from "@/components/club-site/booking-stepper"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"

export async function generateMetadata(): Promise<Metadata> {
  const club = await getClubFromHeaders()
  if (!club) return { title: "Prenota — SportBook" }
  return {
    title: `Prenota — ${club.name}`,
    description: `Prenota un campo o una struttura presso ${club.name}`,
  }
}

export default async function PrenotaPage() {
  const club = await getClubFromHeaders()
  if (!club) return null

  const basePath = getClubBasePath()

  // Club unclaimed: mostra avviso invece del form di prenotazione
  if (club.claim_status !== "claimed") {
    return (
      <main id="main-content" className="min-h-screen bg-background">
        <div className="container-sportbook py-8 sm:py-12">
          <h1 className="font-display text-display-lg uppercase tracking-tight">
            Prenota
          </h1>
          <div className="mt-8 flex justify-center">
            <Card className="max-w-lg">
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    Prenotazioni non disponibili
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Il proprietario di questa struttura non ha ancora attivato
                    il sistema di prenotazioni online. Se lo conosci, invitalo
                    a registrarsi su prenotauncampetto.it per gestire la sua pagina.
                  </p>
                </div>
                {club.phone && (
                  <p className="text-sm text-muted-foreground">
                    Puoi contattare direttamente la struttura al{" "}
                    <a href={`tel:${club.phone}`} className="font-medium text-primary hover:underline">
                      {club.phone}
                    </a>
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <Button variant="default" asChild>
                    <Link href={`${basePath}/reclama`}>
                      Sei il gestore? Attiva le prenotazioni
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={basePath || "/"}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Torna alla pagina del circolo
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    )
  }

  // Recupera le strutture/campi attivi del circolo
  const supabase = createClient()
  const { data: fields } = await supabase
    .from("fields")
    .select("*")
    .eq("club_id", club.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  // Verifica se il circolo accetta pagamenti online
  const paymentEnabled =
    club.stripe_plan_type === "pro"

  let connectActive = false
  if (paymentEnabled) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const adminClient = createAdminClient()
    const { data: connectAccount } = await adminClient
      .from("stripe_connect_accounts")
      .select("charges_enabled, onboarding_complete")
      .eq("club_id", club.id)
      .single()
    connectActive = !!(connectAccount?.charges_enabled && connectAccount?.onboarding_complete)
  }

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="container-sportbook py-8 sm:py-12">
        <h1 className="font-display text-display-lg uppercase tracking-tight">
          Prenota
        </h1>
        <p className="mt-1 text-muted-foreground">
          Scegli struttura, data e orario per la tua prenotazione
        </p>

        <div className="mt-8">
          <BookingStepper
            clubId={club.id}
            clubName={club.name}
            basePath={basePath}
            fields={fields || []}
            paymentEnabled={connectActive}
          />
        </div>
      </div>
    </main>
  )
}

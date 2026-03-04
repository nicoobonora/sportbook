/**
 * Pagina Prenotazione del sito pubblico del circolo.
 * Stepper in 4 step: Struttura → Data → Orario → Dati
 */
import type { Metadata } from "next"
import { getClubFromHeaders, getClubBasePath } from "@/lib/hooks/use-club"
import { createClient } from "@/lib/supabase/server"
import { BookingStepper } from "@/components/club-site/booking-stepper"

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

  // Recupera le strutture/campi attivi del circolo
  const supabase = createClient()
  const { data: fields } = await supabase
    .from("fields")
    .select("*")
    .eq("club_id", club.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

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
            basePath={getClubBasePath()}
            fields={fields || []}
          />
        </div>
      </div>
    </main>
  )
}

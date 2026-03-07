/**
 * Pagina gestione orari di apertura e blocchi.
 * Griglia calendario settimanale con fasce orarie configurabili e blocchi.
 */
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getClubFromHeaders } from "@/lib/hooks/use-club"
import { OpeningHoursManager } from "@/components/admin/opening-hours-manager"

export const metadata: Metadata = {
  title: "Orari & Disponibilità — Admin",
}

export default async function SlotPage() {
  const club = await getClubFromHeaders()
  if (!club) return null

  const supabase = createClient()

  // Recupera campi, fasce orarie e blocchi
  const [{ data: fields }, { data: openingHours }, { data: blocks }] = await Promise.all([
    supabase
      .from("fields")
      .select("*")
      .eq("club_id", club.id)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("opening_hours")
      .select("*")
      .eq("club_id", club.id)
      .order("day_of_week")
      .order("start_time"),
    supabase
      .from("slot_blocks")
      .select("*")
      .eq("club_id", club.id)
      .order("created_at", { ascending: false }),
  ])

  return (
    <>
      <h1 className="font-display text-display-lg uppercase tracking-tight">
        Orari & Disponibilità
      </h1>
      <p className="mt-1 text-muted-foreground">
        Configura le fasce orarie di apertura e i blocchi per le prenotazioni
      </p>

      <div className="mt-8">
        <OpeningHoursManager
          clubId={club.id}
          fields={fields || []}
          openingHours={openingHours || []}
          blocks={blocks || []}
        />
      </div>
    </>
  )
}

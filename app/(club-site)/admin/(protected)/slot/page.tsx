/**
 * Pagina gestione slot e template orari.
 * Due sezioni: Template settimanali e Slot specifici.
 */
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getClubFromHeaders } from "@/lib/hooks/use-club"
import { SlotManager } from "@/components/admin/slot-manager"

export const metadata: Metadata = {
  title: "Slot & Orari — Admin",
}

export default async function SlotPage() {
  const club = await getClubFromHeaders()
  if (!club) return null

  const supabase = createClient()

  // Recupera campi e template
  const [{ data: fields }, { data: templates }] = await Promise.all([
    supabase
      .from("fields")
      .select("*")
      .eq("club_id", club.id)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("slot_templates")
      .select("*, fields(name, sport)")
      .eq("club_id", club.id)
      .order("day_of_week")
      .order("start_time"),
  ])

  return (
    <>
      <h1 className="font-display text-display-lg uppercase tracking-tight">
        Slot & Orari
      </h1>
      <p className="mt-1 text-muted-foreground">
        Configura gli orari disponibili per le prenotazioni
      </p>

      <div className="mt-8">
        <SlotManager
          clubId={club.id}
          fields={fields || []}
          templates={templates || []}
        />
      </div>
    </>
  )
}

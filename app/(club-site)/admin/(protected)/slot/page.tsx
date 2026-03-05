/**
 * Pagina gestione slot e template orari.
 * Griglia calendario settimanale con template personalizzabili e blocchi.
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

  // Recupera campi, template e blocchi
  const [{ data: fields }, { data: templates }, { data: blocks }] = await Promise.all([
    supabase
      .from("fields")
      .select("*")
      .eq("club_id", club.id)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("slot_templates")
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
          blocks={blocks || []}
        />
      </div>
    </>
  )
}

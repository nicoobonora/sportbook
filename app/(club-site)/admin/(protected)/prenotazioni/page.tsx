/**
 * Pagina gestione prenotazioni del pannello admin.
 * Vista calendario settimanale con prenotazioni colorate per stato.
 */
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getClubFromHeaders, getClubBasePath } from "@/lib/hooks/use-club"
import { BookingCalendar } from "@/components/admin/booking-calendar"

export const metadata: Metadata = {
  title: "Prenotazioni — Admin",
}

/** Calcola il lunedì (YYYY-MM-DD) della settimana che contiene la data fornita.
 *  Usa T12:00:00Z per evitare drift di timezone (Europe/Rome = UTC+1/+2). */
function getMondayStr(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr + "T12:00:00Z") : new Date()
  const day = dateStr ? date.getUTCDay() : date.getDay()
  const diff = (day + 6) % 7 // 0=lun, 6=dom
  const monday = new Date(date)
  if (dateStr) {
    monday.setUTCDate(date.getUTCDate() - diff)
  } else {
    monday.setDate(date.getDate() - diff)
  }
  // Format as YYYY-MM-DD without timezone conversion
  if (dateStr) {
    return monday.toISOString().split("T")[0]
  }
  const y = monday.getFullYear()
  const m = String(monday.getMonth() + 1).padStart(2, "0")
  const d = String(monday.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Aggiunge giorni a una data YYYY-MM-DD senza drift di timezone */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z")
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split("T")[0]
}

export default async function PrenotazioniPage({
  searchParams,
}: {
  searchParams: {
    settimana?: string
    campo?: string
  }
}) {
  const club = await getClubFromHeaders()
  if (!club) return null

  const supabase = createClient()

  // Calcola range settimanale (Lunedì → Domenica)
  const weekStart = getMondayStr(searchParams.settimana)
  const weekEnd = addDays(weekStart, 6)

  // Query prenotazioni per la settimana + lista campi in parallelo
  let query = supabase
    .from("bookings")
    .select("*, slots!inner(date, start_time, end_time), fields(id, name, sport)")
    .eq("club_id", club.id)
    .gte("slots.date", weekStart)
    .lte("slots.date", weekEnd)
    .order("created_at", { ascending: false })

  if (searchParams.campo) {
    query = query.eq("field_id", searchParams.campo)
  }

  const [{ data: bookings }, { data: fields }] = await Promise.all([
    query,
    supabase
      .from("fields")
      .select("id, name, sport")
      .eq("club_id", club.id)
      .eq("is_active", true)
      .order("sort_order"),
  ])

  return (
    <>
      <h1 className="font-display text-display-lg uppercase tracking-tight">
        Prenotazioni
      </h1>
      <p className="mt-1 text-muted-foreground">
        Gestisci le prenotazioni del circolo
      </p>

      <div className="mt-8">
        <BookingCalendar
          bookings={bookings || []}
          fields={fields || []}
          weekStart={weekStart}
          weekEnd={weekEnd}
          selectedFieldId={searchParams.campo || null}
          basePath={getClubBasePath()}
        />
      </div>
    </>
  )
}

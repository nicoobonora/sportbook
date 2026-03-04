/**
 * Pagina gestione prenotazioni del pannello admin.
 * Lista con filtri per stato, data, struttura e ricerca.
 */
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getClubFromHeaders } from "@/lib/hooks/use-club"
import { BookingList } from "@/components/admin/booking-list"

export const metadata: Metadata = {
  title: "Prenotazioni — Admin",
}

export default async function PrenotazioniPage({
  searchParams,
}: {
  searchParams: {
    stato?: string
    data?: string
    campo?: string
    cerca?: string
    pagina?: string
  }
}) {
  const club = await getClubFromHeaders()
  if (!club) return null

  const supabase = createClient()
  const currentPage = Math.max(1, parseInt(searchParams.pagina || "1", 10) || 1)
  const pageSize = 20
  const offset = (currentPage - 1) * pageSize

  // Costruisci la query con filtri
  let query = supabase
    .from("bookings")
    .select("*, slots(date, start_time, end_time), fields(id, name, sport)", {
      count: "exact",
    })
    .eq("club_id", club.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1)

  // Filtro per stato
  if (searchParams.stato && ["pending", "confirmed", "rejected", "cancelled"].includes(searchParams.stato)) {
    query = query.eq("status", searchParams.stato)
  }

  // Filtro per data (su slot)
  if (searchParams.data) {
    query = query.eq("slots.date", searchParams.data)
  }

  // Filtro per campo
  if (searchParams.campo) {
    query = query.eq("field_id", searchParams.campo)
  }

  // Ricerca per nome o email
  if (searchParams.cerca) {
    const search = `%${searchParams.cerca}%`
    query = query.or(`user_name.ilike.${search},user_email.ilike.${search}`)
  }

  const { data: bookings, count: totalCount } = await query
  const totalPages = Math.ceil((totalCount || 0) / pageSize)

  // Recupera lista campi per il filtro
  const { data: fields } = await supabase
    .from("fields")
    .select("id, name, sport")
    .eq("club_id", club.id)
    .eq("is_active", true)
    .order("sort_order")

  return (
    <>
      <h1 className="font-display text-display-lg uppercase tracking-tight">
        Prenotazioni
      </h1>
      <p className="mt-1 text-muted-foreground">
        Gestisci le prenotazioni del circolo
      </p>

      <div className="mt-8">
        <BookingList
          bookings={bookings || []}
          fields={fields || []}
          currentPage={currentPage}
          totalPages={totalPages}
          filters={searchParams}
        />
      </div>
    </>
  )
}

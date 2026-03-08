/**
 * API Route per prenotazioni create dall'admin del club.
 * POST /api/bookings/admin — Crea prenotazione diretta (status: confirmed)
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { adminBookingCreateSchema } from "@/lib/validations/booking"
import { computeAvailability, calculateBookingPrice } from "@/lib/scheduling/availability"

export async function POST(request: NextRequest) {
  // Verifica autenticazione
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
  }

  const body = await request.json()
  const validation = adminBookingCreateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dati non validi", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const data = validation.data
  const adminClient = createAdminClient()

  // Verifica che l'utente sia admin del club
  const { data: adminRecord } = await supabase
    .from("club_admins")
    .select("id")
    .eq("club_id", data.club_id)
    .eq("user_id", user.id)
    .single()

  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
  const isSuperAdmin = superAdminEmails.includes(user.email || "")

  if (!adminRecord && !isSuperAdmin) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  // Verifica che il club esista e sia attivo
  const { data: club } = await adminClient
    .from("clubs")
    .select("id, is_active, name")
    .eq("id", data.club_id)
    .single()

  if (!club || !club.is_active) {
    return NextResponse.json(
      { error: "Circolo non trovato o non attivo" },
      { status: 404 }
    )
  }

  // Verifica start_time < end_time
  if (data.start_time >= data.end_time) {
    return NextResponse.json(
      { error: "L'orario di inizio deve essere prima dell'orario di fine" },
      { status: 400 }
    )
  }

  const dateObj = new Date(data.date + "T12:00:00Z")
  const dayOfWeek = dateObj.getUTCDay()

  // Fetch dati per controllo disponibilità
  const [{ data: openingHours }, { data: blocks }, { data: existingBookings }] = await Promise.all([
    adminClient
      .from("opening_hours")
      .select("start_time, end_time, price_per_hour_cents")
      .eq("club_id", data.club_id)
      .eq("field_id", data.field_id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true),
    adminClient
      .from("slot_blocks")
      .select("block_type, block_date, day_of_week, start_time, end_time, reason")
      .eq("club_id", data.club_id)
      .eq("field_id", data.field_id)
      .or(`block_date.eq.${data.date},day_of_week.eq.${dayOfWeek}`),
    adminClient
      .from("bookings")
      .select("id, start_time, end_time, status, user_name")
      .eq("club_id", data.club_id)
      .eq("field_id", data.field_id)
      .eq("date", data.date)
      .in("status", ["confirmed", "pending"]),
  ])

  if (!openingHours || openingHours.length === 0) {
    return NextResponse.json(
      { error: "Nessun orario di apertura configurato per questa data" },
      { status: 400 }
    )
  }

  // Verifica disponibilità
  const availability = computeAvailability(
    openingHours,
    blocks || [],
    (existingBookings || []).map((b) => ({
      id: b.id,
      start_time: b.start_time || "00:00",
      end_time: b.end_time || "00:00",
      status: b.status,
      user_name: b.user_name,
    })),
    data.date,
    dayOfWeek,
  )

  const requestedRange = { start: data.start_time, end: data.end_time }
  const isAvailable = availability.availableWindows.some(
    (w) => w.start <= requestedRange.start && w.end >= requestedRange.end
  )

  if (!isAvailable) {
    return NextResponse.json(
      { error: "L'orario selezionato non è disponibile." },
      { status: 409 }
    )
  }

  // Calcola prezzo
  const priceCents = calculateBookingPrice(data.start_time, data.end_time, openingHours)

  // Crea prenotazione direttamente come "confirmed" (no email verification)
  const { data: booking, error: insertError } = await adminClient
    .from("bookings")
    .insert({
      club_id: data.club_id,
      field_id: data.field_id,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      price_cents: priceCents,
      user_name: data.user_name,
      user_email: data.user_email || "",
      user_phone: data.user_phone || "",
      notes: data.notes || null,
      status: "confirmed",
    })
    .select()
    .single()

  if (insertError) {
    console.error("[ADMIN BOOKING] Errore inserimento:", insertError)
    return NextResponse.json(
      { error: "Errore durante la creazione della prenotazione." },
      { status: 500 }
    )
  }

  return NextResponse.json(booking, { status: 201 })
}

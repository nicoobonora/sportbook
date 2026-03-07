/**
 * API Route per calcolare la disponibilità di un campo.
 * GET /api/availability?club_id=...&field_id=...&date=YYYY-MM-DD
 *
 * Restituisce le finestre disponibili calcolate dinamicamente da:
 * 1. Fasce di apertura (opening_hours)
 * 2. Blocchi admin (slot_blocks)
 * 3. Prenotazioni esistenti (bookings)
 */
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { computeAvailability, generateStartTimes } from "@/lib/scheduling/availability"
import { z } from "zod"

const querySchema = z.object({
  club_id: z.string().uuid(),
  field_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const validation = querySchema.safeParse(params)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Parametri non validi" },
      { status: 400 }
    )
  }

  const { club_id, field_id, date } = validation.data
  const supabase = createAdminClient()

  const dateObj = new Date(date + "T12:00:00Z")
  const dayOfWeek = dateObj.getUTCDay()

  // Fetch opening hours, blocks, and bookings in parallel
  const [{ data: openingHours }, { data: blocks }, { data: bookings }] = await Promise.all([
    supabase
      .from("opening_hours")
      .select("start_time, end_time, price_per_hour_cents")
      .eq("club_id", club_id)
      .eq("field_id", field_id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .order("start_time"),
    supabase
      .from("slot_blocks")
      .select("block_type, block_date, day_of_week, start_time, end_time, reason")
      .eq("club_id", club_id)
      .eq("field_id", field_id)
      .or(`block_date.eq.${date},day_of_week.eq.${dayOfWeek}`),
    supabase
      .from("bookings")
      .select("id, start_time, end_time, status, user_name")
      .eq("club_id", club_id)
      .eq("field_id", field_id)
      .eq("date", date)
      .in("status", ["confirmed", "pending"]),
  ])

  // Se non ci sono opening hours, restituisci vuoto
  if (!openingHours || openingHours.length === 0) {
    return NextResponse.json({
      openingRanges: [],
      bookings: [],
      blocks: [],
      availableWindows: [],
      startTimes: [],
      openingHoursData: [],
    })
  }

  const availability = computeAvailability(
    openingHours,
    blocks || [],
    (bookings || []).map((b) => ({
      id: b.id,
      start_time: b.start_time || "00:00",
      end_time: b.end_time || "00:00",
      status: b.status,
      user_name: b.user_name,
    })),
    date,
    dayOfWeek,
  )

  // Genera gli start times selezionabili
  const startTimes = generateStartTimes(availability.availableWindows)

  return NextResponse.json({
    ...availability,
    startTimes,
    openingHoursData: openingHours,
  })
}

/**
 * API Route per recuperare gli slot disponibili.
 * GET /api/slots?club_id=...&field_id=...&date=YYYY-MM-DD
 *
 * Prima di restituire gli slot, genera quelli mancanti
 * dai template settimanali (generazione on-demand).
 */
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
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

  // Genera slot on-demand per questa data se non esistono ancora
  await generateSlotsForDate(supabase, club_id, field_id, date)

  // Recupera gli slot disponibili per la data specificata
  const { data: slots, error } = await supabase
    .from("slots")
    .select("*")
    .eq("club_id", club_id)
    .eq("field_id", field_id)
    .eq("date", date)
    .eq("is_blocked", false)
    .order("start_time", { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: "Errore nel recupero degli slot" },
      { status: 500 }
    )
  }

  return NextResponse.json(slots)
}

/**
 * Genera slot per una data specifica partendo dai template settimanali.
 * Inserisce solo slot che non esistono già (ON CONFLICT DO NOTHING).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateSlotsForDate(supabase: any, clubId: string, fieldId: string, dateStr: string) {
  const date = new Date(dateStr)
  const dayOfWeek = date.getDay() // 0=domenica, 6=sabato

  // Recupera i template attivi per questo giorno della settimana e campo
  const { data: templates } = await supabase
    .from("slot_templates")
    .select("*")
    .eq("club_id", clubId)
    .eq("field_id", fieldId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)

  if (!templates || templates.length === 0) return

  // Inserisci gli slot (ignora duplicati grazie al UNIQUE constraint)
  const slotsToInsert = templates.map((t: { start_time: string; end_time: string; price_cents: number; max_bookings: number }) => ({
    club_id: clubId,
    field_id: fieldId,
    date: dateStr,
    start_time: t.start_time,
    end_time: t.end_time,
    price_cents: t.price_cents,
    max_bookings: t.max_bookings,
  }))

  await supabase
    .from("slots")
    .upsert(slotsToInsert, {
      onConflict: "field_id,date,start_time",
      ignoreDuplicates: true,
    })
}

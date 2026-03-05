/**
 * API Route per recuperare gli slot disponibili.
 * GET /api/slots?club_id=...&field_id=...&date=YYYY-MM-DD
 *
 * Usa la logica di risoluzione: default → custom template → blocchi.
 * Genera on-demand gli slot mancanti prima di restituirli.
 */
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveSlots } from "@/lib/scheduling/resolve-slots"
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
 * Genera slot per una data specifica usando la logica di risoluzione:
 * 1. Template personalizzati per field+day → altrimenti default (09:00–19:00, 1hr)
 * 2. Filtra i blocchi (single_date e recurring)
 * 3. Upsert degli slot risolti + marca come bloccati quelli esistenti
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateSlotsForDate(supabase: any, clubId: string, fieldId: string, dateStr: string) {
  const date = new Date(dateStr)
  const dayOfWeek = date.getDay() // 0=domenica, 6=sabato

  // Recupera template e blocchi in parallelo
  const [{ data: templates }, { data: blocks }] = await Promise.all([
    supabase
      .from("slot_templates")
      .select("start_time, end_time, price_cents, max_bookings")
      .eq("club_id", clubId)
      .eq("field_id", fieldId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true),
    supabase
      .from("slot_blocks")
      .select("block_type, block_date, day_of_week, start_time, end_time")
      .eq("club_id", clubId)
      .eq("field_id", fieldId)
      .or(`block_date.eq.${dateStr},day_of_week.eq.${dayOfWeek}`),
  ])

  // Risolvi con la logica a 3 livelli
  const resolvedSlots = resolveSlots(
    dateStr,
    dayOfWeek,
    templates || [],
    blocks || [],
  )

  if (resolvedSlots.length > 0) {
    const slotsToInsert = resolvedSlots.map((s) => ({
      club_id: clubId,
      field_id: fieldId,
      date: dateStr,
      start_time: s.start_time,
      end_time: s.end_time,
      price_cents: s.price_cents,
      max_bookings: s.max_bookings,
    }))

    await supabase
      .from("slots")
      .upsert(slotsToInsert, {
        onConflict: "field_id,date,start_time",
        ignoreDuplicates: true,
      })
  }

  // Marca come bloccati gli slot già esistenti che cadono in un blocco
  const applicableBlocks = (blocks || []).filter(
    (b: { block_type: string; block_date: string | null; day_of_week: number | null }) =>
      (b.block_type === "single_date" && b.block_date === dateStr) ||
      (b.block_type === "recurring" && b.day_of_week === dayOfWeek)
  )

  for (const block of applicableBlocks) {
    let query = supabase
      .from("slots")
      .update({ is_blocked: true })
      .eq("field_id", fieldId)
      .eq("date", dateStr)
      .eq("current_bookings", 0) // non bloccare slot con prenotazioni attive

    if (block.start_time && block.end_time) {
      query = query.gte("start_time", block.start_time).lt("start_time", block.end_time)
    }

    await query
  }
}

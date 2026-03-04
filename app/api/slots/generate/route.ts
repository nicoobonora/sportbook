/**
 * API Route per generare slot da template per le prossime N settimane.
 * POST /api/slots/generate { club_id, weeks? }
 * Richiede autenticazione come club-admin o super-admin.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const bodySchema = z.object({
  club_id: z.string().uuid(),
  weeks: z.number().min(1).max(12).default(4),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
  }

  const body = await request.json()
  const validation = bodySchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Parametri non validi" },
      { status: 400 }
    )
  }

  const { club_id, weeks } = validation.data

  // Chiama la funzione DB che genera gli slot
  const { data, error } = await supabase.rpc("generate_slots_from_templates", {
    p_club_id: club_id,
    p_weeks: weeks,
  })

  if (error) {
    return NextResponse.json(
      { error: "Errore nella generazione degli slot" },
      { status: 500 }
    )
  }

  return NextResponse.json({ generated: data })
}

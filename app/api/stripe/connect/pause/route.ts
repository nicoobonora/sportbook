import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * PATCH /api/stripe/connect/pause
 * Mette in pausa o riattiva i pagamenti online per un circolo.
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    }

    const body = await req.json()
    const { club_id, paused } = body

    if (!club_id || typeof paused !== "boolean") {
      return NextResponse.json(
        { error: "Parametri non validi: club_id (string) e paused (boolean) richiesti" },
        { status: 400 }
      )
    }

    // Verifica che l'utente sia admin del club
    const { data: isAdmin } = await supabase.rpc("is_club_admin", { p_club_id: club_id })
    if (!isAdmin) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    const adminClient = createAdminClient()

    const { error: updateError } = await adminClient
      .from("stripe_connect_accounts")
      .update({
        payments_paused: paused,
        updated_at: new Date().toISOString(),
      })
      .eq("club_id", club_id)

    if (updateError) {
      console.error("[Connect Pause] Errore aggiornamento:", updateError)
      return NextResponse.json(
        { error: "Errore durante l'aggiornamento" },
        { status: 500 }
      )
    }

    return NextResponse.json({ payments_paused: paused })
  } catch (error) {
    console.error("[Connect Pause] Errore:", error)
    return NextResponse.json(
      { error: "Errore nel processamento della richiesta" },
      { status: 500 }
    )
  }
}

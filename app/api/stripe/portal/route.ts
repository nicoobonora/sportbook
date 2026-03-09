import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const portalSchema = z.object({
  clubId: z.string().uuid(),
})

/**
 * Ricava l'origin (schema + host) dalla request.
 */
function getOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin")
  if (origin) return origin
  const referer = req.headers.get("referer")
  if (referer) {
    try { return new URL(referer).origin } catch {}
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "https://prenotauncampetto.it"
}

/**
 * POST /api/stripe/portal
 * Genera un link al Stripe Customer Portal per gestire l'abbonamento.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = portalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dati non validi", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { clubId } = parsed.data

    const { data: isAdmin } = await supabase.rpc("is_club_admin", { p_club_id: clubId })
    if (!isAdmin) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { data: club } = await adminClient
      .from("clubs")
      .select("stripe_customer_id")
      .eq("id", clubId)
      .single()

    if (!club?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Nessun abbonamento attivo. Attiva prima un piano." },
        { status: 400 }
      )
    }

    const origin = getOrigin(req)

    const session = await stripe.billingPortal.sessions.create({
      customer: club.stripe_customer_id,
      return_url: `${origin}/admin/impostazioni?tab=abbonamento`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[Stripe Portal] Errore:", error)
    return NextResponse.json(
      { error: "Errore nella creazione del portale" },
      { status: 500 }
    )
  }
}

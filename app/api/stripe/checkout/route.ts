import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { stripe } from "@/lib/stripe"
import { PLAN } from "@/lib/stripe/plans"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const checkoutSchema = z.object({
  planType: z.literal("pro"),
  clubId: z.string().uuid(),
})

/**
 * Ricava l'origin (schema + host) dalla request.
 * Es: "https://circolo-di-prova-bologna.prenotauncampetto.it"
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
 * POST /api/stripe/checkout
 * Crea una Stripe Checkout Session per sottoscrivere il piano Pro.
 * Richiede autenticazione come admin del circolo.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verifica autenticazione
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    }

    // 2. Parse e valida body
    const body = await req.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dati non validi", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { clubId } = parsed.data

    // 3. Verifica che l'utente sia admin del circolo
    const { data: isAdmin } = await supabase.rpc("is_club_admin", { p_club_id: clubId })
    if (!isAdmin) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    // 4. Recupera o crea Stripe Customer
    const adminClient = createAdminClient()
    const { data: club } = await adminClient
      .from("clubs")
      .select("id, name, slug, email, stripe_customer_id")
      .eq("id", clubId)
      .single()

    if (!club) {
      return NextResponse.json({ error: "Circolo non trovato" }, { status: 404 })
    }

    let stripeCustomerId = club.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: club.email || user.email || undefined,
        name: club.name,
        metadata: { club_id: clubId },
      })
      stripeCustomerId = customer.id

      await adminClient
        .from("clubs")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", clubId)
    }

    // 5. Crea Checkout Session
    const origin = getOrigin(req)

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: PLAN.stripePriceId, quantity: 1 }],
      success_url: `${origin}/admin/impostazioni?tab=abbonamento&checkout=success`,
      cancel_url: `${origin}/admin/impostazioni?tab=abbonamento&checkout=cancel`,
      metadata: {
        club_id: clubId,
        plan_type: "pro",
      },
      subscription_data: {
        metadata: {
          club_id: clubId,
          plan_type: "pro",
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error("[Stripe Checkout] Errore:", error)
    const message = error instanceof Error ? error.message : "Errore sconosciuto"
    return NextResponse.json(
      { error: `Errore nella creazione della sessione di checkout: ${message}` },
      { status: 500 }
    )
  }
}

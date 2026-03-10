import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { stripe } from "@/lib/stripe"
import { PLAN } from "@/lib/stripe/plans"
import { verifySuperAdmin } from "@/lib/auth/verify-super-admin"

const trialSchema = z.object({
  clubId: z.string().uuid(),
})

/**
 * POST /api/stripe/trial
 * Avvia un trial Pro di 30 giorni per un circolo (solo super-admin).
 * Crea una Stripe Subscription con trial_period_days senza richiedere carta.
 * Il webhook customer.subscription.created gestirà l'aggiornamento del DB.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verifica super-admin
    const { error: authError, status: authStatus, admin } = await verifySuperAdmin()
    if (authError || !admin) {
      return NextResponse.json({ error: authError }, { status: authStatus })
    }

    // 2. Parse body
    const body = await req.json()
    const parsed = trialSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dati non validi", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { clubId } = parsed.data

    // 3. Recupera club
    const { data: club } = await admin
      .from("clubs")
      .select("id, name, email, stripe_customer_id, stripe_plan_type")
      .eq("id", clubId)
      .single()

    if (!club) {
      return NextResponse.json({ error: "Circolo non trovato" }, { status: 404 })
    }

    // 4. Verifica che non abbia già un piano attivo
    if (club.stripe_plan_type === "pro") {
      return NextResponse.json(
        { error: "Il circolo ha già un piano Pro attivo" },
        { status: 400 }
      )
    }

    // 5. Verifica che non abbia già una subscription attiva o in trial
    const { data: existingSub } = await admin
      .from("stripe_subscriptions")
      .select("id, status")
      .eq("club_id", clubId)
      .in("status", ["active", "trialing"])
      .maybeSingle()

    if (existingSub) {
      return NextResponse.json(
        { error: "Il circolo ha già una subscription attiva o in prova" },
        { status: 400 }
      )
    }

    // 6. Recupera o crea Stripe Customer
    let stripeCustomerId = club.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: club.email || undefined,
        name: club.name,
        metadata: { club_id: clubId },
      })
      stripeCustomerId = customer.id

      await admin
        .from("clubs")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", clubId)
    }

    // 7. Crea Subscription con trial di 30 giorni senza carta
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: PLAN.stripePriceId }],
      trial_period_days: 30,
      payment_behavior: "default_incomplete",
      trial_settings: {
        end_behavior: {
          missing_payment_method: "cancel",
        },
      },
      metadata: {
        club_id: clubId,
        plan_type: "pro",
      },
    })

    console.log(`[Trial] Subscription creata per club ${clubId}: ${subscription.id} (status: ${subscription.status})`)

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    })
  } catch (error: unknown) {
    console.error("[Trial] Errore:", error)
    const message = error instanceof Error ? error.message : "Errore sconosciuto"
    return NextResponse.json(
      { error: `Errore nella creazione del trial: ${message}` },
      { status: 500 }
    )
  }
}

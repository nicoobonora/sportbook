import { NextRequest, NextResponse } from "next/server"
import { verifyWebhookSignature } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { PLANS } from "@/lib/stripe/plans"
import type Stripe from "stripe"

/**
 * POST /api/stripe/webhooks/subscriptions
 * Gestisce eventi webhook Stripe relativi agli abbonamenti.
 *
 * IMPORTANTE: Questa route NON deve avere middleware di autenticazione.
 * L'autenticazione avviene tramite la firma del webhook Stripe.
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Firma mancante" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS!
    )
  } catch (err) {
    console.error("[Webhook Sub] Firma non valida:", err)
    return NextResponse.json({ error: "Firma non valida" }, { status: 400 })
  }

  const adminClient = createAdminClient()

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const clubId = subscription.metadata.club_id
        const planType = subscription.metadata.plan_type as "starter" | "pro" | "business"

        if (!clubId) {
          console.error("[Webhook Sub] club_id mancante nei metadata")
          break
        }

        // Ricava current_period_end dal primo item (Stripe API 2025-03-31+)
        const firstItem = subscription.items?.data?.[0]
        const periodEnd = firstItem?.current_period_end
          ? new Date(firstItem.current_period_end * 1000).toISOString()
          : null

        // Upsert stripe_subscriptions
        await adminClient
          .from("stripe_subscriptions")
          .upsert(
            {
              club_id: clubId,
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              plan_type: planType || "starter",
              status: subscription.status as "active" | "past_due" | "canceled" | "trialing" | "incomplete" | "incomplete_expired",
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" }
          )

        // Aggiorna club con piano e limiti
        const plan = PLANS[planType || "starter"]
        await adminClient
          .from("clubs")
          .update({
            stripe_plan_type: planType || "starter",
            max_fields: plan?.maxFields === -1 ? 999 : (plan?.maxFields || 2),
            updated_at: new Date().toISOString(),
          })
          .eq("id", clubId)

        console.log(`[Webhook Sub] Subscription ${subscription.status} per club ${clubId}, piano: ${planType}`)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const clubId = subscription.metadata.club_id

        if (!clubId) break

        // Aggiorna stato subscription
        await adminClient
          .from("stripe_subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)

        // Reset piano del circolo
        await adminClient
          .from("clubs")
          .update({
            stripe_plan_type: "none",
            max_fields: 2,
            updated_at: new Date().toISOString(),
          })
          .eq("id", clubId)

        console.log(`[Webhook Sub] Subscription cancellata per club ${clubId}`)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.parent?.subscription_details?.subscription
        if (!subscriptionId) break

        await adminClient
          .from("stripe_subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId)

        console.log(`[Webhook Sub] Pagamento fallito per subscription ${subscriptionId}`)
        break
      }

      default:
        console.log(`[Webhook Sub] Evento non gestito: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Webhook Sub] Errore nel processamento:", error)
    return NextResponse.json(
      { error: "Errore nel processamento del webhook" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { verifyWebhookSignature } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import type Stripe from "stripe"

/**
 * Helper: estrae un ID stringa da un campo Stripe che può essere
 * string | Object | null (es. charge.payment_intent).
 */
function extractId(field: string | { id: string } | null | undefined): string | null {
  if (!field) return null
  if (typeof field === "string") return field
  return field.id
}

/**
 * POST /api/stripe/webhooks/payments
 * Gestisce eventi webhook Stripe relativi ai pagamenti delle prenotazioni.
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
      process.env.STRIPE_WEBHOOK_SECRET_PAYMENTS!
    )
  } catch (err) {
    console.error("[Webhook Pay] Firma non valida:", err)
    return NextResponse.json({ error: "Firma non valida" }, { status: 400 })
  }

  const adminClient = createAdminClient()

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bookingId = paymentIntent.metadata.booking_id

        if (!bookingId) {
          console.error("[Webhook Pay] booking_id mancante nei metadata")
          break
        }

        // Aggiorna stripe_payments
        await adminClient
          .from("stripe_payments")
          .update({ status: "succeeded" })
          .eq("stripe_payment_intent_id", paymentIntent.id)

        // Aggiorna booking: pagato + auto-conferma
        await adminClient
          .from("bookings")
          .update({
            payment_status: "paid",
            paid_at: new Date().toISOString(),
            status: "confirmed",
            confirmed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId)

        console.log(`[Webhook Pay] Pagamento riuscito per booking ${bookingId}`)
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bookingId = paymentIntent.metadata.booking_id

        if (!bookingId) break

        await adminClient
          .from("stripe_payments")
          .update({ status: "failed" })
          .eq("stripe_payment_intent_id", paymentIntent.id)

        await adminClient
          .from("bookings")
          .update({
            payment_status: "unpaid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId)

        console.log(`[Webhook Pay] Pagamento fallito per booking ${bookingId}`)
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        // payment_intent può essere string | PaymentIntent | null
        const paymentIntentId = extractId(charge.payment_intent as string | { id: string } | null)

        if (!paymentIntentId) break

        await adminClient
          .from("stripe_payments")
          .update({ status: "refunded" })
          .eq("stripe_payment_intent_id", paymentIntentId)

        // Trova il booking e aggiorna lo stato pagamento
        const { data: payment } = await adminClient
          .from("stripe_payments")
          .select("booking_id")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .single()

        if (payment) {
          await adminClient
            .from("bookings")
            .update({
              payment_status: "refunded",
              updated_at: new Date().toISOString(),
            })
            .eq("id", payment.booking_id)
        }

        console.log(`[Webhook Pay] Rimborso per payment_intent ${paymentIntentId}`)
        break
      }

      default:
        console.log(`[Webhook Pay] Evento non gestito: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Webhook Pay] Errore nel processamento:", error)
    return NextResponse.json(
      { error: "Errore nel processamento del webhook" },
      { status: 500 }
    )
  }
}

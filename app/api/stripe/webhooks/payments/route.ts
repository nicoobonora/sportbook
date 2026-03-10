import { NextRequest, NextResponse } from "next/server"
import { verifyWebhookSignature } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { Resend } from "resend"
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
            email_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId)

        console.log(`[Webhook Pay] Pagamento riuscito per booking ${bookingId}`)

        // Recupera i dati completi della prenotazione per le notifiche email
        const { data: booking } = await adminClient
          .from("bookings")
          .select("id, club_id, field_id, user_name, user_email, user_phone, date, start_time, end_time, notes")
          .eq("id", bookingId)
          .single()

        if (booking) {
          // Invia notifica all'admin del club
          try {
            await sendBookingNotificationToClub(adminClient, booking)
          } catch (err) {
            console.error("[Webhook Pay] Errore invio email notifica admin:", err)
          }

          // Invia email di conferma all'utente
          if (booking.user_email) {
            try {
              await sendPaymentConfirmationToUser(adminClient, booking)
            } catch (err) {
              console.error("[Webhook Pay] Errore invio email conferma utente:", err)
            }
          }
        }
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

// ── Funzioni invio email ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendBookingNotificationToClub(adminClient: any, booking: any) {
  const { data: club } = await adminClient
    .from("clubs")
    .select("name, email")
    .eq("id", booking.club_id)
    .single()

  if (!club?.email) return

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.log("[Webhook Pay] Email notifica admin:", { club: club.name, booking: booking.id })
    return
  }

  const { data: field } = await adminClient
    .from("fields")
    .select("name")
    .eq("id", booking.field_id)
    .single()

  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from: "PrenotaUnCampetto <noreply@prenotauncampetto.it>",
    to: club.email,
    subject: `Nuova prenotazione pagata da ${booking.user_name} — ${club.name}`,
    text: [
      `Nuova prenotazione con pagamento online per ${club.name}`,
      "",
      `Nome: ${booking.user_name}`,
      `Email: ${booking.user_email}`,
      `Telefono: ${booking.user_phone}`,
      `Campo: ${field?.name || "—"}`,
      `Data: ${booking.date}`,
      `Orario: ${booking.start_time?.substring(0, 5)} - ${booking.end_time?.substring(0, 5)}`,
      booking.notes ? `Note: ${booking.notes}` : "",
      "",
      "Il pagamento è stato completato e la prenotazione è stata confermata automaticamente.",
    ].filter(Boolean).join("\n"),
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendPaymentConfirmationToUser(adminClient: any, booking: any) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.log("[Webhook Pay] Email conferma utente:", booking.user_email)
    return
  }

  const { data: club } = await adminClient
    .from("clubs")
    .select("name")
    .eq("id", booking.club_id)
    .single()

  const clubName = club?.name || "il circolo"

  const { data: field } = await adminClient
    .from("fields")
    .select("name")
    .eq("id", booking.field_id)
    .single()

  const fieldInfo = field ? `Campo: ${field.name}` : ""

  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from: "PrenotaUnCampetto <noreply@prenotauncampetto.it>",
    to: booking.user_email,
    subject: `Prenotazione confermata — ${clubName}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f6;padding:32px 0;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;max-width:480px;width:100%;">
  <tr><td style="background-color:#16A34A;padding:24px 32px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:20px;">PrenotaUnCampetto</h1>
  </td></tr>
  <tr><td style="padding:32px;">
    <h2 style="color:#111;margin:0 0 16px 0;font-size:22px;">Prenotazione confermata!</h2>
    <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 8px 0;">Ciao <strong>${booking.user_name}</strong>,</p>
    <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 20px 0;">Il pagamento è stato ricevuto e la tua prenotazione presso <strong>${clubName}</strong> è confermata.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:0 0 24px 0;">
      <tr><td style="padding:16px;">
        <p style="margin:0 0 4px 0;font-size:14px;color:#333;"><strong>Data:</strong> ${booking.date}</p>
        <p style="margin:0 0 4px 0;font-size:14px;color:#333;"><strong>Orario:</strong> ${booking.start_time?.substring(0, 5)} - ${booking.end_time?.substring(0, 5)}</p>
        ${fieldInfo ? `<p style="margin:0;font-size:14px;color:#333;"><strong>${fieldInfo}</strong></p>` : ""}
      </td></tr>
    </table>
    <p style="color:#333;font-size:15px;line-height:1.5;margin:0;">Ti aspettiamo!</p>
  </td></tr>
  <tr><td style="padding:16px 32px;border-top:1px solid #eee;">
    <p style="color:#aaa;font-size:12px;margin:0;text-align:center;">PrenotaUnCampetto — Prenota il tuo campo sportivo</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
  })
}

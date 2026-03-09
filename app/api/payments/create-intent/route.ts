import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { stripe, calculateApplicationFee } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"

const createIntentSchema = z.object({
  bookingId: z.string().uuid(),
})

/**
 * POST /api/payments/create-intent
 * Crea un PaymentIntent per una prenotazione.
 * Il pagamento va al circolo (Connect), la piattaforma trattiene una fee.
 *
 * NON richiede autenticazione utente — la prenotazione è già stata creata
 * con i dati dell'utente (nome, email, telefono).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createIntentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dati non validi", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { bookingId } = parsed.data

    const adminClient = createAdminClient()

    // 1. Recupera la prenotazione
    const { data: booking, error: bookingError } = await adminClient
      .from("bookings")
      .select("id, club_id, price_cents, payment_status, stripe_payment_intent_id, user_email, user_name")
      .eq("id", bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Prenotazione non trovata" }, { status: 404 })
    }

    if (booking.payment_status === "paid") {
      return NextResponse.json({ error: "Prenotazione già pagata" }, { status: 400 })
    }

    // Se esiste già un PaymentIntent, restituisci il client_secret
    if (booking.stripe_payment_intent_id) {
      const existingIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
      if (existingIntent.status !== "canceled") {
        return NextResponse.json({
          clientSecret: existingIntent.client_secret,
          amount: existingIntent.amount,
        })
      }
    }

    // 2. Recupera l'account Connect del circolo
    const { data: connectAccount } = await adminClient
      .from("stripe_connect_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("club_id", booking.club_id)
      .single()

    if (!connectAccount || !connectAccount.charges_enabled) {
      return NextResponse.json(
        { error: "Il circolo non ha attivato i pagamenti online" },
        { status: 400 }
      )
    }

    // 3. Calcola fee piattaforma
    const amountCents = booking.price_cents
    const applicationFeeCents = calculateApplicationFee(amountCents)

    // 4. Crea PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      application_fee_amount: applicationFeeCents,
      transfer_data: {
        destination: connectAccount.stripe_account_id,
      },
      metadata: {
        booking_id: bookingId,
        club_id: booking.club_id,
      },
      receipt_email: booking.user_email,
      description: `Prenotazione campo - ${booking.user_name}`,
    })

    // 5. Salva riferimento nella prenotazione e in stripe_payments
    await adminClient
      .from("bookings")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)

    await adminClient.from("stripe_payments").insert({
      booking_id: bookingId,
      club_id: booking.club_id,
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: amountCents,
      application_fee_cents: applicationFeeCents,
      status: "pending",
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amountCents,
    })
  } catch (error) {
    console.error("[Create PaymentIntent] Errore:", error)
    return NextResponse.json(
      { error: "Errore nella creazione del pagamento" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { Resend } from "resend"

const schema = z.object({
  bookingId: z.string().uuid(),
})

/**
 * POST /api/bookings/send-verification
 * Invia l'email di verifica per una prenotazione.
 * Usato quando l'utente sceglie "Paga di persona" nel flusso di pagamento.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Dati non validi" }, { status: 400 })
    }
    const { bookingId } = parsed.data

    const adminClient = createAdminClient()

    const { data: booking } = await adminClient
      .from("bookings")
      .select("*, clubs(name)")
      .eq("id", bookingId)
      .single()

    if (!booking) {
      return NextResponse.json({ error: "Prenotazione non trovata" }, { status: 404 })
    }

    if (booking.status !== "unverified") {
      return NextResponse.json({ error: "Email già inviata" }, { status: 400 })
    }

    if (!booking.verification_token) {
      return NextResponse.json({ error: "Token di verifica mancante" }, { status: 400 })
    }

    const clubName = (booking.clubs as { name: string } | null)?.name || "il circolo"
    const resendApiKey = process.env.RESEND_API_KEY
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const verifyUrl = `${baseUrl}/api/bookings/verify?token=${booking.verification_token}`

    if (!resendApiKey) {
      console.log("[BOOKING] Email verifica (send-verification):", { to: booking.user_email, verifyUrl })
      return NextResponse.json({ sent: true })
    }

    const resend = new Resend(resendApiKey)

    await resend.emails.send({
      from: "PrenotaUnCampetto <noreply@prenotauncampetto.it>",
      to: booking.user_email,
      subject: `Conferma la tua prenotazione — ${clubName}`,
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
    <h2 style="color:#111;margin:0 0 16px 0;font-size:22px;">Conferma la tua prenotazione</h2>
    <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 8px 0;">Ciao <strong>${booking.user_name}</strong>,</p>
    <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 20px 0;">Hai richiesto una prenotazione presso <strong>${clubName}</strong>. Pagherai direttamente in struttura.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;border-radius:8px;margin:0 0 24px 0;">
      <tr><td style="padding:16px;">
        <p style="margin:0 0 4px 0;font-size:14px;color:#333;"><strong>Data:</strong> ${booking.date}</p>
        <p style="margin:0 0 4px 0;font-size:14px;color:#333;"><strong>Orario:</strong> ${booking.start_time?.substring(0, 5)} - ${booking.end_time?.substring(0, 5)}</p>
        <p style="margin:0;font-size:14px;color:#666;"><strong>Pagamento:</strong> di persona</p>
      </td></tr>
    </table>
    <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 24px 0;">Clicca il pulsante qui sotto per confermare:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table cellpadding="0" cellspacing="0">
          <tr><td align="center" bgcolor="#16A34A" style="border-radius:8px;">
            <a href="${verifyUrl}" target="_blank" style="display:block;padding:14px 40px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Conferma prenotazione</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
    <p style="color:#888;font-size:13px;line-height:1.5;margin:24px 0 0 0;">Se non hai richiesto questa prenotazione, ignora questa email.</p>
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

    return NextResponse.json({ sent: true })
  } catch (error) {
    console.error("[BOOKING] Errore send-verification:", error)
    return NextResponse.json({ error: "Errore nell'invio dell'email" }, { status: 500 })
  }
}

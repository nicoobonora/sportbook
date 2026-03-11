/**
 * API Route per inviare un codice OTP via Resend.
 * POST: genera codice 6 cifre, salva in otp_codes, invia email.
 * Rate limited: max 1 invio ogni 60 secondi per email.
 */
import { randomInt } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendOtpEmail } from "@/lib/email/send"

const sendOtpSchema = z.object({
  email: z.string().email("Email non valida"),
})

const OTP_EXPIRY_MINUTES = 10
const RATE_LIMIT_SECONDS = 60

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = sendOtpSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Email non valida" },
      { status: 400 }
    )
  }

  const { email } = validation.data
  const admin = createAdminClient()

  // Verifica che l'utente esista in Supabase Auth
  const {
    data: { users },
  } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })

  const userExists = users?.some((u) => u.email === email)

  if (!userExists) {
    // Non rivelare se l'utente esiste o meno (sicurezza)
    // Ma restituiamo comunque successo per non dare info
    return NextResponse.json({ sent: true })
  }

  // Rate limit: controlla ultimo OTP inviato per questa email
  const { data: recentOtp } = await admin
    .from("otp_codes")
    .select("created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (recentOtp) {
    const secondsAgo =
      (Date.now() - new Date(recentOtp.created_at).getTime()) / 1000
    if (secondsAgo < RATE_LIMIT_SECONDS) {
      return NextResponse.json(
        { error: "Attendi un minuto prima di richiedere un nuovo codice." },
        { status: 429 }
      )
    }
  }

  // Genera codice 6 cifre
  const code = String(randomInt(100000, 999999))

  // Invalida codici precedenti per questa email
  await admin
    .from("otp_codes")
    .update({ used: true })
    .eq("email", email)
    .eq("used", false)

  // Salva nuovo codice
  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  ).toISOString()

  const { error: insertError } = await admin
    .from("otp_codes")
    .insert({
      email,
      code,
      expires_at: expiresAt,
    })

  if (insertError) {
    console.error("[OTP] Insert error:", insertError)
    return NextResponse.json(
      { error: "Errore durante la generazione del codice" },
      { status: 500 }
    )
  }

  // Invia email via Resend
  try {
    await sendOtpEmail({ to: email, code })
  } catch (err) {
    console.error("[OTP] Email error:", err)
    return NextResponse.json(
      { error: "Errore durante l'invio dell'email" },
      { status: 500 }
    )
  }

  return NextResponse.json({ sent: true })
}

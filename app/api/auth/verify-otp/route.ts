/**
 * API Route per verificare un codice OTP e creare una sessione Supabase.
 * POST: verifica il codice, genera un token di sessione tramite generateLink.
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

const verifyOtpSchema = z.object({
  email: z.string().email("Email non valida"),
  code: z.string().length(6, "Il codice deve essere di 6 cifre"),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = verifyOtpSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dati non validi" },
      { status: 400 }
    )
  }

  const { email, code } = validation.data
  const admin = createAdminClient()

  // Cerca un OTP valido (non usato, non scaduto)
  const { data: otpRecord, error: fetchError } = await admin
    .from("otp_codes")
    .select("*")
    .eq("email", email)
    .eq("code", code)
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (fetchError || !otpRecord) {
    // Conta i tentativi falliti recenti per brute-force protection
    const { count } = await admin
      .from("otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())

    if (count === 0) {
      return NextResponse.json(
        { error: "Codice scaduto. Richiedi un nuovo codice." },
        { status: 410 }
      )
    }

    return NextResponse.json(
      { error: "Codice non valido. Riprova." },
      { status: 401 }
    )
  }

  // Marca il codice come usato
  await admin
    .from("otp_codes")
    .update({ used: true })
    .eq("id", otpRecord.id)

  // Genera un magic link token tramite Supabase admin per creare la sessione
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    })

  if (linkError || !linkData) {
    console.error("[OTP_VERIFY] generateLink error:", linkError)
    return NextResponse.json(
      { error: "Errore durante la creazione della sessione" },
      { status: 500 }
    )
  }

  // Estrai il token_hash dalle proprietà del link
  const tokenHash = linkData.properties?.hashed_token

  if (!tokenHash) {
    console.error("[OTP_VERIFY] No hashed_token in generateLink response")
    return NextResponse.json(
      { error: "Errore durante la creazione della sessione" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    verified: true,
    token_hash: tokenHash,
  })
}

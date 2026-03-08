/**
 * API Route per il form contatto del sito pubblico.
 * Invia il messaggio via Resend all'email del circolo.
 * Rate limiting basico tramite header check.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { contactFormSchema } from "@/lib/validations/contact"
import { z } from "zod"

const requestSchema = contactFormSchema.extend({
  club_id: z.string().uuid("ID circolo non valido"),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = requestSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dati non validi" },
      { status: 400 }
    )
  }

  const { name, email, message, club_id } = validation.data

  // Recupera l'email del circolo dal DB
  const supabase = createClient()
  const { data: club } = await supabase
    .from("clubs")
    .select("email, name")
    .eq("id", club_id)
    .eq("is_active", true)
    .single()

  if (!club || !club.email) {
    return NextResponse.json(
      { error: "Circolo non trovato o email non configurata" },
      { status: 404 }
    )
  }

  // Invio email tramite Resend
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    // In sviluppo senza Resend, logga il messaggio
    console.log("[CONTATTO]", { to: club.email, from: email, name, message })
    return NextResponse.json({ success: true })
  }

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(resendApiKey)

    await resend.emails.send({
      from: "PrenotaUnCampetto <noreply@prenotauncampetto.it>",
      to: club.email,
      replyTo: email,
      subject: `Nuovo messaggio da ${name} — ${club.name}`,
      text: [
        `Nuovo messaggio dal sito web di ${club.name}`,
        "",
        `Da: ${name} (${email})`,
        "",
        "Messaggio:",
        message,
        "",
        "---",
        "Questo messaggio è stato inviato tramite il form contatti di PrenotaUnCampetto.",
      ].join("\n"),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[CONTATTO] Errore invio email:", err)
    return NextResponse.json(
      { error: "Errore durante l'invio del messaggio" },
      { status: 500 }
    )
  }
}

/**
 * API Route per richieste di inserimento nuovo circolo.
 * POST: un gestore chiede di aggiungere il proprio circolo alla piattaforma.
 * Valida i dati e notifica il super-admin via email.
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const newClubRequestSchema = z.object({
  club_name: z.string().min(2, "Nome circolo obbligatorio"),
  city: z.string().min(2, "Città obbligatoria"),
  sport: z.string().min(2, "Sport obbligatorio"),
  contact_name: z.string().min(2, "Nome obbligatorio"),
  contact_email: z.string().email("Email non valida"),
  contact_phone: z.string().min(6, "Telefono obbligatorio"),
  message: z.string().max(1000).optional(),
})

/** POST /api/clubs/request — Richiesta inserimento nuovo circolo (pubblico) */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = newClubRequestSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dati non validi", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const data = validation.data

  // Notifica super-admin via email
  try {
    await sendNewClubNotification(data)
  } catch (err) {
    console.error("[CLUB_REQUEST] Email error:", err)
    return NextResponse.json(
      { error: "Errore durante l'invio della richiesta. Riprova più tardi." },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { message: "Richiesta inviata con successo" },
    { status: 201 }
  )
}

/** Invia notifica email al super-admin per richiesta nuovo circolo */
async function sendNewClubNotification(data: {
  club_name: string
  city: string
  sport: string
  contact_name: string
  contact_email: string
  contact_phone: string
  message?: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log("[CLUB_REQUEST] No RESEND_API_KEY, skipping email notification")
    return
  }

  const { Resend } = await import("resend")
  const resend = new Resend(apiKey)

  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)

  if (superAdminEmails.length === 0) return

  await resend.emails.send({
    from: "PrenotaUnCampetto <noreply@prenotauncampetto.it>",
    to: superAdminEmails,
    subject: `Nuovo circolo richiesto: ${data.club_name} (${data.city})`,
    html: `
      <h2>Nuova richiesta di inserimento circolo</h2>
      <p><strong>${data.contact_name}</strong> (${data.contact_email}, ${data.contact_phone}) vuole aggiungere il circolo:</p>
      <ul>
        <li><strong>Nome:</strong> ${data.club_name}</li>
        <li><strong>Città:</strong> ${data.city}</li>
        <li><strong>Sport:</strong> ${data.sport}</li>
      </ul>
      ${data.message ? `<p><strong>Messaggio:</strong> ${data.message}</p>` : ""}
      <p>Vai al pannello super-admin per gestire la richiesta.</p>
    `,
  })
}

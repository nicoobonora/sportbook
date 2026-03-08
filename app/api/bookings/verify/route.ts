/**
 * API Route per la verifica email delle prenotazioni.
 * GET /api/bookings/verify?token=UUID — Verifica l'email e attiva la prenotazione
 */
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.json(
      { error: "Token mancante" },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  // Cerca la prenotazione con questo token
  const { data: booking, error: fetchError } = await adminClient
    .from("bookings")
    .select("id, status, club_id, user_name, user_email, user_phone, field_id, date, start_time, end_time, notes, email_verified_at")
    .eq("verification_token", token)
    .single()

  if (fetchError || !booking) {
    // Redirect a pagina errore
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    return NextResponse.redirect(
      `${baseUrl}/conferma-prenotazione?status=invalid`
    )
  }

  // Già verificata
  if (booking.email_verified_at) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    return NextResponse.redirect(
      `${baseUrl}/conferma-prenotazione?status=already_verified`
    )
  }

  // Se il booking non è più in stato unverified (magari scaduto/cancellato)
  if (booking.status !== "unverified") {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    return NextResponse.redirect(
      `${baseUrl}/conferma-prenotazione?status=expired`
    )
  }

  // Verifica l'email e promuovi a "pending"
  const { error: updateError } = await adminClient
    .from("bookings")
    .update({
      status: "pending",
      email_verified_at: new Date().toISOString(),
    })
    .eq("id", booking.id)

  if (updateError) {
    console.error("[VERIFY] Errore aggiornamento:", updateError)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    return NextResponse.redirect(
      `${baseUrl}/conferma-prenotazione?status=error`
    )
  }

  // Invia notifica al club-admin ora che l'email è verificata
  sendBookingNotificationToClub(adminClient, booking).catch((err) =>
    console.error("[VERIFY] Errore invio email admin:", err)
  )

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  return NextResponse.redirect(
    `${baseUrl}/conferma-prenotazione?status=success`
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendBookingNotificationToClub(adminClient: any, booking: any) {
  // Recupera dati club
  const { data: club } = await adminClient
    .from("clubs")
    .select("name, email")
    .eq("id", booking.club_id)
    .single()

  if (!club?.email) return

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.log("[VERIFY] Email notifica admin:", { club: club.name, booking: booking.id })
    return
  }

  // Recupera nome campo
  const { data: field } = await adminClient
    .from("fields")
    .select("name")
    .eq("id", booking.field_id)
    .single()

  const { Resend } = await import("resend")
  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from: "PrenotaUnCampetto <noreply@prenotauncampetto.it>",
    to: club.email,
    subject: `Nuova prenotazione da ${booking.user_name} — ${club.name}`,
    text: [
      `Nuova prenotazione verificata per ${club.name}`,
      "",
      `Nome: ${booking.user_name}`,
      `Email: ${booking.user_email}`,
      `Telefono: ${booking.user_phone}`,
      `Campo: ${field?.name || "—"}`,
      `Data: ${booking.date}`,
      `Orario: ${booking.start_time?.substring(0, 5)} - ${booking.end_time?.substring(0, 5)}`,
      booking.notes ? `Note: ${booking.notes}` : "",
      "",
      "L'utente ha verificato la sua email. Accedi al pannello admin per confermare o rifiutare.",
    ].filter(Boolean).join("\n"),
  })
}

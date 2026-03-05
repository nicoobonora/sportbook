/**
 * API Route per le prenotazioni.
 * POST /api/bookings — Crea una nuova prenotazione (pubblico)
 * PATCH /api/bookings?id=UUID — Conferma/Rifiuta prenotazione (admin)
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { bookingCreateSchema, bookingActionSchema } from "@/lib/validations/booking"

/** POST — Crea una nuova prenotazione (non richiede autenticazione) */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = bookingCreateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dati non validi", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const data = validation.data
  const adminClient = createAdminClient()

  // Verifica che il club sia attivo
  const { data: club } = await adminClient
    .from("clubs")
    .select("id, is_active, email, name")
    .eq("id", data.club_id)
    .single()

  if (!club || !club.is_active) {
    return NextResponse.json(
      { error: "Circolo non trovato o non attivo" },
      { status: 404 }
    )
  }

  // Verifica che lo slot esista, non sia bloccato e abbia disponibilità
  const { data: slot } = await adminClient
    .from("slots")
    .select("*")
    .eq("id", data.slot_id)
    .eq("club_id", data.club_id)
    .eq("is_blocked", false)
    .single()

  if (!slot) {
    return NextResponse.json(
      { error: "Slot non trovato o non disponibile" },
      { status: 404 }
    )
  }

  if (slot.current_bookings >= slot.max_bookings) {
    return NextResponse.json(
      { error: "Lo slot selezionato non ha più disponibilità. Scegli un altro orario." },
      { status: 409 }
    )
  }

  // Crea la prenotazione
  const { data: booking, error: insertError } = await adminClient
    .from("bookings")
    .insert({
      club_id: data.club_id,
      slot_id: data.slot_id,
      field_id: data.field_id,
      user_name: data.user_name,
      user_email: data.user_email,
      user_phone: data.user_phone,
      notes: data.notes || null,
      status: "pending",
    })
    .select()
    .single()

  if (insertError) {
    console.error("[BOOKING] Errore inserimento:", insertError)
    return NextResponse.json(
      { error: "Errore durante la prenotazione. Riprova." },
      { status: 500 }
    )
  }

  // Invia email di notifica al club-admin (asincrona, non blocca la risposta)
  sendBookingNotification(club, booking, slot).catch((err) =>
    console.error("[BOOKING] Errore invio email admin:", err)
  )

  return NextResponse.json(booking, { status: 201 })
}

/** PATCH — Conferma o rifiuta una prenotazione (richiede autenticazione admin) */
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
  }

  const body = await request.json()
  const validation = bookingActionSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dati non validi" },
      { status: 400 }
    )
  }

  const { booking_id, action, rejection_reason } = validation.data

  // Recupera la prenotazione per verificare il club_id
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, slots(*)")
    .eq("id", booking_id)
    .single()

  if (!booking) {
    return NextResponse.json(
      { error: "Prenotazione non trovata" },
      { status: 404 }
    )
  }

  if (booking.status !== "pending") {
    return NextResponse.json(
      { error: "La prenotazione non è in stato di attesa" },
      { status: 400 }
    )
  }

  if (action === "confirm") {
    // Usa la funzione DB con optimistic locking
    const { data: success } = await supabase.rpc("confirm_booking", {
      p_booking_id: booking_id,
    })

    if (!success) {
      return NextResponse.json(
        { error: "Impossibile confermare: lo slot potrebbe essere esaurito" },
        { status: 409 }
      )
    }

    // Invio email conferma all'utente
    sendUserConfirmation(booking).catch((err) =>
      console.error("[BOOKING] Errore invio email conferma:", err)
    )

    return NextResponse.json({ status: "confirmed" })
  }

  if (action === "reject") {
    const { data: success } = await supabase.rpc("reject_booking", {
      p_booking_id: booking_id,
      p_reason: rejection_reason || undefined,
    })

    if (!success) {
      return NextResponse.json(
        { error: "Impossibile rifiutare la prenotazione" },
        { status: 500 }
      )
    }

    // Invio email rifiuto all'utente
    sendUserRejection(booking, rejection_reason || null).catch((err) =>
      console.error("[BOOKING] Errore invio email rifiuto:", err)
    )

    return NextResponse.json({ status: "rejected" })
  }

  return NextResponse.json({ error: "Azione non valida" }, { status: 400 })
}

// ── Funzioni invio email ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendBookingNotification(club: any, booking: any, slot: any) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey || !club.email) {
    console.log("[BOOKING] Email notifica admin:", { club: club.name, booking: booking.id })
    return
  }

  const { Resend } = await import("resend")
  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from: "SportBook <noreply@prenotauncampetto.it>",
    to: club.email,
    subject: `Nuova prenotazione da ${booking.user_name} — ${club.name}`,
    text: [
      `Nuova richiesta di prenotazione per ${club.name}`,
      "",
      `Nome: ${booking.user_name}`,
      `Email: ${booking.user_email}`,
      `Telefono: ${booking.user_phone}`,
      `Data: ${slot.date}`,
      `Orario: ${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`,
      booking.notes ? `Note: ${booking.notes}` : "",
      "",
      "Accedi al pannello admin per confermare o rifiutare.",
    ].filter(Boolean).join("\n"),
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendUserConfirmation(booking: any) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.log("[BOOKING] Email conferma utente:", booking.user_email)
    return
  }

  const { Resend } = await import("resend")
  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from: "SportBook <noreply@prenotauncampetto.it>",
    to: booking.user_email,
    subject: "La tua prenotazione è confermata!",
    text: [
      `Ciao ${booking.user_name},`,
      "",
      "La tua prenotazione è stata confermata!",
      "",
      `Data: ${booking.slots?.date || ""}`,
      `Orario: ${booking.slots?.start_time?.substring(0, 5) || ""} - ${booking.slots?.end_time?.substring(0, 5) || ""}`,
      "",
      "Ti aspettiamo!",
    ].join("\n"),
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendUserRejection(booking: any, reason: string | null) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.log("[BOOKING] Email rifiuto utente:", booking.user_email)
    return
  }

  const { Resend } = await import("resend")
  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from: "SportBook <noreply@prenotauncampetto.it>",
    to: booking.user_email,
    subject: "Prenotazione non disponibile",
    text: [
      `Ciao ${booking.user_name},`,
      "",
      "Purtroppo la tua prenotazione non è stata accettata.",
      reason ? `Motivo: ${reason}` : "",
      "",
      "Ti invitiamo a provare con un altro orario.",
    ].filter(Boolean).join("\n"),
  })
}

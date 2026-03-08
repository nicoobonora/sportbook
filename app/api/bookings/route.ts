/**
 * API Route per le prenotazioni.
 * POST /api/bookings — Crea una nuova prenotazione (pubblico)
 * PATCH /api/bookings?id=UUID — Conferma/Rifiuta prenotazione (admin)
 */
import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { bookingCreateSchema, bookingActionSchema } from "@/lib/validations/booking"
import { computeAvailability, calculateBookingPrice } from "@/lib/scheduling/availability"

/** POST — Crea una nuova prenotazione (non richiede autenticazione) */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = bookingCreateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dati non validi" },
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

  // Verifica che start_time < end_time
  if (data.start_time >= data.end_time) {
    return NextResponse.json(
      { error: "L'orario di inizio deve essere prima dell'orario di fine" },
      { status: 400 }
    )
  }

  const dateObj = new Date(data.date + "T12:00:00Z")
  const dayOfWeek = dateObj.getUTCDay()

  // Fetch opening hours, blocks, and existing bookings for availability check
  const [{ data: openingHours }, { data: blocks }, { data: existingBookings }] = await Promise.all([
    adminClient
      .from("opening_hours")
      .select("start_time, end_time, price_per_hour_cents")
      .eq("club_id", data.club_id)
      .eq("field_id", data.field_id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true),
    adminClient
      .from("slot_blocks")
      .select("block_type, block_date, day_of_week, start_time, end_time, reason")
      .eq("club_id", data.club_id)
      .eq("field_id", data.field_id)
      .or(`block_date.eq.${data.date},day_of_week.eq.${dayOfWeek}`),
    adminClient
      .from("bookings")
      .select("id, start_time, end_time, status, user_name")
      .eq("club_id", data.club_id)
      .eq("field_id", data.field_id)
      .eq("date", data.date)
      .in("status", ["confirmed", "pending"]),
  ])

  if (!openingHours || openingHours.length === 0) {
    return NextResponse.json(
      { error: "Nessun orario di apertura configurato per questa data" },
      { status: 400 }
    )
  }

  // Verifica disponibilità
  const availability = computeAvailability(
    openingHours,
    blocks || [],
    (existingBookings || []).map((b) => ({
      id: b.id,
      start_time: b.start_time || "00:00",
      end_time: b.end_time || "00:00",
      status: b.status,
      user_name: b.user_name,
    })),
    data.date,
    dayOfWeek,
  )

  // Verifica che l'intervallo richiesto cada in una finestra disponibile
  const requestedRange = { start: data.start_time, end: data.end_time }
  const isAvailable = availability.availableWindows.some(
    (w) => w.start <= requestedRange.start && w.end >= requestedRange.end
  )

  if (!isAvailable) {
    return NextResponse.json(
      { error: "L'orario selezionato non è disponibile. Scegli un altro orario." },
      { status: 409 }
    )
  }

  // Calcola il prezzo
  const priceCents = calculateBookingPrice(data.start_time, data.end_time, openingHours)

  // Genera token di verifica lato applicazione
  const verificationToken = randomUUID()

  // Crea la prenotazione come "unverified" — richiede conferma email
  const { data: booking, error: insertError } = await adminClient
    .from("bookings")
    .insert({
      club_id: data.club_id,
      field_id: data.field_id,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      price_cents: priceCents,
      user_name: data.user_name,
      user_email: data.user_email,
      user_phone: data.user_phone,
      notes: data.notes || null,
      status: "unverified",
      verification_token: verificationToken,
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

  // Invia email di verifica all'utente (asincrona, non blocca la risposta)
  sendVerificationEmail(booking, club.name).catch((err) =>
    console.error("[BOOKING] Errore invio email verifica:", err)
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

  // Recupera la prenotazione
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, fields(name, sport)")
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
    // Usa la funzione DB che verifica sovrapposizioni
    const { data: success } = await supabase.rpc("confirm_booking", {
      p_booking_id: booking_id,
    })

    if (!success) {
      return NextResponse.json(
        { error: "Impossibile confermare: fascia oraria già occupata" },
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
async function sendVerificationEmail(booking: any, clubName: string) {
  const resendApiKey = process.env.RESEND_API_KEY
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  const verifyUrl = `${baseUrl}/api/bookings/verify?token=${booking.verification_token}`

  if (!resendApiKey) {
    console.log("[BOOKING] Email verifica:", {
      to: booking.user_email,
      verifyUrl,
    })
    return
  }

  const { Resend } = await import("resend")
  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from: "PrenotaUnCampetto <noreply@prenotauncampetto.it>",
    to: booking.user_email,
    subject: `Conferma la tua prenotazione — ${clubName}`,
    html: [
      `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">`,
      `<h2 style="color: #111;">Conferma la tua prenotazione</h2>`,
      `<p>Ciao <strong>${booking.user_name}</strong>,</p>`,
      `<p>Hai richiesto una prenotazione presso <strong>${clubName}</strong>:</p>`,
      `<div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">`,
      `<p style="margin: 4px 0;"><strong>Data:</strong> ${booking.date}</p>`,
      `<p style="margin: 4px 0;"><strong>Orario:</strong> ${booking.start_time?.substring(0, 5)} - ${booking.end_time?.substring(0, 5)}</p>`,
      `</div>`,
      `<p>Per completare la prenotazione, clicca il pulsante qui sotto:</p>`,
      `<div style="text-align: center; margin: 24px 0;">`,
      `<a href="${verifyUrl}" style="background: #16A34A; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">`,
      `Conferma prenotazione`,
      `</a>`,
      `</div>`,
      `<p style="color: #666; font-size: 13px;">Se non hai richiesto questa prenotazione, ignora questa email.</p>`,
      `<hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />`,
      `<p style="color: #999; font-size: 12px;">PrenotaUnCampetto — Prenota il tuo campo sportivo</p>`,
      `</div>`,
    ].join("\n"),
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
      `Data: ${booking.date || ""}`,
      `Orario: ${booking.start_time?.substring(0, 5) || ""} - ${booking.end_time?.substring(0, 5) || ""}`,
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

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
import { Resend } from "resend"

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

  // Invia email di verifica all'utente — await per evitare che Vercel termini la funzione
  try {
    await sendVerificationEmail(booking, club.name)
  } catch (err) {
    console.error("[BOOKING] Errore invio email verifica:", err)
    // Non blocchiamo la prenotazione se l'email fallisce
  }

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

    // Invio email conferma all'utente — await per evitare che Vercel termini la funzione
    try {
      await sendUserConfirmation(booking)
    } catch (err) {
      console.error("[BOOKING] Errore invio email conferma:", err)
    }

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

    // Invio email rifiuto all'utente — await per evitare che Vercel termini la funzione
    try {
      await sendUserRejection(booking, rejection_reason || null)
    } catch (err) {
      console.error("[BOOKING] Errore invio email rifiuto:", err)
    }

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
    <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 20px 0;">Hai richiesto una prenotazione presso <strong>${clubName}</strong>:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;border-radius:8px;margin:0 0 24px 0;">
      <tr><td style="padding:16px;">
        <p style="margin:0 0 4px 0;font-size:14px;color:#333;"><strong>Data:</strong> ${booking.date}</p>
        <p style="margin:0;font-size:14px;color:#333;"><strong>Orario:</strong> ${booking.start_time?.substring(0, 5)} - ${booking.end_time?.substring(0, 5)}</p>
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendUserConfirmation(booking: any) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.log("[BOOKING] Email conferma utente:", booking.user_email)
    return
  }

  // Recupera nome club
  const adminClient = createAdminClient()
  const { data: club } = await adminClient
    .from("clubs")
    .select("name")
    .eq("id", booking.club_id)
    .single()

  const clubName = club?.name || "il circolo"
  const fieldInfo = booking.fields ? `Campo: ${booking.fields.name}` : ""

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
    <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 20px 0;">La tua prenotazione presso <strong>${clubName}</strong> è stata confermata.</p>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendUserRejection(booking: any, reason: string | null) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.log("[BOOKING] Email rifiuto utente:", booking.user_email)
    return
  }

  // Recupera nome club
  const adminClient = createAdminClient()
  const { data: club } = await adminClient
    .from("clubs")
    .select("name")
    .eq("id", booking.club_id)
    .single()

  const clubName = club?.name || "il circolo"

  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from: "PrenotaUnCampetto <noreply@prenotauncampetto.it>",
    to: booking.user_email,
    subject: `Prenotazione non disponibile — ${clubName}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f6;padding:32px 0;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;max-width:480px;width:100%;">
  <tr><td style="background-color:#dc2626;padding:24px 32px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:20px;">PrenotaUnCampetto</h1>
  </td></tr>
  <tr><td style="padding:32px;">
    <h2 style="color:#111;margin:0 0 16px 0;font-size:22px;">Prenotazione non disponibile</h2>
    <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 8px 0;">Ciao <strong>${booking.user_name}</strong>,</p>
    <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 20px 0;">Purtroppo la tua prenotazione presso <strong>${clubName}</strong> non è stata accettata.</p>
    ${reason ? `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin:0 0 24px 0;">
      <tr><td style="padding:16px;">
        <p style="margin:0;font-size:14px;color:#333;"><strong>Motivo:</strong> ${reason}</p>
      </td></tr>
    </table>` : ""}
    <p style="color:#333;font-size:15px;line-height:1.5;margin:0;">Ti invitiamo a provare con un altro orario.</p>
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

/**
 * Helper per l'invio email tramite Resend con template React Email.
 * Fornisce funzioni tipizzate per ogni tipo di email del sistema.
 */
import { render } from "@react-email/components"
import { BookingReceivedEmail } from "./templates/booking-received"
import { BookingConfirmedEmail } from "./templates/booking-confirmed"
import { BookingRejectedEmail } from "./templates/booking-rejected"
import { AdminInviteEmail } from "./templates/admin-invite"

async function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  const { Resend } = await import("resend")
  return new Resend(apiKey)
}

/** Invia notifica di nuova prenotazione al club-admin */
export async function sendBookingReceivedEmail(params: {
  to: string
  clubName: string
  userName: string
  userEmail: string
  userPhone: string
  fieldName: string
  date: string
  startTime: string
  endTime: string
  notes?: string | null
}) {
  const resend = await getResend()
  if (!resend) {
    console.log("[EMAIL] BookingReceived →", params.to, params)
    return
  }

  const html = await render(
    BookingReceivedEmail({
      clubName: params.clubName,
      userName: params.userName,
      userEmail: params.userEmail,
      userPhone: params.userPhone,
      fieldName: params.fieldName,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      notes: params.notes,
    })
  )

  await resend.emails.send({
    from: "PrenotaUnCampetto <noreply@prenotauncampetto.it>",
    to: params.to,
    subject: `Nuova prenotazione da ${params.userName} — ${params.clubName}`,
    html,
  })
}

/** Invia email di conferma prenotazione all'utente */
export async function sendBookingConfirmedEmail(params: {
  to: string
  clubName: string
  userName: string
  fieldName: string
  date: string
  startTime: string
  endTime: string
  clubAddress?: string | null
  clubPhone?: string | null
}) {
  const resend = await getResend()
  if (!resend) {
    console.log("[EMAIL] BookingConfirmed →", params.to, params)
    return
  }

  const html = await render(
    BookingConfirmedEmail({
      clubName: params.clubName,
      userName: params.userName,
      fieldName: params.fieldName,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      clubAddress: params.clubAddress,
      clubPhone: params.clubPhone,
    })
  )

  await resend.emails.send({
    from: "PrenotaUnCampetto <noreply@prenotauncampetto.it>",
    to: params.to,
    subject: `La tua prenotazione è confermata! — ${params.clubName}`,
    html,
  })
}

/** Invia email di rifiuto prenotazione all'utente */
export async function sendBookingRejectedEmail(params: {
  to: string
  clubName: string
  userName: string
  fieldName: string
  date: string
  startTime: string
  endTime: string
  reason?: string | null
}) {
  const resend = await getResend()
  if (!resend) {
    console.log("[EMAIL] BookingRejected →", params.to, params)
    return
  }

  const html = await render(
    BookingRejectedEmail({
      clubName: params.clubName,
      userName: params.userName,
      fieldName: params.fieldName,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      reason: params.reason,
    })
  )

  await resend.emails.send({
    from: "PrenotaUnCampetto <noreply@prenotauncampetto.it>",
    to: params.to,
    subject: `Prenotazione non disponibile — ${params.clubName}`,
    html,
  })
}

/** Invia invito admin circolo (con credenziali se nuovo utente) */
export async function sendAdminInviteEmail(params: {
  to: string
  clubName: string
  inviteUrl: string
  password?: string
}) {
  const resend = await getResend()
  if (!resend) {
    console.log("[EMAIL] AdminInvite →", params.to, params)
    return
  }

  const html = await render(
    AdminInviteEmail({
      clubName: params.clubName,
      inviteUrl: params.inviteUrl,
      email: params.to,
      password: params.password,
    })
  )

  await resend.emails.send({
    from: "PrenotaUnCampetto <noreply@prenotauncampetto.it>",
    to: params.to,
    subject: `Sei stato invitato come admin di ${params.clubName} — SportBook`,
    html,
  })
}

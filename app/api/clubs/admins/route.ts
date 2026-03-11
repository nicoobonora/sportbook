/**
 * API Route per gestione admin dei circoli.
 * POST: Crea/aggiungi admin tramite email (senza password, login via OTP).
 * DELETE: Rimuovi admin dal circolo.
 * Usa il client admin (service role) per bypassare RLS.
 */
import { NextRequest, NextResponse } from "next/server"
import { clubAdminInviteSchema } from "@/lib/validations/club"
import { sendAdminInviteEmail } from "@/lib/email/send"
import { verifySuperAdmin } from "@/lib/auth/verify-super-admin"

/** POST /api/clubs/admins — Crea admin tramite email */
export async function POST(request: NextRequest) {
  const { error, status, admin } = await verifySuperAdmin()
  if (error || !admin) {
    return NextResponse.json({ error }, { status })
  }

  const body = await request.json()
  const validation = clubAdminInviteSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dati non validi", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { email, club_id } = validation.data

  // Verifica che il circolo esista
  const { data: club } = await admin
    .from("clubs")
    .select("id, name")
    .eq("id", club_id)
    .single()

  if (!club) {
    return NextResponse.json(
      { error: "Circolo non trovato" },
      { status: 404 }
    )
  }

  // Cerca l'utente per email tramite admin API di Supabase Auth
  const {
    data: { users },
  } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })

  const found = users?.find((u) => u.email === email)

  if (found) {
    // L'utente esiste: verifica che non sia già admin
    const { data: existing } = await admin
      .from("club_admins")
      .select("id")
      .eq("club_id", club_id)
      .eq("user_id", found.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Questo utente è già admin del circolo" },
        { status: 409 }
      )
    }

    // Aggiungi direttamente come admin
    const { error: insertError } = await admin
      .from("club_admins")
      .insert({
        club_id,
        user_id: found.id,
      })

    if (insertError) {
      return NextResponse.json(
        { error: "Errore durante l'aggiunta dell'admin" },
        { status: 500 }
      )
    }

    return NextResponse.json({ added: true, invited: false })
  }

  // L'utente non esiste: crea account Supabase senza password (login via OTP)
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (createError || !newUser?.user) {
    console.error("[ADMINS] Errore creazione utente:", createError)
    return NextResponse.json(
      { error: "Errore durante la creazione dell'account" },
      { status: 500 }
    )
  }

  // Aggiungi come admin del circolo
  const { error: insertError } = await admin
    .from("club_admins")
    .insert({
      club_id,
      user_id: newUser.user.id,
    })

  if (insertError) {
    console.error("[ADMINS] Errore inserimento club_admins:", insertError)
    return NextResponse.json(
      { error: "Utente creato ma errore durante l'assegnazione al circolo" },
      { status: 500 }
    )
  }

  // Invia email di benvenuto con link al pannello
  try {
    await sendAdminInviteEmail({
      to: email,
      clubName: club.name,
      inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/login?club=${club_id}`,
    })
  } catch (err) {
    console.error("[ADMINS] Errore invio email:", err)
  }

  return NextResponse.json({
    added: true,
    invited: true,
  })
}

/** DELETE /api/clubs/admins?id=UUID&club_id=UUID — Rimuovi admin */
export async function DELETE(request: NextRequest) {
  const { error, status, admin } = await verifySuperAdmin()
  if (error || !admin) {
    return NextResponse.json({ error }, { status })
  }

  const adminId = request.nextUrl.searchParams.get("id")
  const clubId = request.nextUrl.searchParams.get("club_id")

  if (!adminId || !clubId) {
    return NextResponse.json(
      { error: "Parametri mancanti" },
      { status: 400 }
    )
  }

  const { error: deleteError } = await admin
    .from("club_admins")
    .delete()
    .eq("id", adminId)
    .eq("club_id", clubId)

  if (deleteError) {
    return NextResponse.json(
      { error: "Errore durante la rimozione" },
      { status: 500 }
    )
  }

  return NextResponse.json({ deleted: true })
}

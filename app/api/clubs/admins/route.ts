/**
 * API Route per gestione admin dei circoli.
 * POST: Invita/aggiungi admin tramite email.
 * DELETE: Rimuovi admin dal circolo.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { clubAdminInviteSchema } from "@/lib/validations/club"
import { sendAdminInviteEmail } from "@/lib/email/send"

async function verifySuperAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Non autenticato", status: 401, supabase, user: null }
  }

  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
  if (!superAdminEmails.includes(user.email || "")) {
    return { error: "Non autorizzato", status: 403, supabase, user: null }
  }

  return { error: null, status: 200, supabase, user }
}

/** POST /api/clubs/admins — Invita admin tramite email */
export async function POST(request: NextRequest) {
  const { error, status, supabase } = await verifySuperAdmin()
  if (error) {
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
  const { data: club } = await supabase
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

  // Cerca l'utente per email nella tabella auth.users via RPC o admin API
  // In Supabase, non possiamo cercare direttamente auth.users dal client.
  // Usiamo un approccio: proviamo con il service role se disponibile,
  // altrimenti inviamo un invito email.
  const adminApiKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  let userId: string | null = null

  if (adminApiKey && supabaseUrl) {
    // Cerca l'utente tramite Admin API
    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminApiKey}`,
          apikey: adminApiKey,
        },
      }
    )

    if (response.ok) {
      const { users } = await response.json()
      // Cerca l'utente tra tutti (l'API non supporta filtro per email direttamente)
      // Usiamo un approccio pragmatico: lista utenti e filtra
      // Per liste grandi, andrebbe fatto con una DB function
      const found = users?.find(
        (u: { email: string }) => u.email === email
      )
      if (found) {
        userId = found.id
      }
    }
  }

  if (userId) {
    // L'utente esiste: verifica che non sia già admin
    const { data: existing } = await supabase
      .from("club_admins")
      .select("id")
      .eq("club_id", club_id)
      .eq("user_id", userId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Questo utente è già admin del circolo" },
        { status: 409 }
      )
    }

    // Aggiungi direttamente come admin
    const { error: insertError } = await supabase
      .from("club_admins")
      .insert({
        club_id,
        user_id: userId,
      })

    if (insertError) {
      return NextResponse.json(
        { error: "Errore durante l'aggiunta dell'admin" },
        { status: 500 }
      )
    }

    return NextResponse.json({ added: true, invited: false })
  }

  // L'utente non esiste ancora: invia invito via email
  await sendAdminInviteEmail({
    to: email,
    clubName: club.name,
    inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/login?club=${club_id}`,
  })

  return NextResponse.json({ added: false, invited: true })
}

/** DELETE /api/clubs/admins?id=UUID&club_id=UUID — Rimuovi admin */
export async function DELETE(request: NextRequest) {
  const { error, status, supabase } = await verifySuperAdmin()
  if (error) {
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

  const { error: deleteError } = await supabase
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

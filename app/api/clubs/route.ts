/**
 * API Route per la gestione dei circoli sportivi.
 * Solo il super-admin può creare e modificare circoli.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { clubFormSchema } from "@/lib/validations/club"

/** Verifica che l'utente sia super-admin */
async function verifySuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Non autenticato", status: 401, supabase, user: null }
  }

  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim())
  if (!superAdminEmails.includes(user.email || "")) {
    return { error: "Non autorizzato", status: 403, supabase, user: null }
  }

  return { error: null, status: 200, supabase, user }
}

/** POST /api/clubs — Crea un nuovo circolo */
export async function POST(request: NextRequest) {
  const { error, status, supabase } = await verifySuperAdmin()
  if (error) {
    return NextResponse.json({ error }, { status })
  }

  const body = await request.json()
  const validation = clubFormSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dati non validi", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const data = validation.data

  // Verifica unicità slug
  const { data: existingClub } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", data.slug)
    .single()

  if (existingClub) {
    return NextResponse.json(
      { error: "Questo slug è già in uso. Scegli un nome diverso." },
      { status: 409 }
    )
  }

  const { data: club, error: insertError } = await supabase
    .from("clubs")
    .insert({
      name: data.name,
      slug: data.slug,
      tagline: data.tagline || null,
      about_text: data.about_text || null,
      sports: data.sports,
      primary_color: data.primary_color,
      accent_color: data.accent_color,
      address: data.address || null,
      city: data.city || null,
      phone: data.phone || null,
      email: data.email || null,
      whatsapp: data.whatsapp || null,
      instagram_url: data.instagram_url || null,
      facebook_url: data.facebook_url || null,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json(
      { error: "Errore durante la creazione del circolo" },
      { status: 500 }
    )
  }

  return NextResponse.json(club, { status: 201 })
}

/** PATCH /api/clubs?id=UUID — Aggiorna un circolo esistente */
export async function PATCH(request: NextRequest) {
  const { error, status, supabase } = await verifySuperAdmin()
  if (error) {
    return NextResponse.json({ error }, { status })
  }

  const clubId = request.nextUrl.searchParams.get("id")
  if (!clubId) {
    return NextResponse.json({ error: "ID circolo mancante" }, { status: 400 })
  }

  const body = await request.json()
  const validation = clubFormSchema.partial().safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dati non validi", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const data = validation.data

  // Se lo slug è cambiato, verifica unicità
  if (data.slug) {
    const { data: existingClub } = await supabase
      .from("clubs")
      .select("id")
      .eq("slug", data.slug)
      .neq("id", clubId)
      .single()

    if (existingClub) {
      return NextResponse.json(
        { error: "Questo slug è già in uso." },
        { status: 409 }
      )
    }
  }

  const { data: club, error: updateError } = await supabase
    .from("clubs")
    .update({
      ...data,
      tagline: data.tagline || null,
      about_text: data.about_text || null,
      address: data.address || null,
      city: data.city || null,
      phone: data.phone || null,
      email: data.email || null,
      whatsapp: data.whatsapp || null,
      instagram_url: data.instagram_url || null,
      facebook_url: data.facebook_url || null,
    })
    .eq("id", clubId)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento" },
      { status: 500 }
    )
  }

  return NextResponse.json(club)
}

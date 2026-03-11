/**
 * API Route per la gestione dei circoli sportivi.
 * Solo il super-admin può creare e modificare circoli.
 * Usa il client admin (service role) per bypassare RLS dopo verifica identità.
 */
import { NextRequest, NextResponse } from "next/server"
import { clubFormSchema } from "@/lib/validations/club"
import { verifySuperAdmin } from "@/lib/auth/verify-super-admin"
import { geocodeAddress } from "@/lib/utils/nominatim"

/** POST /api/clubs — Crea un nuovo circolo */
export async function POST(request: NextRequest) {
  const { error, status, admin } = await verifySuperAdmin()
  if (error || !admin) {
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

  // Auto-geocoding: se c'è un indirizzo ma mancano le coordinate, geocodifica
  if (data.address && !data.latitude && !data.longitude) {
    try {
      const geo = await geocodeAddress(data.address, data.city)
      if (geo) {
        data.latitude = geo.latitude
        data.longitude = geo.longitude
        if (!data.city) data.city = geo.city
        if (!data.postal_code) data.postal_code = geo.postal_code
        if (!data.region) data.region = geo.region
      }
    } catch (e) {
      console.error("[CLUBS] Geocoding error:", e)
    }
  }

  // Verifica unicità slug
  const { data: existingClub } = await admin
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

  const { data: club, error: insertError } = await admin
    .from("clubs")
    .insert({
      name: data.name,
      slug: data.slug,
      tagline: data.tagline || null,
      about_text: data.about_text || null,
      sports: data.sports,
      address: data.address || null,
      city: data.city || null,
      postal_code: data.postal_code || null,
      region: data.region || null,
      country: data.country || "IT",
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      phone: data.phone || null,
      email: data.email || null,
      whatsapp: data.whatsapp || null,
      instagram_url: data.instagram_url || null,
      facebook_url: data.facebook_url || null,
      claim_status: data.claim_status || "claimed",
    })
    .select()
    .single()

  if (insertError) {
    console.error("[CLUBS] Insert error:", insertError)
    return NextResponse.json(
      { error: "Errore durante la creazione del circolo" },
      { status: 500 }
    )
  }

  return NextResponse.json(club, { status: 201 })
}

/** PATCH /api/clubs?id=UUID — Aggiorna un circolo esistente */
export async function PATCH(request: NextRequest) {
  const { error, status, admin } = await verifySuperAdmin()
  if (error || !admin) {
    return NextResponse.json({ error }, { status })
  }

  const clubId = request.nextUrl.searchParams.get("id")
  if (!clubId) {
    return NextResponse.json({ error: "ID circolo mancante" }, { status: 400 })
  }

  const body = await request.json()

  // Toggle rapido di is_active / is_published / claim_status (senza validazione form completa)
  if (
    Object.keys(body).length === 1 &&
    ("is_active" in body || "is_published" in body || "claim_status" in body)
  ) {
    const { data: club, error: toggleError } = await admin
      .from("clubs")
      .update(body)
      .eq("id", clubId)
      .select()
      .single()

    if (toggleError) {
      return NextResponse.json(
        { error: "Errore durante l'aggiornamento" },
        { status: 500 }
      )
    }
    return NextResponse.json(club)
  }

  const validation = clubFormSchema.partial().safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dati non validi", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const data = validation.data

  // Auto-geocoding: se c'è un indirizzo ma mancano le coordinate, geocodifica
  if (data.address && !data.latitude && !data.longitude) {
    try {
      const geo = await geocodeAddress(data.address, data.city)
      if (geo) {
        data.latitude = geo.latitude
        data.longitude = geo.longitude
        if (!data.city) data.city = geo.city
        if (!data.postal_code) data.postal_code = geo.postal_code
        if (!data.region) data.region = geo.region
      }
    } catch (e) {
      console.error("[CLUBS] Geocoding error:", e)
    }
  }

  if (data.slug) {
    const { data: existingClub } = await admin
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

  const { data: club, error: updateError } = await admin
    .from("clubs")
    .update({
      ...data,
      tagline: data.tagline || null,
      about_text: data.about_text || null,
      address: data.address || null,
      city: data.city || null,
      postal_code: data.postal_code || null,
      region: data.region || null,
      country: data.country || "IT",
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      phone: data.phone || null,
      email: data.email || null,
      whatsapp: data.whatsapp || null,
      instagram_url: data.instagram_url || null,
      facebook_url: data.facebook_url || null,
      ...(data.claim_status ? { claim_status: data.claim_status } : {}),
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

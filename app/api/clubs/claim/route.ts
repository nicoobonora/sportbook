/**
 * API Route per le richieste di reclamo circoli.
 * POST: crea una nuova richiesta di claim (pubblico, no auth)
 * GET: lista richieste (solo super-admin)
 * PATCH: approva/rifiuta una richiesta (solo super-admin)
 */
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { claimRequestSchema } from "@/lib/validations/claim"
import { verifySuperAdmin } from "@/lib/auth/verify-super-admin"

/** POST /api/clubs/claim — Invia richiesta di reclamo (pubblico) */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = claimRequestSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dati non validi", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const data = validation.data
  const admin = createAdminClient()

  // Verifica che il club esista e sia unclaimed
  const { data: club, error: clubError } = await admin
    .from("clubs")
    .select("id, name, claim_status")
    .eq("id", data.club_id)
    .single()

  if (clubError || !club) {
    return NextResponse.json(
      { error: "Circolo non trovato" },
      { status: 404 }
    )
  }

  if (club.claim_status === "claimed") {
    return NextResponse.json(
      { error: "Questo circolo è già stato reclamato" },
      { status: 409 }
    )
  }

  // Verifica che non ci sia già una richiesta pending per questo club
  const { data: existingClaim } = await admin
    .from("claim_requests")
    .select("id")
    .eq("club_id", data.club_id)
    .eq("status", "pending")
    .single()

  if (existingClaim) {
    return NextResponse.json(
      { error: "È già stata inviata una richiesta per questo circolo. Ti contatteremo a breve." },
      { status: 409 }
    )
  }

  // Inserisci la richiesta
  const { data: claimRequest, error: insertError } = await admin
    .from("claim_requests")
    .insert({
      club_id: data.club_id,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      role: data.role,
      message: data.message || null,
    })
    .select()
    .single()

  if (insertError) {
    console.error("[CLAIM] Insert error:", insertError)
    return NextResponse.json(
      { error: "Errore durante l'invio della richiesta" },
      { status: 500 }
    )
  }

  // Aggiorna claim_status del club a "pending"
  await admin
    .from("clubs")
    .update({ claim_status: "pending" })
    .eq("id", data.club_id)

  // Notifica super-admin via email (asincrono, non blocca la risposta)
  sendClaimNotification(data.contact_name, club.name, data.contact_email).catch(
    (err) => console.error("[CLAIM] Email error:", err)
  )

  return NextResponse.json(claimRequest, { status: 201 })
}

/** GET /api/clubs/claim — Lista richieste claim (super-admin) */
export async function GET(request: NextRequest) {
  const { error, status, admin } = await verifySuperAdmin()
  if (error || !admin) {
    return NextResponse.json({ error }, { status })
  }

  const statusFilter = request.nextUrl.searchParams.get("status")

  let query = admin
    .from("claim_requests")
    .select("*")
    .order("created_at", { ascending: false })

  if (statusFilter && ["pending", "approved", "rejected"].includes(statusFilter)) {
    query = query.eq("status", statusFilter as "pending" | "approved" | "rejected")
  }

  const { data: claims, error: queryError } = await query

  if (queryError) {
    return NextResponse.json(
      { error: "Errore durante il recupero delle richieste" },
      { status: 500 }
    )
  }

  return NextResponse.json(claims)
}

/** PATCH /api/clubs/claim?id=UUID — Approva/Rifiuta claim (super-admin) */
export async function PATCH(request: NextRequest) {
  const { error, status, admin } = await verifySuperAdmin()
  if (error || !admin) {
    return NextResponse.json({ error }, { status })
  }

  const claimId = request.nextUrl.searchParams.get("id")
  if (!claimId) {
    return NextResponse.json({ error: "ID richiesta mancante" }, { status: 400 })
  }

  const body = await request.json()
  const action = body.action as "approve" | "reject"
  const reviewNotes = body.review_notes as string | undefined

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "Azione non valida. Usa 'approve' o 'reject'." },
      { status: 400 }
    )
  }

  // Recupera la richiesta
  const { data: claim, error: claimError } = await admin
    .from("claim_requests")
    .select("*")
    .eq("id", claimId)
    .single()

  if (claimError || !claim) {
    return NextResponse.json(
      { error: "Richiesta non trovata" },
      { status: 404 }
    )
  }

  if (claim.status !== "pending") {
    return NextResponse.json(
      { error: "Questa richiesta è già stata gestita" },
      { status: 409 }
    )
  }

  const newStatus = action === "approve" ? "approved" : "rejected"

  // Aggiorna la richiesta
  const { data: updatedClaim, error: updateError } = await admin
    .from("claim_requests")
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes || null,
    })
    .eq("id", claimId)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento" },
      { status: 500 }
    )
  }

  // Se approvata, aggiorna il club a "claimed"
  if (action === "approve") {
    await admin
      .from("clubs")
      .update({ claim_status: "claimed" })
      .eq("id", claim.club_id)
  } else {
    // Se rifiutata, riporta il club a "unclaimed"
    await admin
      .from("clubs")
      .update({ claim_status: "unclaimed" })
      .eq("id", claim.club_id)
  }

  return NextResponse.json(updatedClaim)
}

/** Invia notifica email al super-admin per nuova richiesta */
async function sendClaimNotification(
  contactName: string,
  clubName: string,
  contactEmail: string
) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log("[CLAIM] No RESEND_API_KEY, skipping email notification")
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
    subject: `Nuova richiesta di reclamo: ${clubName}`,
    html: `
      <h2>Nuova richiesta di reclamo</h2>
      <p><strong>${contactName}</strong> (${contactEmail}) vuole reclamare il circolo <strong>${clubName}</strong>.</p>
      <p>Vai al pannello super-admin per gestire la richiesta.</p>
    `,
  })
}

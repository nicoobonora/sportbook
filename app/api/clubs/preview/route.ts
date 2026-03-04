/**
 * API Route per generare token di anteprima temporanei.
 * GET /api/clubs/preview?club_id=UUID — Genera URL di anteprima (valido 24h).
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createPreviewToken } from "@/lib/utils/preview-token"

async function verifySuperAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Non autenticato", status: 401, admin: null }
  }

  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
  if (!superAdminEmails.includes(user.email || "")) {
    return { error: "Non autorizzato", status: 403, admin: null }
  }

  const admin = createAdminClient()
  return { error: null, status: 200, admin }
}

/** GET /api/clubs/preview?club_id=UUID — Genera URL di anteprima */
export async function GET(request: NextRequest) {
  const { error, status, admin } = await verifySuperAdmin()
  if (error || !admin) {
    return NextResponse.json({ error }, { status })
  }

  const clubId = request.nextUrl.searchParams.get("club_id")
  if (!clubId) {
    return NextResponse.json(
      { error: "club_id mancante" },
      { status: 400 }
    )
  }

  const { data: club } = await admin
    .from("clubs")
    .select("id, slug")
    .eq("id", clubId)
    .single()

  if (!club) {
    return NextResponse.json(
      { error: "Circolo non trovato" },
      { status: 404 }
    )
  }

  const token = await createPreviewToken(club.id, club.slug)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const previewUrl = `${baseUrl}/preview/${club.slug}?token=${token}`

  return NextResponse.json({ previewUrl, token, expiresIn: "24h" })
}

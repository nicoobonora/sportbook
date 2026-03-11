/**
 * API per risolvere il circolo associato all'utente autenticato.
 * GET /api/auth/admin/resolve-club
 * Ritorna slug, id e nome del circolo se l'utente è admin.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Non autenticato" },
      { status: 401 }
    )
  }

  const { data, error } = await supabase
    .from("club_admins")
    .select("club_id, clubs(id, slug, name)")
    .eq("user_id", user.id)
    .single()

  if (error || !data?.clubs) {
    return NextResponse.json(
      { error: "Nessun circolo associato a questo account" },
      { status: 404 }
    )
  }

  const club = data.clubs as unknown as { id: string; slug: string; name: string }

  return NextResponse.json({
    club_id: club.id,
    slug: club.slug,
    club_name: club.name,
  })
}

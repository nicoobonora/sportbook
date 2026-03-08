/**
 * API Route per la ricerca club per nome.
 * GET /api/clubs/search?q=tennis&limit=10
 * Restituisce nome, slug, città — usato dall'app mobile per l'autosuggest.
 */
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim()
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") || "8"),
    20
  )

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  const adminClient = createAdminClient()

  const { data: clubs } = await adminClient
    .from("clubs")
    .select("id, slug, name, city, logo_url")
    .eq("is_active", true)
    .ilike("name", `%${q}%`)
    .order("name")
    .limit(limit)

  return NextResponse.json(clubs || [])
}

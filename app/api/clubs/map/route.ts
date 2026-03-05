/**
 * API pubblica per i dati mappa dei circoli.
 * Restituisce solo circoli attivi con coordinate valide.
 * Supporta filtraggio per sport via query param: ?sports=padel,tennis
 */
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()

  const sportsParam = request.nextUrl.searchParams.get("sports")
  const sportsFilter = sportsParam
    ? sportsParam.split(",").filter(Boolean)
    : []

  let query = supabase
    .from("clubs")
    .select("id, slug, name, sports, latitude, longitude, logo_url, city, region")
    .eq("is_active", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null)

  if (sportsFilter.length > 0) {
    query = query.overlaps("sports", sportsFilter)
  }

  const { data: clubs, error } = await query

  if (error) {
    return NextResponse.json(
      { error: `Errore nel recupero dei circoli: ${error.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ clubs: clubs || [] })
}

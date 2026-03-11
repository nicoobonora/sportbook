/**
 * API pubblica per i dati mappa dei circoli.
 * Restituisce solo circoli attivi con coordinate valide.
 * Supporta:
 * - Filtraggio per sport: ?sports=padel,tennis
 * - Bounding box: ?swLat=40&swLng=11&neLat=43&neLng=14
 */
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()
  const params = request.nextUrl.searchParams

  const sportsParam = params.get("sports")
  const sportsFilter = sportsParam
    ? sportsParam.split(",").filter(Boolean)
    : []

  // Bounding box (opzionale)
  const swLat = params.get("swLat")
  const swLng = params.get("swLng")
  const neLat = params.get("neLat")
  const neLng = params.get("neLng")
  const hasBounds = swLat && swLng && neLat && neLng

  let query = supabase
    .from("clubs")
    .select("id, slug, name, sports, latitude, longitude, logo_url, cover_image_url, city, region, address, tagline, claim_status")
    .eq("is_active", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null)

  if (hasBounds) {
    query = query
      .gte("latitude", parseFloat(swLat))
      .lte("latitude", parseFloat(neLat))
      .gte("longitude", parseFloat(swLng))
      .lte("longitude", parseFloat(neLng))
  }

  if (sportsFilter.length > 0) {
    query = query.overlaps("sports", sportsFilter)
  }

  // Limite esplicito per evitare il default di 1000 di Supabase
  query = query.limit(3000)

  const { data: clubs, error } = await query

  if (error) {
    return NextResponse.json(
      { error: "Errore nel recupero dei circoli" },
      { status: 500 }
    )
  }

  return NextResponse.json({ clubs: clubs || [] })
}

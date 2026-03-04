/**
 * Hook per recuperare i dati del circolo corrente dal contesto multi-tenant.
 * Usato nei Server Components del sito del circolo.
 */
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import type { Club } from "@/lib/types/database"

/**
 * Recupera il club corrente basandosi sullo slug iniettato dal middleware.
 * Da usare SOLO nei Server Components del sito del circolo.
 */
export async function getClubFromHeaders(): Promise<Club | null> {
  const headersList = headers()
  const slug = headersList.get("x-sportbook-club-slug")

  if (!slug) return null

  const supabase = createClient()
  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .single()

  return club
}

/**
 * Recupera il club tramite slug (per uso diretto senza middleware).
 */
export async function getClubBySlug(slug: string): Promise<Club | null> {
  const supabase = createClient()
  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .single()

  return club
}

/**
 * Recupera il club tramite ID.
 */
export async function getClubById(id: string): Promise<Club | null> {
  const supabase = createClient()
  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", id)
    .single()

  return club
}

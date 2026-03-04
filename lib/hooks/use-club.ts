/**
 * Hook per recuperare i dati del circolo corrente dal contesto multi-tenant.
 * Usato nei Server Components del sito del circolo.
 *
 * Usa il client admin per bypassare RLS (serve solo leggere la configurazione
 * del circolo per il rendering, non dati sensibili).
 */
import { headers } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Club } from "@/lib/types/database"

/**
 * Recupera il club corrente basandosi sullo slug iniettato dal middleware.
 * Da usare SOLO nei Server Components del sito del circolo.
 */
export async function getClubFromHeaders(): Promise<Club | null> {
  const headersList = headers()
  const slug = headersList.get("x-sportbook-club-slug")

  if (!slug) return null

  const supabase = createAdminClient()
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
  const supabase = createAdminClient()
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
  const supabase = createAdminClient()
  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", id)
    .single()

  return club
}

/**
 * Client Supabase per il browser (componenti client-side).
 * Usa la chiave anonima pubblica — le RLS policies proteggono i dati.
 */
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/types/database"

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

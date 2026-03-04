/**
 * Client Supabase con service role key.
 * ATTENZIONE: bypassa TUTTE le RLS policies.
 * Usare SOLO in API Routes server-side per operazioni privilegiate.
 */
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database"

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

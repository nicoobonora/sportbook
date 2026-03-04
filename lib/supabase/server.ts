/**
 * Client Supabase per i Server Components e le Server Actions.
 * Gestisce i cookie tramite l'API cookies() di Next.js.
 */
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/lib/types/database"

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll viene chiamato anche da Server Components dove
            // i cookie non possono essere impostati — ignoriamo l'errore
          }
        },
      },
    }
  )
}

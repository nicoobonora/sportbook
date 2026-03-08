import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export function isSuperAdminEmail(email: string | undefined): boolean {
  if (!email) return false
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return superAdminEmails.includes(email.toLowerCase())
}

/** Verifica che l'utente sia super-admin, restituisce admin client per le operazioni DB */
export async function verifySuperAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Non autenticato" as const, status: 401 as const, admin: null }
  }

  if (!isSuperAdminEmail(user.email)) {
    return { error: "Non autorizzato" as const, status: 403 as const, admin: null }
  }

  const admin = createAdminClient()
  return { error: null, status: 200 as const, admin }
}

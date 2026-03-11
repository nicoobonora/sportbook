/**
 * Pagina di login unificata per gli admin dei circoli.
 * Path: prenotauncampetto.it/admin-login (o localhost:3000/admin-login)
 * Se l'utente è già autenticato, viene reindirizzato al proprio circolo.
 * Altrimenti mostra il form di login.
 */
import type { Metadata } from "next"
import { redirect, RedirectType } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { UnifiedLoginForm } from "@/components/admin/unified-login-form"

export const metadata: Metadata = {
  title: "Accesso Admin — PrenotaUnCampetto",
  description: "Accedi al pannello di amministrazione del tuo circolo",
}

export default async function AdminLoginPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Se già autenticato, risolvi il circolo e fai redirect
  if (user) {
    const { data } = await supabase
      .from("club_admins")
      .select("club_id, clubs(slug)")
      .eq("user_id", user.id)
      .single()

    const club = data?.clubs as unknown as { slug: string } | null

    if (club?.slug) {
      const headersList = headers()
      const host = headersList.get("host") || ""
      const isLocalhost =
        host.includes("localhost") || host.includes("127.0.0.1")

      if (isLocalhost) {
        redirect(`/club/${club.slug}/admin/dashboard`, RedirectType.replace)
      } else {
        // host è il dominio root (es. prenotauncampetto.it)
        // perché /admin-login è servito dal dominio principale
        redirect(
          `https://${club.slug}.${host}/admin/dashboard`,
          RedirectType.replace
        )
      }
    }
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-display text-display-lg uppercase tracking-tight">
            Pannello Admin
          </h1>
          <p className="mt-2 text-muted-foreground">
            Accedi per gestire il tuo circolo
          </p>
        </div>
        <UnifiedLoginForm />
      </div>
    </main>
  )
}

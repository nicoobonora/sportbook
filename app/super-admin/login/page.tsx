/**
 * Pagina di login per il super-admin.
 * Path: app.sportbook.it/super-admin/login
 */
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LoginForm } from "@/app/(club-site)/admin/login/login-form"

export const metadata: Metadata = {
  title: "Accesso Super Admin — SportBook",
  description: "Accedi al pannello di gestione SportBook",
}

export default async function SuperAdminLoginPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Se già autenticato, redirect alla dashboard
  if (user) {
    redirect("/super-admin/dashboard")
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-display text-display-lg uppercase tracking-tight">
            SportBook
          </h1>
          <p className="mt-2 text-muted-foreground">
            Pannello di gestione
          </p>
        </div>
        <LoginForm redirectTo="/super-admin/dashboard" />
      </div>
    </main>
  )
}

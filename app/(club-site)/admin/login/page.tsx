/**
 * Pagina di login per gli admin dei circoli.
 * Path: [slug].sportbook.it/admin/login
 */
import type { Metadata } from "next"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Accesso Admin — SportBook",
  description: "Accedi al pannello di amministrazione del tuo circolo",
}

export default function AdminLoginPage() {
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
        <LoginForm />
      </div>
    </main>
  )
}

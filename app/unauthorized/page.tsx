/**
 * Pagina mostrata quando un utente autenticato non ha
 * i permessi per accedere al pannello super-admin.
 */
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="max-w-md text-center space-y-4">
        <h1 className="font-display text-display-lg uppercase tracking-tight">
          Accesso negato
        </h1>
        <p className="text-muted-foreground">
          Non hai i permessi per accedere a questa sezione.
        </p>
        <Button asChild>
          <Link href="/login">Torna al login</Link>
        </Button>
      </div>
    </main>
  )
}

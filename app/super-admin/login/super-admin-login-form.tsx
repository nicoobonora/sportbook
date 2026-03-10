/**
 * Form di login super-admin con magic link via email.
 * Step 1: inserisci email → invia magic link
 * Step 2: attendi conferma (l'utente clicca il link nell'email)
 */
"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Mail, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SuperAdminLoginForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/super-admin/dashboard`,
        },
      })

      if (otpError) {
        setError(otpError.message)
      } else {
        setSent(true)
      }
    } catch {
      setError("Errore di connessione")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 rounded-lg border p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="text-lg font-semibold">Controlla la tua email</h2>
        <p className="text-sm text-muted-foreground">
          Abbiamo inviato un link di accesso a{" "}
          <strong className="text-foreground">{email}</strong>.
        </p>
        <p className="text-sm text-muted-foreground">
          Clicca il link nell&apos;email per accedere al pannello super-admin.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSent(false)
            setError(null)
          }}
          className="mt-2"
        >
          Usa un&apos;altra email
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSendLink} className="space-y-4 rounded-lg border p-6">
      <div className="space-y-2">
        <Label htmlFor="super-admin-email">Email</Label>
        <Input
          id="super-admin-email"
          type="email"
          placeholder="superadmin@esempio.it"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          autoComplete="email"
        />
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full gap-2"
        disabled={loading || !email.trim()}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        Invia link di accesso
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Riceverai un link via email per accedere senza password.
      </p>
    </form>
  )
}

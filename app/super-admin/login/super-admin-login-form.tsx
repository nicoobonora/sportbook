/**
 * Form di login super-admin con codice OTP custom (inviato via Resend).
 * Step 1: inserisci email → invia codice OTP
 * Step 2: inserisci il codice a 6 cifre → verifica e accedi
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Step = "email" | "otp"

export function SuperAdminLoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Errore durante l'invio del codice.")
      } else {
        setStep("otp")
      }
    } catch {
      setError("Errore di connessione")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!otp.trim()) return

    setLoading(true)
    setError(null)

    try {
      // 1. Verifica il codice OTP sul server
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Codice non valido.")
        return
      }

      // 2. Usa il token_hash per stabilire la sessione Supabase lato client
      const supabase = createClient()
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      })

      if (verifyError) {
        setError("Errore durante l'accesso. Riprova.")
        return
      }

      router.push("/super-admin/dashboard")
      router.refresh()
    } catch {
      setError("Errore di connessione")
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    setStep("email")
    setOtp("")
    setError(null)
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4 rounded-lg border p-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Abbiamo inviato un codice a{" "}
            <strong className="text-foreground">{email}</strong>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="super-admin-otp">Codice di verifica</Label>
          <Input
            id="super-admin-otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            autoFocus
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            className="text-center text-lg font-mono tracking-widest"
          />
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || otp.length < 6}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Verifica e accedi
        </Button>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-1 text-muted-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Cambia email
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSendOtp}
            disabled={loading}
            className="text-muted-foreground"
          >
            Reinvia codice
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSendOtp} className="space-y-4 rounded-lg border p-6">
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
        Invia codice di accesso
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Riceverai un codice a 6 cifre via email per accedere.
      </p>
    </form>
  )
}

/**
 * Form di login per gli admin dei circoli.
 * Flow OTP: inserisci email → ricevi codice a 6 cifre → verifica.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

type Step = "email" | "otp"

export function LoginForm({ redirectTo = "/admin/dashboard" }: { redirectTo?: string }) {
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
      const supabase = createClient()

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      })

      if (otpError) {
        if (otpError.message.includes("Signups not allowed")) {
          setError("Nessun account trovato con questa email.")
        } else {
          setError(otpError.message)
        }
      } else {
        setStep("otp")
      }
    } catch {
      setError("Errore di connessione. Riprova.")
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
      const supabase = createClient()

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      })

      if (verifyError) {
        setError("Codice non valido o scaduto. Riprova.")
      } else {
        router.push(redirectTo)
        router.refresh()
      }
    } catch {
      setError("Errore di connessione. Riprova.")
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    setStep("email")
    setOtp("")
    setError(null)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@circolo.it"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <div
                className="rounded-md bg-red-50 p-3 text-sm text-error"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full touch-target gap-2"
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Mail className="h-4 w-4" aria-hidden="true" />
              )}
              Invia codice di accesso
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Riceverai un codice a 6 cifre via email per accedere.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Abbiamo inviato un codice a{" "}
                <strong className="text-foreground">{email}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">Codice di verifica</Label>
              <Input
                id="otp"
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
              <div
                className="rounded-md bg-red-50 p-3 text-sm text-error"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full touch-target"
              disabled={loading || otp.length < 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Verifica in corso...
                </>
              ) : (
                "Verifica e accedi"
              )}
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
        )}
      </CardContent>
    </Card>
  )
}

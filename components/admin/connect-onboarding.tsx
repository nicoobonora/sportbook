"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ConnectOnboardingProps {
  clubId: string
  planType: string
}

interface ConnectStatus {
  hasAccount: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  onboardingComplete: boolean
  paymentsPaused: boolean
  stripeAccountId?: string
}

export function ConnectOnboarding({ clubId, planType }: ConnectOnboardingProps) {
  const [status, setStatus] = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [togglingPause, setTogglingPause] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPlanEligible = planType === "pro"

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/stripe/connect/status?clubId=${clubId}`)
      const data = await res.json()
      if (res.ok) {
        setStatus(data)
      }
    } catch {
      // Silently fail on status check
    } finally {
      setChecking(false)
    }
  }, [clubId])

  useEffect(() => {
    if (isPlanEligible) {
      checkStatus()
    } else {
      setChecking(false)
    }
  }, [isPlanEligible, checkStatus])

  async function handleOnboard() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || "Errore imprevisto")
      }
    } catch {
      setError("Errore di connessione")
    } finally {
      setLoading(false)
    }
  }

  async function handleTogglePause() {
    if (!status) return
    setTogglingPause(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/connect/pause", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: clubId, paused: !status.paymentsPaused }),
      })
      if (res.ok) {
        setStatus({ ...status, paymentsPaused: !status.paymentsPaused })
      } else {
        const data = await res.json()
        setError(data.error || "Errore durante l'aggiornamento")
      }
    } catch {
      setError("Errore di connessione")
    } finally {
      setTogglingPause(false)
    }
  }

  if (!isPlanEligible) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagamenti online</CardTitle>
          <CardDescription>
            Attiva l&apos;abbonamento dalla tab Abbonamento per poter configurare i pagamenti online.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (checking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagamenti online</CardTitle>
          <CardDescription>Verifica stato in corso...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pagamenti online
            {status?.onboardingComplete ? (
              status?.paymentsPaused ? (
                <Badge variant="secondary">In pausa</Badge>
              ) : (
                <Badge variant="default">Attivo</Badge>
              )
            ) : status?.hasAccount ? (
              <Badge variant="secondary">Configurazione in corso</Badge>
            ) : (
              <Badge variant="outline">Non configurato</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {status?.onboardingComplete
              ? status?.paymentsPaused
                ? "I pagamenti online sono temporaneamente sospesi. I tuoi clienti potranno prenotare solo con verifica via email."
                : "I tuoi clienti possono pagare online le prenotazioni. La piattaforma trattiene una commissione del 2% su ogni transazione."
              : "Attiva i pagamenti online per permettere ai tuoi clienti di pagare direttamente quando prenotano un campo. Commissione piattaforma: 2%."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {status?.onboardingComplete ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-600">✓</span>
                <span>Pagamenti con carta abilitati</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-600">✓</span>
                <span>Accrediti sul tuo conto attivi</span>
              </div>

              {status.paymentsPaused && (
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                  I pagamenti online sono in pausa. I clienti possono prenotare solo con verifica via email.
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <Button
                  variant={status.paymentsPaused ? "default" : "outline"}
                  size="sm"
                  onClick={handleTogglePause}
                  disabled={togglingPause}
                >
                  {togglingPause
                    ? "Aggiornamento..."
                    : status.paymentsPaused
                      ? "Riattiva pagamenti online"
                      : "Metti in pausa i pagamenti"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Gestisci il tuo account pagamenti dalla{" "}
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  dashboard Stripe
                </a>
                .
              </p>
            </div>
          ) : status?.hasAccount ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {status.chargesEnabled ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-amber-500">○</span>
                )}
                <span>Pagamenti con carta: {status.chargesEnabled ? "Abilitati" : "In attesa"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {status.payoutsEnabled ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-amber-500">○</span>
                )}
                <span>Accrediti: {status.payoutsEnabled ? "Abilitati" : "In attesa"}</span>
              </div>
              <Button onClick={handleOnboard} disabled={loading}>
                {loading ? "Caricamento..." : "Completa configurazione"}
              </Button>
            </div>
          ) : (
            <Button onClick={handleOnboard} disabled={loading}>
              {loading ? "Caricamento..." : "Attiva pagamenti online"}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={checkStatus}
            className="text-xs"
          >
            Aggiorna stato
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface StartTrialButtonProps {
  clubId: string
  currentPlan: string
  subscription?: {
    status: string
    current_period_end: string | null
  } | null
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Attivo", variant: "default" },
  trialing: { label: "Prova", variant: "secondary" },
  past_due: { label: "Pagamento in ritardo", variant: "destructive" },
  canceled: { label: "Cancellato", variant: "destructive" },
  none: { label: "Nessun piano", variant: "outline" },
}

export function StartTrialButton({ clubId, currentPlan, subscription }: StartTrialButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const status = subscription?.status || "none"
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.none
  const hasActivePlan = currentPlan === "pro" && (status === "active" || status === "trialing")

  async function handleStartTrial() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.error || "Errore imprevisto")
      }
    } catch {
      setError("Errore di connessione")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Piano:</span>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        {currentPlan === "pro" && <span className="text-sm text-muted-foreground">Pro</span>}
      </div>

      {status === "trialing" && subscription?.current_period_end && (
        <p className="text-sm text-muted-foreground">
          Trial scade il:{" "}
          {new Date(subscription.current_period_end).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      {status === "active" && subscription?.current_period_end && (
        <p className="text-sm text-muted-foreground">
          Prossimo rinnovo:{" "}
          {new Date(subscription.current_period_end).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success ? (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          Trial di 30 giorni avviato con successo. Ricarica la pagina per aggiornare lo stato.
        </div>
      ) : (
        <Button
          size="sm"
          onClick={handleStartTrial}
          disabled={loading || hasActivePlan}
        >
          {loading ? "Creazione in corso..." : "Avvia trial 30gg Pro"}
        </Button>
      )}

      {hasActivePlan && !success && (
        <p className="text-xs text-muted-foreground">
          Il circolo ha già un piano attivo.
        </p>
      )}
    </div>
  )
}

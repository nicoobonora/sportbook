"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PLAN, type PlanType } from "@/lib/stripe/plans"

interface SubscriptionManagementProps {
  clubId: string
  currentPlan: PlanType
  subscription?: {
    status: string
    current_period_end: string | null
    plan_type: string
  } | null
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Attivo", variant: "default" },
  trialing: { label: "Prova", variant: "secondary" },
  past_due: { label: "Pagamento in ritardo", variant: "destructive" },
  canceled: { label: "Cancellato", variant: "destructive" },
  incomplete: { label: "Incompleto", variant: "outline" },
  none: { label: "Nessun piano", variant: "outline" },
}

export function SubscriptionManagement({
  clubId,
  currentPlan,
  subscription,
}: SubscriptionManagementProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const status = subscription?.status || "none"
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.none
  const isActive = currentPlan === "pro" && status === "active"

  async function handleCheckout() {
    setLoading("pro")
    setError(null)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: "pro", clubId }),
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
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading("portal")
    setError(null)
    try {
      const res = await fetch("/api/stripe/portal", {
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
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stato attuale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Il tuo abbonamento
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </CardTitle>
          <CardDescription>
            {currentPlan === "none"
              ? "Non hai un abbonamento attivo. Attiva il piano per sbloccare tutte le funzionalità."
              : `Piano attuale: ${PLAN.name}`}
          </CardDescription>
        </CardHeader>
        {subscription?.current_period_end && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {status === "canceled"
                ? "Accesso fino al: "
                : "Prossimo rinnovo: "}
              {new Date(subscription.current_period_end).toLocaleDateString("it-IT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </CardContent>
        )}
      </Card>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Piano unico */}
      <Card className={isActive ? "border-primary ring-1 ring-primary" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {PLAN.name}
            {isActive && (
              <Badge variant="default" className="text-xs">
                Attuale
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            <span className="text-2xl font-bold text-foreground">
              {PLAN.priceMonthly.toFixed(2).replace(".", ",")}€
            </span>
            <span className="text-sm">/mese</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1.5 text-sm">
            {PLAN.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          {isActive ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={handlePortal}
              disabled={loading === "portal"}
            >
              {loading === "portal" ? "Caricamento..." : "Gestisci abbonamento"}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleCheckout}
              disabled={loading !== null}
            >
              {loading === "pro" ? "Caricamento..." : "Attiva piano"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Link al portale per chi ha già un abbonamento */}
      {isActive && (
        <div className="text-center">
          <Button
            variant="link"
            className="h-auto whitespace-normal text-center"
            onClick={handlePortal}
            disabled={loading === "portal"}
          >
            Gestisci fatturazione, metodo di pagamento e fatture →
          </Button>
        </div>
      )}
    </div>
  )
}

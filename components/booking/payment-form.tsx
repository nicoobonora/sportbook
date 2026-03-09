"use client"

import { useState, useEffect } from "react"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Lazy-load Stripe.js
let stripePromise: ReturnType<typeof loadStripe> | null = null
function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    )
  }
  return stripePromise
}

interface PaymentFormProps {
  bookingId: string
  onSuccess: () => void
  onSkip?: () => void
}

/**
 * Wrapper che carica Stripe Elements e il PaymentIntent.
 */
export function PaymentForm({ bookingId, onSuccess, onSkip }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function createIntent() {
      try {
        const res = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        })
        const data = await res.json()
        if (res.ok && data.clientSecret) {
          setClientSecret(data.clientSecret)
          setAmount(data.amount)
        } else {
          setError(data.error || "Errore nella creazione del pagamento")
        }
      } catch {
        setError("Errore di connessione")
      } finally {
        setLoading(false)
      }
    }
    createIntent()
  }, [bookingId])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Preparazione pagamento...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 space-y-3">
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
          {onSkip && (
            <Button variant="outline" onClick={onSkip} className="w-full">
              Paga di persona
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!clientSecret) return null

  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: { colorPrimary: "#16a34a" },
        },
        locale: "it",
      }}
    >
      <CheckoutForm amount={amount} onSuccess={onSuccess} onSkip={onSkip} />
    </Elements>
  )
}

/**
 * Form di pagamento interno con Stripe Elements.
 */
function CheckoutForm({
  amount,
  onSuccess,
  onSkip,
}: {
  amount: number
  onSuccess: () => void
  onSkip?: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/prenota/conferma`,
      },
      redirect: "if_required",
    })

    if (submitError) {
      setError(submitError.message || "Errore nel pagamento")
      setProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Pagamento</span>
          <span className="text-lg font-bold">
            {(amount / 100).toFixed(2)}€
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!stripe || processing}
          >
            {processing ? "Elaborazione..." : `Paga ${(amount / 100).toFixed(2)}€`}
          </Button>

          {onSkip && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={onSkip}
              disabled={processing}
            >
              Paga di persona
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

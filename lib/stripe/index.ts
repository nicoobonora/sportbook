import Stripe from "stripe"

/**
 * Server-side Stripe SDK instance.
 * Da usare SOLO in API routes e server actions — mai nel client.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * Chiave pubblica Stripe per il client (Stripe Elements).
 */
export function getStripePublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
}

/**
 * Calcola la application fee della piattaforma.
 * Default: 2% dell'importo.
 */
export function calculateApplicationFee(amountCents: number): number {
  const feePercent = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT || "2")
  return Math.round(amountCents * (feePercent / 100))
}

/**
 * Verifica la firma di un webhook Stripe.
 */
export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(body, signature, secret)
}

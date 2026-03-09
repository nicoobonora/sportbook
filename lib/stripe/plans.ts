/**
 * Configurazione piani di abbonamento PrenotaUnCampetto.
 *
 * I price ID di Stripe vanno sostituiti con quelli reali
 * creati nella dashboard Stripe (Prodotti → Prezzi).
 */

export type PlanType = "none" | "starter" | "pro" | "business"

export interface PlanConfig {
  name: string
  priceMonthly: number          // euro
  stripePriceId: string         // da dashboard Stripe
  maxFields: number             // -1 = illimitati
  features: string[]
  paymentEnabled: boolean       // se il circolo può accettare pagamenti online
  whatsappEnabled: boolean
  analyticsEnabled: boolean
  customDomainEnabled: boolean
}

export const PLANS: Record<Exclude<PlanType, "none">, PlanConfig> = {
  starter: {
    name: "Starter",
    priceMonthly: 19,
    stripePriceId: process.env.STRIPE_PRICE_STARTER || "price_starter_placeholder",
    maxFields: 2,
    features: [
      "Fino a 2 campi",
      "Pagina pubblica del circolo",
      "Gestione prenotazioni",
      "Notifiche email",
      "Annunci e comunicazioni",
    ],
    paymentEnabled: false,
    whatsappEnabled: false,
    analyticsEnabled: false,
    customDomainEnabled: false,
  },
  pro: {
    name: "Pro",
    priceMonthly: 39,
    stripePriceId: process.env.STRIPE_PRICE_PRO || "price_pro_placeholder",
    maxFields: 6,
    features: [
      "Fino a 6 campi",
      "Tutto dello Starter",
      "Pagamento online prenotazioni",
      "Notifiche WhatsApp",
      "Statistiche base",
    ],
    paymentEnabled: true,
    whatsappEnabled: true,
    analyticsEnabled: false,
    customDomainEnabled: false,
  },
  business: {
    name: "Business",
    priceMonthly: 79,
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS || "price_business_placeholder",
    maxFields: -1,
    features: [
      "Campi illimitati",
      "Tutto del Pro",
      "Analytics avanzate",
      "Dominio personalizzato",
      "Supporto prioritario",
    ],
    paymentEnabled: true,
    whatsappEnabled: true,
    analyticsEnabled: true,
    customDomainEnabled: true,
  },
}

/**
 * Restituisce i limiti per un dato piano, incluso "none".
 */
export function getPlanLimits(planType: PlanType) {
  if (planType === "none") {
    return {
      maxFields: 2,
      paymentEnabled: false,
      whatsappEnabled: false,
      analyticsEnabled: false,
      customDomainEnabled: false,
    }
  }
  const plan = PLANS[planType]
  return {
    maxFields: plan.maxFields,
    paymentEnabled: plan.paymentEnabled,
    whatsappEnabled: plan.whatsappEnabled,
    analyticsEnabled: plan.analyticsEnabled,
    customDomainEnabled: plan.customDomainEnabled,
  }
}

/**
 * Controlla se il circolo può aggiungere un nuovo campo.
 */
export function canAddField(planType: PlanType, currentFieldCount: number): boolean {
  const limits = getPlanLimits(planType)
  if (limits.maxFields === -1) return true
  return currentFieldCount < limits.maxFields
}

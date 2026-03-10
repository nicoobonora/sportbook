/**
 * Configurazione piano di abbonamento PrenotaUnCampetto.
 *
 * Piano unico "Pro" a €14,99/mese con tutte le funzionalità incluse.
 * I pagamenti online sono attivabili con commissione piattaforma del 2%.
 *
 * Il price ID di Stripe va sostituito con quello reale
 * creato nella dashboard Stripe (Prodotti → Prezzi).
 */

export type PlanType = "none" | "pro"

export interface PlanConfig {
  name: string
  priceMonthly: number          // euro
  stripePriceId: string         // da dashboard Stripe
  maxFields: number             // -1 = illimitati
  features: string[]
  paymentEnabled: boolean       // se il circolo può attivare i pagamenti online
  whatsappEnabled: boolean
  analyticsEnabled: boolean
  customDomainEnabled: boolean
}

export const PLAN: PlanConfig = {
  name: "Pro",
  priceMonthly: 14.99,
  stripePriceId: process.env.STRIPE_PRICE_PRO || "price_pro_placeholder",
  maxFields: -1,
  features: [
    "Campi illimitati",
    "Pagina pubblica del circolo",
    "Gestione prenotazioni",
    "Pagamenti online attivabili (commissione 2%)",
    "Notifiche email e WhatsApp",
    "Analytics e statistiche",
    "Supporto prioritario",
  ],
  paymentEnabled: true,
  whatsappEnabled: true,
  analyticsEnabled: true,
  customDomainEnabled: true,
}

/** Commissione piattaforma sui pagamenti online */
export const PLATFORM_FEE_PERCENT = 2

/**
 * Alias retrocompatibile — il webhook e altri moduli usavano PLANS[planType].
 * Ora c'è solo "pro".
 */
export const PLANS: Record<"pro", PlanConfig> = { pro: PLAN }

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
  return {
    maxFields: PLAN.maxFields,
    paymentEnabled: PLAN.paymentEnabled,
    whatsappEnabled: PLAN.whatsappEnabled,
    analyticsEnabled: PLAN.analyticsEnabled,
    customDomainEnabled: PLAN.customDomainEnabled,
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

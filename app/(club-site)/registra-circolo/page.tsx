/**
 * Pagina di registrazione circolo — accessibile dalla mappa discovery.
 * Permette ai gestori di:
 * 1. Selezionare il proprio circolo se già presente sulla piattaforma (→ claim)
 * 2. Richiedere l'inserimento di un nuovo circolo
 */
import type { Metadata } from "next"
import { OwnerOnboardingForm } from "@/components/discovery/owner-onboarding-form"

export const metadata: Metadata = {
  title: "Registra il tuo circolo — PrenotaUnCampetto",
  description:
    "Sei il gestore di un circolo sportivo? Registra la tua struttura su PrenotaUnCampetto e inizia a ricevere prenotazioni online.",
}

export default function RegistraCircoloPage() {
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="mb-8 text-center">
          <h1 className="font-display text-display-lg uppercase tracking-tight">
            Registra il tuo circolo
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sei il gestore di un circolo sportivo? Attiva la tua pagina su
            PrenotaUnCampetto e inizia a ricevere prenotazioni online.
          </p>
        </div>

        <OwnerOnboardingForm />
      </div>
    </main>
  )
}

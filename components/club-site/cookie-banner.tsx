/**
 * Cookie Banner GDPR compliant.
 *
 * Funzionamento:
 * - Appare al primo accesso se l'utente non ha ancora espresso preferenze
 * - Posizionato in basso su mobile, centrato su desktop
 * - Tre opzioni: "Accetta tutti", "Solo necessari", "Personalizza"
 * - Modalità "Personalizza" mostra toggle per categoria
 * - Preferenze salvate in localStorage
 * - Nessun cookie di terze parti caricato prima del consenso
 */
"use client"

import { useState } from "react"
import { useCookieConsent, type CookiePreferences } from "@/lib/hooks/use-cookie-consent"
import { Button } from "@/components/ui/button"
import { Cookie, X } from "lucide-react"

export function CookieBanner() {
  const {
    hasConsented,
    accept,
    acceptAll,
    acceptNecessaryOnly,
  } = useCookieConsent()
  const [showCustomize, setShowCustomize] = useState(false)
  const [customPrefs, setCustomPrefs] = useState<CookiePreferences>({
    analytics: false,
    marketing: false,
  })

  // Non mostrare se l'utente ha già acconsentito
  if (hasConsented) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[9998] p-4 sm:flex sm:justify-center"
      role="region"
      aria-label="Consenso cookie"
    >
      <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-lg">
        {!showCustomize ? (
          /* ── Vista principale ── */
          <>
            <div className="flex items-start gap-3">
              <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">
                  Utilizziamo i cookie
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Questo sito utilizza cookie tecnici necessari al funzionamento e,
                  con il tuo consenso, cookie analitici e di marketing.
                  Puoi accettare tutti i cookie, selezionare solo quelli necessari
                  o personalizzare le tue preferenze.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                className="touch-target"
                onClick={() => setShowCustomize(true)}
              >
                Personalizza
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="touch-target"
                onClick={acceptNecessaryOnly}
              >
                Solo necessari
              </Button>
              <Button
                size="sm"
                className="touch-target"
                onClick={acceptAll}
              >
                Accetta tutti
              </Button>
            </div>
          </>
        ) : (
          /* ── Vista personalizzazione ── */
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Preferenze cookie</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowCustomize(false)}
                aria-label="Chiudi personalizzazione"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Necessari (sempre attivi) */}
              <CookieCategory
                label="Necessari"
                description="Cookie tecnici essenziali per il funzionamento del sito. Non possono essere disattivati."
                checked={true}
                disabled={true}
                onChange={() => {}}
              />

              {/* Analitici */}
              <CookieCategory
                label="Analitici"
                description="Ci aiutano a capire come i visitatori interagiscono con il sito, per migliorare l'esperienza."
                checked={customPrefs.analytics}
                disabled={false}
                onChange={(checked) =>
                  setCustomPrefs((prev) => ({ ...prev, analytics: checked }))
                }
              />

              {/* Marketing */}
              <CookieCategory
                label="Marketing"
                description="Utilizzati per mostrare annunci e contenuti pertinenti ai tuoi interessi."
                checked={customPrefs.marketing}
                disabled={false}
                onChange={(checked) =>
                  setCustomPrefs((prev) => ({ ...prev, marketing: checked }))
                }
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                className="touch-target"
                onClick={() => accept(customPrefs)}
              >
                Salva preferenze
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Componente riga categoria cookie ── */
function CookieCategory({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
}) {
  const labelId = `cookie-label-${label.toLowerCase()}`
  const descId = `cookie-desc-${label.toLowerCase()}`

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <span id={labelId} className="text-sm font-medium">
          {label}
        </span>
        <p id={descId} className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
          ${disabled ? "cursor-not-allowed opacity-60" : ""}
          ${checked ? "bg-primary" : "bg-gray-200"}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm
            transition-transform
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}

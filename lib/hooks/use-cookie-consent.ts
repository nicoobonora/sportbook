/**
 * Hook per il consenso cookie GDPR.
 * Le preferenze sono salvate in localStorage.
 */
"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "cookie_consent_v1"

export type CookiePreferences = {
  analytics: boolean
  marketing: boolean
}

type CookieConsentState = {
  hasConsented: boolean
  preferences: CookiePreferences
  accept: (preferences: CookiePreferences) => void
  acceptAll: () => void
  acceptNecessaryOnly: () => void
  reset: () => void
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  analytics: false,
  marketing: false,
}

export function useCookieConsent(): CookieConsentState {
  const [hasConsented, setHasConsented] = useState(true) // default true per evitare flash
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES)

  // Leggi le preferenze salvate al mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookiePreferences
        setPreferences(parsed)
        setHasConsented(true)
      } catch {
        setHasConsented(false)
      }
    } else {
      setHasConsented(false)
    }
  }, [])

  const accept = useCallback((prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    setPreferences(prefs)
    setHasConsented(true)
  }, [])

  const acceptAll = useCallback(() => {
    accept({ analytics: true, marketing: true })
  }, [accept])

  const acceptNecessaryOnly = useCallback(() => {
    accept({ analytics: false, marketing: false })
  }, [accept])

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setPreferences(DEFAULT_PREFERENCES)
    setHasConsented(false)
  }, [])

  return {
    hasConsented,
    preferences,
    accept,
    acceptAll,
    acceptNecessaryOnly,
    reset,
  }
}

/**
 * Pagina discovery con mappa di tutti i circoli sportivi in Italia.
 * Flusso: chiedi posizione → centra mappa → carica club nel viewport.
 * Caricamento dinamico per viewport (bounding box) con accumulo progressivo.
 * Filtraggio per sport, marker con popup, redirect al sito del circolo.
 */
"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Loader2, MapPin, ArrowRight } from "lucide-react"
import { SportFilter } from "@/components/discovery/sport-filter"
import type { MapClub } from "@/lib/types/map"
import type { MapBounds } from "@/components/discovery/club-map"

const ClubMap = dynamic(
  () => import("@/components/discovery/club-map").then((m) => m.ClubMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm">Caricamento mappa...</span>
        </div>
      </div>
    ),
  }
)

export function DiscoveryPage() {
  const [clubs, setClubs] = useState<MapClub[]>([])
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Posizione utente: richiesta PRIMA di mostrare la mappa
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null)
  const [geoReady, setGeoReady] = useState(false)

  // Tiene traccia degli ID già caricati per accumulare senza duplicati
  const clubIdsRef = useRef<Set<string>>(new Set())
  // Bounds correnti per re-fetch quando cambiano i filtri sport
  const currentBoundsRef = useRef<MapBounds | null>(null)
  // Sport correnti per il fetch su bounds change
  const sportsRef = useRef<string[]>([])

  // Chiedi geolocalizzazione prima di tutto
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoReady(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude])
        setGeoReady(true)
      },
      () => {
        // Utente ha negato o errore → mostra Italia intera
        setGeoReady(true)
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  const fetchClubs = useCallback(async (sports: string[], bounds: MapBounds | null) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (sports.length > 0) {
      params.set("sports", sports.join(","))
    }
    if (bounds) {
      params.set("swLat", bounds.swLat.toString())
      params.set("swLng", bounds.swLng.toString())
      params.set("neLat", bounds.neLat.toString())
      params.set("neLng", bounds.neLng.toString())
    }

    const res = await fetch(`/api/clubs/map?${params}`)
    if (res.ok) {
      const data = await res.json()
      const newClubs = (data.clubs || []) as MapClub[]

      setClubs((prev) => {
        // Merge: aggiungi solo i club non ancora presenti
        const toAdd = newClubs.filter((c) => !clubIdsRef.current.has(c.id))
        for (const c of toAdd) {
          clubIdsRef.current.add(c.id)
        }
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev
      })
    }
    setLoading(false)
  }, [])

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    currentBoundsRef.current = bounds
    fetchClubs(sportsRef.current, bounds)
  }, [fetchClubs])

  function handleFilterChange(sports: string[]) {
    setSelectedSports(sports)
    sportsRef.current = sports
    // Reset accumulo e re-fetch con nuovi filtri
    clubIdsRef.current.clear()
    setClubs([])
    fetchClubs(sports, currentBoundsRef.current)
  }

  // Splash durante la richiesta di geolocalizzazione
  if (!geoReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          <span className="text-sm">Ricerca della tua posizione...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen">
      {/* ── Map (full screen) ── */}
      <div className="absolute inset-0">
        <ClubMap
          clubs={clubs}
          onBoundsChange={handleBoundsChange}
          initialCenter={userPosition}
        />
      </div>

      {/* ── Floating Header ── */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[1000] p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto max-w-screen-2xl rounded-2xl border border-white/20 bg-white/80 px-4 py-3 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-prenotauncampetto.svg"
              alt="prenotauncampetto"
              className="h-7 sm:h-8"
            />
            <div className="flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {loading ? "..." : clubs.length} circol{clubs.length === 1 ? "o" : "i"}
              </span>
            </div>
          </div>

          {/* Sport filter */}
          <div className="mt-2.5">
            <SportFilter
              selected={selectedSports}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </header>

      {/* ── Floating Banner for Club Owners ── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4">
        <Link
          href="/per-circoli"
          className="pointer-events-auto mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/90 px-4 py-3 text-primary-foreground shadow-lg backdrop-blur-xl transition-colors hover:bg-primary"
        >
          <div>
            <p className="text-sm font-semibold">Sei il gestore di un circolo?</p>
            <p className="text-xs opacity-90">
              Scopri i vantaggi e attiva le prenotazioni online
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

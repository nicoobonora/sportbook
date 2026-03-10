/**
 * Pagina discovery con mappa di tutti i circoli sportivi in Italia.
 * Filtraggio per sport, marker con popup, redirect al sito del circolo.
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Loader2, MapPin, ArrowRight } from "lucide-react"
import { SportFilter } from "@/components/discovery/sport-filter"
import type { MapClub } from "@/lib/types/map"

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

  const fetchClubs = useCallback(async (sports: string[]) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (sports.length > 0) {
      params.set("sports", sports.join(","))
    }
    const res = await fetch(`/api/clubs/map?${params}`)
    if (res.ok) {
      const data = await res.json()
      setClubs(data.clubs)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClubs(selectedSports)
  }, [fetchClubs, selectedSports])

  function handleFilterChange(sports: string[]) {
    setSelectedSports(sports)
  }

  return (
    <div className="relative h-screen">
      {/* ── Map (full screen) ── */}
      <div className="absolute inset-0">
        <ClubMap clubs={clubs} />
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
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] p-3 sm:p-4">
        <Link
          href="/registra-circolo"
          className="pointer-events-auto mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/90 px-4 py-3 text-primary-foreground shadow-lg backdrop-blur-xl transition-colors hover:bg-primary"
        >
          <div>
            <p className="text-sm font-semibold">Sei il gestore di un circolo?</p>
            <p className="text-xs opacity-90">
              Registra la tua struttura e attiva le prenotazioni online
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

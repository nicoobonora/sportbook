/**
 * Pagina discovery con mappa di tutti i circoli sportivi in Italia.
 * Filtraggio per sport, marker con popup, redirect al sito del circolo.
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { Loader2, MapPin } from "lucide-react"
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
    <div className="flex h-screen flex-col">
      {/* ── Header ── */}
      <header className="shrink-0 border-b bg-card px-4 py-3">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-display-md uppercase tracking-tight">
                SportBook
              </h1>
              <p className="text-xs text-muted-foreground">
                Scopri i circoli sportivi in Italia
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>
                {loading ? "..." : clubs.length} circol{clubs.length === 1 ? "o" : "i"}
              </span>
            </div>
          </div>

          {/* Sport filter */}
          <div className="mt-3">
            <SportFilter
              selected={selectedSports}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </header>

      {/* ── Map ── */}
      <div className="relative flex-1">
        <ClubMap clubs={clubs} />
      </div>
    </div>
  )
}

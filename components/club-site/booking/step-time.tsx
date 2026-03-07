/**
 * Step 3: Selezione orario con durata flessibile.
 * Mostra le finestre disponibili e permette di scegliere
 * orario di inizio e durata della prenotazione.
 */
"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { ArrowLeft, Clock, Loader2 } from "lucide-react"
import type { AvailabilityResult, BookingPreview } from "@/lib/scheduling/availability"
import {
  computeBookingPreview,
  generateDurationOptions,
  timeToMinutes,
  minutesToTime,
} from "@/lib/scheduling/availability"
import { formatDate, formatTime, formatPrice } from "@/lib/utils/dates"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export type BookingTimeSelection = {
  date: string
  startTime: string
  endTime: string
  priceCents: number
}

type OpeningHourData = {
  start_time: string
  end_time: string
  price_per_hour_cents: number
}

type AvailabilityResponse = AvailabilityResult & {
  startTimes: string[]
  openingHoursData: OpeningHourData[]
}

type Props = {
  clubId: string
  fieldId: string
  date: string
  onSelect: (selection: BookingTimeSelection) => void
  onBack: () => void
}

export function StepTime({ clubId, fieldId, date, onSelect, onBack }: Props) {
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)

  // Fetch availability
  useEffect(() => {
    async function fetchAvailability() {
      setLoading(true)
      setError(null)
      setSelectedStartTime(null)
      setSelectedDuration(null)

      try {
        const params = new URLSearchParams({ club_id: clubId, field_id: fieldId, date })
        const response = await fetch(`/api/availability?${params}`)

        if (!response.ok) {
          throw new Error("Errore nel caricamento della disponibilità")
        }

        const data: AvailabilityResponse = await response.json()
        setAvailability(data)
      } catch {
        setError("Impossibile caricare la disponibilità. Riprova.")
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [clubId, fieldId, date])

  // Compute booking preview when start time is selected
  const preview: BookingPreview | null = useMemo(() => {
    if (!selectedStartTime || !availability) return null
    return computeBookingPreview(selectedStartTime, availability)
  }, [selectedStartTime, availability])

  // Duration options
  const durationOptions = useMemo(() => {
    if (!selectedStartTime || !preview) return []
    return generateDurationOptions(selectedStartTime, preview.maxEndTime)
  }, [selectedStartTime, preview])

  // Calculate price for selected duration
  const selectedPrice = useMemo(() => {
    if (!selectedStartTime || !selectedDuration || !availability) return 0
    const oh = availability.openingHoursData.find((o) => {
      const ohStart = timeToMinutes(o.start_time)
      const ohEnd = timeToMinutes(o.end_time)
      const start = timeToMinutes(selectedStartTime)
      return start >= ohStart && start < ohEnd
    })
    if (!oh || oh.price_per_hour_cents === 0) return 0
    return Math.round((oh.price_per_hour_cents * selectedDuration) / 60)
  }, [selectedStartTime, selectedDuration, availability])

  const handleConfirm = useCallback(() => {
    if (!selectedStartTime || !selectedDuration) return
    const endTime = minutesToTime(timeToMinutes(selectedStartTime) + selectedDuration)
    onSelect({
      date,
      startTime: selectedStartTime,
      endTime,
      priceCents: selectedPrice,
    })
  }, [selectedStartTime, selectedDuration, selectedPrice, date, onSelect])

  const hasAvailability = availability && availability.availableWindows.length > 0

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 touch-target gap-1"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Torna indietro
      </Button>

      <h2 className="font-display text-display-sm uppercase tracking-tight">
        Scegli l&apos;orario
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Seleziona orario e durata per il {formatDate(date)}
      </p>

      <div className="mt-6">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12" role="status">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
            <span className="ml-2 text-sm text-muted-foreground">
              Caricamento disponibilità...
            </span>
          </div>
        )}

        {/* Errore */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-error" role="alert">
            {error}
          </div>
        )}

        {/* Nessuna disponibilità */}
        {!loading && !error && !hasAvailability && (
          <div className="py-12 text-center">
            <Clock className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
            <p className="mt-3 text-muted-foreground">
              Nessun orario disponibile per questa data.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Prova a selezionare un altro giorno.
            </p>
          </div>
        )}

        {/* Contenuto disponibilità */}
        {!loading && !error && hasAvailability && availability && (
          <div className="space-y-6">
            {/* Timeline visuale */}
            <AvailabilityTimeline
              availability={availability}
              selectedStartTime={selectedStartTime}
              selectedDuration={selectedDuration}
            />

            {/* Selezione orario di inizio */}
            <div>
              <h3 className="text-sm font-medium mb-3">Orario di inizio</h3>
              <div
                className="grid gap-2 grid-cols-4 sm:grid-cols-6 lg:grid-cols-8"
                role="listbox"
                aria-label="Orari di inizio disponibili"
              >
                {availability.startTimes.map((time) => (
                  <button
                    key={time}
                    type="button"
                    role="option"
                    aria-selected={selectedStartTime === time}
                    onClick={() => {
                      setSelectedStartTime(time)
                      setSelectedDuration(null)
                    }}
                    className={cn(
                      "rounded-md border px-3 py-2 font-mono text-sm transition-all touch-target",
                      selectedStartTime === time
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Selezione durata */}
            {selectedStartTime && preview && durationOptions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-1">Durata</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Disponibile fino alle {formatTime(preview.maxEndTime)} (max {preview.maxDurationMinutes} min)
                </p>
                <div
                  className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                  role="listbox"
                  aria-label="Opzioni durata"
                >
                  {durationOptions.map((opt) => (
                    <button
                      key={opt.minutes}
                      type="button"
                      role="option"
                      aria-selected={selectedDuration === opt.minutes}
                      onClick={() => setSelectedDuration(opt.minutes)}
                      className={cn(
                        "rounded-md border px-3 py-2.5 text-sm transition-all touch-target text-left",
                        selectedDuration === opt.minutes
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                      )}
                    >
                      <span className="font-medium">{opt.label}</span>
                      <span className="block font-mono text-xs opacity-70 mt-0.5">
                        {selectedStartTime}–{opt.endTime}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Riepilogo e conferma */}
            {selectedStartTime && selectedDuration && (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">La tua selezione</p>
                    <p className="font-mono text-lg font-semibold mt-0.5">
                      {selectedStartTime} — {minutesToTime(timeToMinutes(selectedStartTime) + selectedDuration)}
                    </p>
                    {selectedPrice > 0 && (
                      <p className="text-sm font-medium text-primary mt-0.5">
                        {formatPrice(selectedPrice)}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleConfirm}
                    className="touch-target"
                  >
                    Conferma orario
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Barra visuale che mostra le fasce di apertura, blocchi e prenotazioni */
function AvailabilityTimeline({
  availability,
  selectedStartTime,
  selectedDuration,
}: {
  availability: AvailabilityResponse
  selectedStartTime: string | null
  selectedDuration: number | null
}) {
  // Calcola i limiti della giornata dalle fasce di apertura
  const { dayStart, dayEnd } = useMemo(() => {
    const allStarts = availability.openingRanges.map((r) => timeToMinutes(r.start))
    const allEnds = availability.openingRanges.map((r) => timeToMinutes(r.end))
    return {
      dayStart: Math.min(...allStarts),
      dayEnd: Math.max(...allEnds),
    }
  }, [availability.openingRanges])

  const totalMinutes = dayEnd - dayStart

  function getPosition(time: string): number {
    if (totalMinutes <= 0) return 0
    const minutes = timeToMinutes(time)
    return ((minutes - dayStart) / totalMinutes) * 100
  }

  function getWidth(start: string, end: string): number {
    if (totalMinutes <= 0) return 0
    return ((timeToMinutes(end) - timeToMinutes(start)) / totalMinutes) * 100
  }

  // Genera le etichette orarie
  const hourLabels = useMemo(() => {
    if (totalMinutes <= 0) return []
    const labels: string[] = []
    const startHour = Math.floor(dayStart / 60)
    const endHour = Math.ceil(dayEnd / 60)
    for (let h = startHour; h <= endHour; h++) {
      labels.push(`${String(h).padStart(2, "0")}:00`)
    }
    return labels
  }, [dayStart, dayEnd, totalMinutes])

  if (totalMinutes <= 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Disponibilità</h3>
      <div className="relative">
        {/* Etichette orarie */}
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono mb-1">
          {hourLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        {/* Barra timeline */}
        <div className="relative h-10 rounded-md bg-muted/50 border overflow-hidden">
          {/* Fasce di apertura (verde chiaro) */}
          {availability.openingRanges.map((range, i) => (
            <div
              key={`open-${i}`}
              className="absolute top-0 h-full bg-emerald-100 dark:bg-emerald-900/30"
              style={{
                left: `${getPosition(range.start)}%`,
                width: `${getWidth(range.start, range.end)}%`,
              }}
            />
          ))}

          {/* Blocchi admin (rosso) */}
          {availability.blocks.map((block, i) => (
            <div
              key={`block-${i}`}
              className="absolute top-0 h-full bg-red-200/80 dark:bg-red-900/40"
              style={{
                left: `${getPosition(block.start)}%`,
                width: `${getWidth(block.start, block.end)}%`,
              }}
              title={block.reason || "Bloccato"}
            />
          ))}

          {/* Prenotazioni esistenti (ambra per pending, blu per confermate) */}
          {availability.bookings.map((booking) => (
            <div
              key={booking.id}
              className={cn(
                "absolute top-1 bottom-1 rounded-sm",
                booking.status === "confirmed"
                  ? "bg-blue-400/60 dark:bg-blue-500/40"
                  : "bg-amber-400/60 dark:bg-amber-500/40"
              )}
              style={{
                left: `${getPosition(booking.start)}%`,
                width: `${getWidth(booking.start, booking.end)}%`,
              }}
              title={`${booking.user_name} (${booking.status === "confirmed" ? "confermata" : "in attesa"})`}
            />
          ))}

          {/* Selezione utente (primario) */}
          {selectedStartTime && selectedDuration && (
            <div
              className="absolute top-0.5 bottom-0.5 rounded-sm bg-primary/70 border border-primary"
              style={{
                left: `${getPosition(selectedStartTime)}%`,
                width: `${getWidth(selectedStartTime, minutesToTime(timeToMinutes(selectedStartTime) + selectedDuration))}%`,
              }}
            />
          )}
        </div>

        {/* Legenda */}
        <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-emerald-100 dark:bg-emerald-900/30 border" />
            Aperto
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-blue-400/60" />
            Prenotato
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-amber-400/60" />
            In attesa
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-red-200/80" />
            Bloccato
          </span>
        </div>
      </div>
    </div>
  )
}

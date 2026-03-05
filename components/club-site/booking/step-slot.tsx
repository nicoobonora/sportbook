/**
 * Step 3: Selezione orario/slot disponibile.
 * Mostra una griglia di slot per la data selezionata.
 * Slot pieni o bloccati sono disabilitati con aria-disabled.
 */
"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Clock, Loader2 } from "lucide-react"
import type { Slot } from "@/lib/types/database"
import { cn } from "@/lib/utils"
import { formatDate, formatTime, formatPrice } from "@/lib/utils/dates"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type Props = {
  clubId: string
  fieldId: string
  date: string
  onSelect: (slot: Slot) => void
  onBack: () => void
}

export function StepSlot({ clubId, fieldId, date, onSelect, onBack }: Props) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({ club_id: clubId, field_id: fieldId, date })
        const response = await fetch(`/api/slots?${params}`)

        if (!response.ok) {
          throw new Error("Errore nel caricamento degli slot")
        }

        const data = await response.json()
        setSlots(data)
      } catch {
        setError("Impossibile caricare gli orari disponibili. Riprova.")
      } finally {
        setLoading(false)
      }
    }

    fetchSlots()
  }, [clubId, fieldId, date])

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
        Orari disponibili per il {formatDate(date)}
      </p>

      <div className="mt-6">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12" role="status">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
            <span className="ml-2 text-sm text-muted-foreground">
              Caricamento orari...
            </span>
          </div>
        )}

        {/* Errore */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-error" role="alert">
            {error}
          </div>
        )}

        {/* Nessuno slot */}
        {!loading && !error && slots.length === 0 && (
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

        {/* Griglia slot */}
        {!loading && !error && slots.length > 0 && (
          <div
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            role="listbox"
            aria-label="Orari disponibili"
          >
            {slots.map((slot) => {
              const isFull = slot.current_bookings >= slot.max_bookings

              return (
                <button
                  key={slot.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  aria-disabled={isFull}
                  disabled={isFull}
                  onClick={() => !isFull && onSelect(slot)}
                  className="w-full text-left touch-target"
                >
                  <Card
                    className={cn(
                      "p-4 transition-all",
                      isFull
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:shadow-md hover:ring-1 hover:ring-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-lg font-semibold">
                          {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                        </p>
                        {slot.price_cents > 0 && (
                          <p className="mt-1 text-sm font-medium text-primary">
                            {formatPrice(slot.price_cents)}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        {isFull ? (
                          <span className="rounded-full bg-red-200 px-2.5 py-1 text-xs font-medium text-red-900">
                            Prenotato
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-success">
                            Disponibile
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

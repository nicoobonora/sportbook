/**
 * Step 2: Selezione data dal calendario.
 * Calendario mensile navigabile da tastiera.
 * Disabilita le date passate.
 */
"use client"

import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, startOfDay, getDay, isEqual } from "date-fns"
import { it } from "date-fns/locale"
import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  clubId: string
  fieldId: string
  selectedDate: string | null
  onSelect: (date: string) => void
  onBack: () => void
}

export function StepDate({ selectedDate, onSelect, onBack }: Props) {
  const today = startOfDay(new Date())
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today))

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Calcola il padding per allineare il primo giorno della settimana
  // getDay: 0=domenica, in Italia la settimana inizia di lunedì
  const firstDayOffset = useMemo(() => {
    const day = getDay(startOfMonth(currentMonth))
    return day === 0 ? 6 : day - 1 // Converti: lun=0, mar=1, ..., dom=6
  }, [currentMonth])

  const selectedDateObj = selectedDate ? new Date(selectedDate) : null

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
        Scegli la data
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Seleziona il giorno in cui vuoi prenotare
      </p>

      <Card className="mt-6 max-w-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="touch-target"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), today)}
            aria-label="Mese precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-base capitalize" aria-live="polite">
            {format(currentMonth, "MMMM yyyy", { locale: it })}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="touch-target"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            aria-label="Mese successivo"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          {/* Intestazioni giorni della settimana */}
          <div className="grid grid-cols-7 text-center" role="row">
            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
              <div
                key={day}
                className="py-2 text-xs font-medium text-muted-foreground"
                role="columnheader"
                aria-label={day}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Griglia giorni */}
          <div className="grid grid-cols-7" role="grid" aria-label="Calendario">
            {/* Celle vuote per l'offset del primo giorno */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} role="gridcell" />
            ))}

            {days.map((day) => {
              const isPast = isBefore(day, today)
              const isSelected = selectedDateObj && isEqual(day, selectedDateObj)
              const isToday = isEqual(day, today)
              const dateStr = format(day, "yyyy-MM-dd")

              return (
                <button
                  key={dateStr}
                  type="button"
                  role="gridcell"
                  disabled={isPast}
                  aria-selected={isSelected || undefined}
                  aria-label={format(day, "EEEE d MMMM yyyy", { locale: it })}
                  onClick={() => onSelect(dateStr)}
                  className={cn(
                    "mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors",
                    "hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    isPast && "cursor-not-allowed text-muted-foreground/40",
                    isToday && !isSelected && "font-bold text-primary",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                    !isPast && !isSelected && "text-foreground"
                  )}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

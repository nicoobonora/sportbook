/**
 * Gestore fasce orarie di apertura.
 * Permette all'admin di configurare le fasce di apertura per ogni campo,
 * gestire i blocchi e visualizzare la programmazione settimanale.
 */
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2, Clock, Ban, MoreVertical } from "lucide-react"
import type { Field, OpeningHours, SlotBlock } from "@/lib/types/database"
import { DAYS_OF_WEEK, formatTime } from "@/lib/utils/dates"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BlockDialog } from "./block-dialog"
import { BlockList } from "./block-list"

/** Giorni in ordine Lun–Dom (day_of_week: 1–6, 0) */
const WEEKDAYS_ORDERED = [
  { index: 1, label: "Lun", full: "Lunedì" },
  { index: 2, label: "Mar", full: "Martedì" },
  { index: 3, label: "Mer", full: "Mercoledì" },
  { index: 4, label: "Gio", full: "Giovedì" },
  { index: 5, label: "Ven", full: "Venerdì" },
  { index: 6, label: "Sab", full: "Sabato" },
  { index: 0, label: "Dom", full: "Domenica" },
] as const

type Props = {
  clubId: string
  fields: Field[]
  openingHours: OpeningHours[]
  blocks: SlotBlock[]
}

export function OpeningHoursManager({ clubId, fields, openingHours, blocks }: Props) {
  const router = useRouter()

  const [selectedFieldId, setSelectedFieldId] = useState(fields[0]?.id ?? "")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDialogDay, setAddDialogDay] = useState(1)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [blockDialogDay, setBlockDialogDay] = useState<number | undefined>()
  const [blockDialogStart, setBlockDialogStart] = useState<string | undefined>()
  const [blockDialogEnd, setBlockDialogEnd] = useState<string | undefined>()

  // Filtra per campo selezionato
  const fieldHours = useMemo(
    () => openingHours.filter((oh) => oh.field_id === selectedFieldId),
    [openingHours, selectedFieldId]
  )
  const fieldBlocks = useMemo(
    () => blocks.filter((b) => b.field_id === selectedFieldId),
    [blocks, selectedFieldId]
  )

  const selectedField = fields.find((f) => f.id === selectedFieldId)

  // Raggruppa per giorno
  const hoursByDay = useMemo(() => {
    const result: Record<number, OpeningHours[]> = {}
    for (const day of WEEKDAYS_ORDERED) {
      result[day.index] = fieldHours
        .filter((oh) => oh.day_of_week === day.index && oh.is_active)
        .sort((a, b) => a.start_time.localeCompare(b.start_time))
    }
    return result
  }, [fieldHours])

  // Blocchi ricorrenti per giorno
  const recurringBlocks = useMemo(() => {
    const result: Record<number, SlotBlock[]> = {}
    for (const block of fieldBlocks) {
      if (block.block_type === "recurring" && block.day_of_week !== null) {
        if (!result[block.day_of_week]) result[block.day_of_week] = []
        result[block.day_of_week].push(block)
      }
    }
    return result
  }, [fieldBlocks])

  function handleAddHours(dayOfWeek: number) {
    setAddDialogDay(dayOfWeek)
    setAddDialogOpen(true)
  }

  async function handleDeleteHours(id: string) {
    if (!confirm("Eliminare questa fascia oraria?")) return
    const supabase = createClient()
    await supabase
      .from("opening_hours")
      .delete()
      .eq("id", id)
      .eq("club_id", clubId)
    router.refresh()
  }

  function handleBlockSlot(dayOfWeek: number, startTime?: string, endTime?: string) {
    setBlockDialogDay(dayOfWeek)
    setBlockDialogStart(startTime)
    setBlockDialogEnd(endTime)
    setBlockDialogOpen(true)
  }

  // Empty state
  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Nessuna struttura configurata.</p>
          <p className="mt-1 text-sm">
            Aggiungi le strutture dalle impostazioni prima di configurare gli orari.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Selettore campo ── */}
      {fields.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fields.map((field) => (
            <Button
              key={field.id}
              variant={selectedFieldId === field.id ? "default" : "outline"}
              size="sm"
              className="shrink-0 touch-target"
              onClick={() => setSelectedFieldId(field.id)}
            >
              {field.name}
              <span className="ml-1.5 text-xs opacity-70">({field.sport})</span>
            </Button>
          ))}
        </div>
      )}

      {selectedField && fields.length <= 1 && (
        <p className="text-sm text-muted-foreground">
          {selectedField.name} ({selectedField.sport})
        </p>
      )}

      {/* ── Griglia settimanale ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Fasce di apertura
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop */}
          <div className="hidden md:block">
            <div className="grid grid-cols-7 gap-3">
              {WEEKDAYS_ORDERED.map((day) => {
                const hours = hoursByDay[day.index] || []
                const dayBlocks = recurringBlocks[day.index] || []

                return (
                  <div key={day.index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{day.label}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleAddHours(day.index)}
                        aria-label={`Aggiungi fascia oraria per ${day.full}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {hours.length === 0 && dayBlocks.length === 0 && (
                      <p className="text-[10px] text-muted-foreground">Chiuso</p>
                    )}

                    {hours.map((oh) => (
                      <div
                        key={oh.id}
                        className="group relative rounded-md border border-primary/20 bg-primary/5 p-1.5"
                      >
                        <p className="font-mono text-xs">
                          {formatTime(oh.start_time)}–{formatTime(oh.end_time)}
                        </p>
                        {oh.price_per_hour_cents > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            {(oh.price_per_hour_cents / 100).toFixed(2)}€/h
                          </p>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-0.5 top-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 focus:opacity-100"
                              aria-label="Azioni"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleBlockSlot(
                                day.index,
                                formatTime(oh.start_time),
                                formatTime(oh.end_time)
                              )}
                            >
                              <Ban className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                              Blocca
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteHours(oh.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}

                    {/* Blocchi ricorrenti */}
                    {dayBlocks.map((block) => (
                      <div
                        key={block.id}
                        className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 p-1.5"
                      >
                        <div className="flex items-center gap-0.5">
                          <Ban className="h-2.5 w-2.5 text-red-500" aria-hidden="true" />
                          <span className="text-[10px] text-red-600 font-medium">Bloccato</span>
                        </div>
                        {block.start_time && block.end_time && (
                          <p className="font-mono text-[10px] text-red-500 mt-0.5">
                            {formatTime(block.start_time)}–{formatTime(block.end_time)}
                          </p>
                        )}
                        {!block.start_time && (
                          <p className="text-[10px] text-red-500">Tutto il giorno</p>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mobile: vista a tabs */}
          <MobileOpeningHoursView
            hoursByDay={hoursByDay}
            recurringBlocks={recurringBlocks}
            onAddHours={handleAddHours}
            onDeleteHours={handleDeleteHours}
            onBlockSlot={handleBlockSlot}
          />
        </CardContent>
      </Card>

      {/* ── Lista blocchi ── */}
      <BlockList blocks={fieldBlocks} clubId={clubId} />

      {/* ── Dialog ── */}
      <AddOpeningHoursDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        clubId={clubId}
        fieldId={selectedFieldId}
        dayOfWeek={addDialogDay}
      />

      <BlockDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        clubId={clubId}
        fieldId={selectedFieldId}
        defaultDayOfWeek={blockDialogDay}
        defaultStartTime={blockDialogStart}
        defaultEndTime={blockDialogEnd}
      />
    </div>
  )
}

/** Vista mobile: un giorno alla volta */
function MobileOpeningHoursView({
  hoursByDay,
  recurringBlocks,
  onAddHours,
  onDeleteHours,
  onBlockSlot,
}: {
  hoursByDay: Record<number, OpeningHours[]>
  recurringBlocks: Record<number, SlotBlock[]>
  onAddHours: (day: number) => void
  onDeleteHours: (id: string) => void
  onBlockSlot: (day: number, start?: string, end?: string) => void
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const activeDay = selectedDay ?? 1

  const hours = hoursByDay[activeDay] || []
  const blocks = recurringBlocks[activeDay] || []
  const dayLabel = WEEKDAYS_ORDERED.find((d) => d.index === activeDay)?.full ?? ""

  return (
    <div className="md:hidden">
      <div className="flex gap-1 overflow-x-auto pb-2">
        {WEEKDAYS_ORDERED.map((day) => (
          <Button
            key={day.index}
            variant={activeDay === day.index ? "default" : "outline"}
            size="sm"
            className="shrink-0 text-xs"
            onClick={() => setSelectedDay(day.index)}
          >
            {day.label}
            {(hoursByDay[day.index]?.length ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-1 text-[9px] px-1 py-0">
                {hoursByDay[day.index].length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <div className="space-y-2 mt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{dayLabel}</h3>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs touch-target"
            onClick={() => onAddHours(activeDay)}
          >
            <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
            Aggiungi fascia
          </Button>
        </div>

        {hours.length === 0 && blocks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nessuna fascia oraria configurata — chiuso.
          </p>
        )}

        {hours.map((oh) => (
          <div
            key={oh.id}
            className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/10 p-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-medium">
                {formatTime(oh.start_time)}–{formatTime(oh.end_time)}
              </span>
              {oh.price_per_hour_cents > 0 && (
                <span className="text-xs text-muted-foreground">
                  {(oh.price_per_hour_cents / 100).toFixed(2)}€/h
                </span>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 touch-target" aria-label="Azioni">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onBlockSlot(activeDay, formatTime(oh.start_time), formatTime(oh.end_time))}
                >
                  <Ban className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                  Blocca
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeleteHours(oh.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                  Elimina
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {blocks.map((block) => (
          <div
            key={block.id}
            className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 p-2.5"
          >
            <div className="flex items-center gap-2">
              <Ban className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
              <span className="text-sm text-red-600 font-medium">
                {block.start_time && block.end_time
                  ? `${formatTime(block.start_time)}–${formatTime(block.end_time)}`
                  : "Tutto il giorno"}
              </span>
              {block.reason && (
                <span className="text-xs text-muted-foreground">
                  {block.reason}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Dialog per aggiungere una fascia oraria */
function AddOpeningHoursDialog({
  open,
  onOpenChange,
  clubId,
  fieldId,
  dayOfWeek,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  clubId: string
  fieldId: string
  dayOfWeek: number
}) {
  const router = useRouter()
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("19:00")
  const [priceCents, setPriceCents] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (startTime >= endTime) {
      setError("L'orario di inizio deve essere prima dell'orario di fine.")
      return
    }

    setSubmitting(true)
    setError(null)

    const supabase = createClient()

    const { error: insertError } = await supabase
      .from("opening_hours")
      .insert({
        club_id: clubId,
        field_id: fieldId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        price_per_hour_cents: priceCents,
        is_active: true,
      })

    setSubmitting(false)

    if (insertError) {
      setError("Errore durante il salvataggio.")
      return
    }

    onOpenChange(false)
    setStartTime("09:00")
    setEndTime("19:00")
    setPriceCents(0)
    router.refresh()
  }

  function handleClose(open: boolean) {
    if (!open) setError(null)
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Aggiungi fascia oraria — {DAYS_OF_WEEK[dayOfWeek]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="oh-start">Apertura</Label>
              <Input
                id="oh-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="oh-end">Chiusura</Label>
              <Input
                id="oh-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="oh-price">Prezzo orario (€/h)</Label>
            <Input
              id="oh-price"
              type="number"
              min={0}
              step={0.5}
              value={priceCents / 100}
              onChange={(e) =>
                setPriceCents(Math.round(parseFloat(e.target.value || "0") * 100))
              }
            />
            <p className="text-xs text-muted-foreground">
              Lascia 0 per gratuito. Il prezzo sarà calcolato in base alla durata della prenotazione.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600" role="alert">
              {error}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full touch-target"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Salvataggio...
              </>
            ) : (
              "Aggiungi fascia oraria"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Griglia calendario settimanale per la gestione degli slot.
 * Mostra 7 colonne (Lun–Dom) con righe temporali.
 * Colori: grigio = default, primario = custom, rosso = bloccato.
 */
"use client"

import { useMemo, useState } from "react"
import { Plus, Ban, Pencil, Trash2, MoreVertical } from "lucide-react"
import type { SlotTemplate, SlotBlock } from "@/lib/types/database"
import { generateDefaultSlots } from "@/lib/constants/scheduling"
import { formatTime } from "@/lib/utils/dates"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

type SlotInfo = {
  start_time: string
  end_time: string
  price_cents: number
  max_bookings: number
  type: "default" | "custom"
  templateId?: string
}

type Props = {
  templates: SlotTemplate[]
  blocks: SlotBlock[]
  onAddTemplate: (dayOfWeek: number) => void
  onEditTemplate: (template: SlotTemplate) => void
  onDeleteTemplate: (templateId: string) => void
  onBlockSlot: (dayOfWeek: number, startTime?: string, endTime?: string) => void
}

export function ScheduleGrid({
  templates,
  blocks,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onBlockSlot,
}: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const defaultSlots = useMemo(() => generateDefaultSlots(), [])

  // Calcola gli slot per ogni giorno della settimana
  const weekSlots = useMemo(() => {
    const result: Record<number, SlotInfo[]> = {}

    for (const day of WEEKDAYS_ORDERED) {
      const dayTemplates = templates.filter(
        (t) => t.day_of_week === day.index && t.is_active
      )

      if (dayTemplates.length > 0) {
        result[day.index] = dayTemplates
          .map((t) => ({
            start_time: t.start_time,
            end_time: t.end_time,
            price_cents: t.price_cents,
            max_bookings: t.max_bookings,
            type: "custom" as const,
            templateId: t.id,
          }))
          .sort((a, b) => a.start_time.localeCompare(b.start_time))
      } else {
        result[day.index] = defaultSlots.map((s) => ({
          ...s,
          type: "default" as const,
        }))
      }
    }

    return result
  }, [templates, defaultSlots])

  // Blocchi ricorrenti per giorno
  const recurringBlocks = useMemo(() => {
    const result: Record<number, SlotBlock[]> = {}
    for (const block of blocks) {
      if (block.block_type === "recurring" && block.day_of_week !== null) {
        if (!result[block.day_of_week]) result[block.day_of_week] = []
        result[block.day_of_week].push(block)
      }
    }
    return result
  }, [blocks])

  // Calcola tutte le fasce orarie uniche per l'asse Y
  const allTimeSlots = useMemo(() => {
    const times = new Set<string>()
    for (const daySlots of Object.values(weekSlots)) {
      for (const slot of daySlots) {
        times.add(slot.start_time.substring(0, 5))
      }
    }
    return Array.from(times).sort()
  }, [weekSlots])

  function isSlotBlocked(dayOfWeek: number, startTime: string, endTime: string): boolean {
    const dayBlocks = recurringBlocks[dayOfWeek] || []
    return dayBlocks.some((block) => {
      if (!block.start_time || !block.end_time) return true
      const bStart = block.start_time.substring(0, 5)
      const bEnd = block.end_time.substring(0, 5)
      return startTime < bEnd && endTime > bStart
    })
  }

  return (
    <div className="space-y-4">
      {/* ── Desktop: griglia 7 colonne ── */}
      <div className="hidden md:block overflow-x-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-border rounded-lg overflow-hidden min-w-[700px]">
          {/* Header: vuoto + giorni */}
          <div className="bg-card p-2" />
          {WEEKDAYS_ORDERED.map((day) => {
            const hasCustom = templates.some(
              (t) => t.day_of_week === day.index && t.is_active
            )
            return (
              <div
                key={day.index}
                className="bg-card p-2 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm font-semibold">{day.label}</span>
                  {hasCustom && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      custom
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-6 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onAddTemplate(day.index)}
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  Slot
                </Button>
              </div>
            )
          })}

          {/* Righe temporali */}
          {allTimeSlots.map((time) => (
            <>
              <div
                key={`time-${time}`}
                className="bg-card p-2 flex items-start justify-end"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {time}
                </span>
              </div>
              {WEEKDAYS_ORDERED.map((day) => {
                const slot = weekSlots[day.index]?.find(
                  (s) => s.start_time.substring(0, 5) === time
                )

                if (!slot) {
                  return (
                    <div
                      key={`${day.index}-${time}`}
                      className="bg-card p-1"
                    />
                  )
                }

                const blocked = isSlotBlocked(
                  day.index,
                  slot.start_time.substring(0, 5),
                  slot.end_time.substring(0, 5)
                )

                return (
                  <TimeSlotCell
                    key={`${day.index}-${time}`}
                    slot={slot}
                    blocked={blocked}
                    onEdit={
                      slot.type === "custom" && slot.templateId
                        ? () => {
                            const tpl = templates.find(
                              (t) => t.id === slot.templateId
                            )
                            if (tpl) onEditTemplate(tpl)
                          }
                        : undefined
                    }
                    onDelete={
                      slot.type === "custom" && slot.templateId
                        ? () => onDeleteTemplate(slot.templateId!)
                        : undefined
                    }
                    onBlock={() =>
                      onBlockSlot(
                        day.index,
                        slot.start_time.substring(0, 5),
                        slot.end_time.substring(0, 5)
                      )
                    }
                  />
                )
              })}
            </>
          ))}
        </div>
      </div>

      {/* ── Mobile: vista singolo giorno con tabs ── */}
      <div className="md:hidden">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {WEEKDAYS_ORDERED.map((day) => (
            <Button
              key={day.index}
              variant={selectedDay === day.index || (selectedDay === null && day.index === 1) ? "default" : "outline"}
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => setSelectedDay(day.index)}
            >
              {day.label}
            </Button>
          ))}
        </div>

        <MobileDayView
          dayOfWeek={selectedDay ?? 1}
          dayLabel={WEEKDAYS_ORDERED.find((d) => d.index === (selectedDay ?? 1))?.full ?? "Lunedì"}
          slots={weekSlots[selectedDay ?? 1] || []}
          blocks={recurringBlocks[selectedDay ?? 1] || []}
          templates={templates}
          onAddTemplate={onAddTemplate}
          onEditTemplate={onEditTemplate}
          onDeleteTemplate={onDeleteTemplate}
          onBlockSlot={onBlockSlot}
        />
      </div>
    </div>
  )
}

/** Cella singola nella griglia desktop */
function TimeSlotCell({
  slot,
  blocked,
  onEdit,
  onDelete,
  onBlock,
}: {
  slot: SlotInfo
  blocked: boolean
  onEdit?: () => void
  onDelete?: () => void
  onBlock: () => void
}) {
  const start = formatTime(slot.start_time)
  const end = formatTime(slot.end_time)

  const bgClass = blocked
    ? "bg-red-50 dark:bg-red-950/30 border-l-2 border-red-400"
    : slot.type === "custom"
      ? "bg-primary/10 border-l-2 border-primary"
      : "bg-muted/50"

  return (
    <div className={`relative p-1.5 ${bgClass} group`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs leading-tight">
            {start}–{end}
          </p>
          {slot.price_cents > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {(slot.price_cents / 100).toFixed(2)}€
            </p>
          )}
          {blocked && (
            <div className="flex items-center gap-0.5 mt-0.5">
              <Ban className="h-2.5 w-2.5 text-red-500" aria-hidden="true" />
              <span className="text-[10px] text-red-500">Bloccato</span>
            </div>
          )}
        </div>

        {/* Menu azioni */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
              aria-label="Azioni slot"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                Modifica
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onBlock}>
              <Ban className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
              Blocca
            </DropdownMenuItem>
            {onDelete && (
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                Elimina
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

/** Vista mobile: un giorno alla volta */
function MobileDayView({
  dayOfWeek,
  dayLabel,
  slots,
  blocks,
  templates,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onBlockSlot,
}: {
  dayOfWeek: number
  dayLabel: string
  slots: SlotInfo[]
  blocks: SlotBlock[]
  templates: SlotTemplate[]
  onAddTemplate: (day: number) => void
  onEditTemplate: (tpl: SlotTemplate) => void
  onDeleteTemplate: (id: string) => void
  onBlockSlot: (day: number, start?: string, end?: string) => void
}) {
  function isBlocked(startTime: string, endTime: string): boolean {
    return blocks.some((block) => {
      if (!block.start_time || !block.end_time) return true
      const bStart = block.start_time.substring(0, 5)
      const bEnd = block.end_time.substring(0, 5)
      return startTime < bEnd && endTime > bStart
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{dayLabel}</h3>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs touch-target"
          onClick={() => onAddTemplate(dayOfWeek)}
        >
          <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
          Aggiungi slot
        </Button>
      </div>

      <div className="space-y-1">
        {slots.map((slot) => {
          const start = formatTime(slot.start_time)
          const end = formatTime(slot.end_time)
          const blocked = isBlocked(start, end)

          return (
            <div
              key={`${slot.start_time}-${slot.end_time}`}
              className={`flex items-center justify-between rounded-md p-2.5 ${
                blocked
                  ? "bg-red-50 dark:bg-red-950/30 border border-red-200"
                  : slot.type === "custom"
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-muted/50 border border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium">
                  {start}–{end}
                </span>
                {slot.price_cents > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {(slot.price_cents / 100).toFixed(2)}€
                  </span>
                )}
                {blocked && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    Bloccato
                  </Badge>
                )}
                {slot.type === "default" && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Default
                  </Badge>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 touch-target"
                    aria-label="Azioni slot"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {slot.type === "custom" && slot.templateId && (
                    <DropdownMenuItem
                      onClick={() => {
                        const tpl = templates.find(
                          (t) => t.id === slot.templateId
                        )
                        if (tpl) onEditTemplate(tpl)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                      Modifica
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onBlockSlot(dayOfWeek, start, end)}
                  >
                    <Ban className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                    Blocca
                  </DropdownMenuItem>
                  {slot.type === "custom" && slot.templateId && (
                    <DropdownMenuItem
                      onClick={() => onDeleteTemplate(slot.templateId!)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                      Elimina
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}

        {slots.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nessuno slot configurato per questo giorno.
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Dialog per creare un blocco (eccezione) sugli slot.
 * Supporta blocchi su data specifica e blocchi ricorrenti,
 * con fascia oraria opzionale.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Calendar, Repeat } from "lucide-react"
import { DAYS_OF_WEEK } from "@/lib/utils/dates"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clubId: string
  fieldId: string
  defaultDayOfWeek?: number
  defaultStartTime?: string
  defaultEndTime?: string
}

export function BlockDialog({
  open,
  onOpenChange,
  clubId,
  fieldId,
  defaultDayOfWeek,
  defaultStartTime,
  defaultEndTime,
}: Props) {
  const router = useRouter()
  const [blockType, setBlockType] = useState<"single_date" | "recurring">("single_date")
  const [blockDate, setBlockDate] = useState("")
  const [dayOfWeek, setDayOfWeek] = useState(defaultDayOfWeek ?? 1)
  const [allDay, setAllDay] = useState(!defaultStartTime)
  const [startTime, setStartTime] = useState(defaultStartTime ?? "09:00")
  const [endTime, setEndTime] = useState(defaultEndTime ?? "19:00")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)

    // Validazione base
    if (blockType === "single_date" && !blockDate) {
      setError("Seleziona una data.")
      setSubmitting(false)
      return
    }

    const supabase = createClient()

    const { error: insertError } = await supabase.from("slot_blocks").insert({
      club_id: clubId,
      field_id: fieldId,
      block_type: blockType,
      block_date: blockType === "single_date" ? blockDate : null,
      day_of_week: blockType === "recurring" ? dayOfWeek : null,
      start_time: allDay ? null : startTime,
      end_time: allDay ? null : endTime,
      reason: reason || null,
    })

    setSubmitting(false)

    if (insertError) {
      setError("Errore durante il salvataggio.")
      return
    }

    // Reset
    setBlockDate("")
    setReason("")
    setAllDay(!defaultStartTime)
    onOpenChange(false)
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
          <DialogTitle>Blocca slot</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo blocco */}
          <div className="space-y-1.5">
            <Label>Tipo di blocco</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={blockType === "single_date" ? "default" : "outline"}
                size="sm"
                className="touch-target"
                onClick={() => setBlockType("single_date")}
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Data specifica
              </Button>
              <Button
                type="button"
                variant={blockType === "recurring" ? "default" : "outline"}
                size="sm"
                className="touch-target"
                onClick={() => setBlockType("recurring")}
              >
                <Repeat className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Ricorrente
              </Button>
            </div>
          </div>

          {/* Data specifica */}
          {blockType === "single_date" && (
            <div className="space-y-1.5">
              <Label htmlFor="block-date">Data *</Label>
              <Input
                id="block-date"
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
              />
            </div>
          )}

          {/* Giorno ricorrente */}
          {blockType === "recurring" && (
            <div className="space-y-1.5">
              <Label>Giorno della settimana *</Label>
              <Select
                value={String(dayOfWeek)}
                onValueChange={(v) => setDayOfWeek(parseInt(v, 10))}
              >
                <SelectTrigger aria-label="Seleziona giorno">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Fascia oraria */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label>Fascia oraria</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setAllDay(!allDay)}
              >
                {allDay ? "Specifica orari" : "Tutto il giorno"}
              </Button>
            </div>
            {!allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="block-start" className="text-xs text-muted-foreground">Dalle</Label>
                  <Input
                    id="block-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="block-end" className="text-xs text-muted-foreground">Alle</Label>
                  <Input
                    id="block-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}
            {allDay && (
              <p className="text-xs text-muted-foreground">
                Verrà bloccata l&apos;intera giornata.
              </p>
            )}
          </div>

          {/* Motivo */}
          <div className="space-y-1.5">
            <Label htmlFor="block-reason">Motivo (opzionale)</Label>
            <Input
              id="block-reason"
              placeholder="Es. Manutenzione, torneo, chiusura..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
            />
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
              "Crea blocco"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

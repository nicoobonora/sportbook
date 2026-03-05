/**
 * Dialog per aggiungere template slot per un giorno.
 * Auto-genera slot consecutivi da 09:00 a 19:00 con la durata scelta.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { DAYS_OF_WEEK } from "@/lib/utils/dates"
import { DURATION_OPTIONS, generateSlotsForDuration } from "@/lib/constants/scheduling"
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
  dayOfWeek: number
  hasExistingTemplates: boolean
}

export function AddTemplateDialog({
  open,
  onOpenChange,
  clubId,
  fieldId,
  dayOfWeek,
  hasExistingTemplates,
}: Props) {
  const router = useRouter()
  const [duration, setDuration] = useState<number>(60)
  const [priceCents, setPriceCents] = useState(0)
  const [maxBookings, setMaxBookings] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmReplace, setConfirmReplace] = useState(false)

  const preview = generateSlotsForDuration(duration)

  async function handleSubmit() {
    if (hasExistingTemplates && !confirmReplace) {
      setConfirmReplace(true)
      return
    }

    setSubmitting(true)
    setError(null)

    const supabase = createClient()

    // Se ci sono template esistenti, eliminali prima
    if (hasExistingTemplates) {
      await supabase
        .from("slot_templates")
        .delete()
        .eq("club_id", clubId)
        .eq("field_id", fieldId)
        .eq("day_of_week", dayOfWeek)
    }

    // Inserisci i nuovi template
    const templates = preview.map((slot) => ({
      club_id: clubId,
      field_id: fieldId,
      day_of_week: dayOfWeek,
      start_time: slot.start_time,
      end_time: slot.end_time,
      price_cents: priceCents,
      max_bookings: maxBookings,
      is_active: true,
    }))

    const { error: insertError } = await supabase
      .from("slot_templates")
      .insert(templates)

    setSubmitting(false)

    if (insertError) {
      setError("Errore durante il salvataggio.")
      return
    }

    setConfirmReplace(false)
    onOpenChange(false)
    router.refresh()
  }

  function handleClose(open: boolean) {
    if (!open) {
      setConfirmReplace(false)
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Configura slot — {DAYS_OF_WEEK[dayOfWeek]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Durata */}
          <div className="space-y-1.5">
            <Label>Durata slot</Label>
            <Select
              value={String(duration)}
              onValueChange={(v) => {
                setDuration(parseInt(v, 10))
                setConfirmReplace(false)
              }}
            >
              <SelectTrigger aria-label="Seleziona durata">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prezzo */}
          <div className="space-y-1.5">
            <Label htmlFor="tpl-price">Prezzo (€)</Label>
            <Input
              id="tpl-price"
              type="number"
              min={0}
              step={0.5}
              value={priceCents / 100}
              onChange={(e) =>
                setPriceCents(Math.round(parseFloat(e.target.value || "0") * 100))
              }
            />
          </div>

          {/* Max prenotazioni */}
          <div className="space-y-1.5">
            <Label htmlFor="tpl-max">Prenotazioni per slot</Label>
            <Input
              id="tpl-max"
              type="number"
              min={1}
              value={maxBookings}
              onChange={(e) => setMaxBookings(parseInt(e.target.value || "1", 10))}
            />
          </div>

          {/* Anteprima slot generati */}
          <div className="space-y-1.5">
            <Label>Anteprima ({preview.length} slot)</Label>
            <div className="rounded-md border bg-muted/30 p-2 max-h-40 overflow-y-auto">
              <div className="grid grid-cols-2 gap-1">
                {preview.map((slot) => (
                  <div
                    key={slot.start_time}
                    className="font-mono text-xs bg-card rounded px-2 py-1"
                  >
                    {slot.start_time} – {slot.end_time}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Avviso sostituzione */}
          {confirmReplace && (
            <div
              className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 p-3 text-sm"
              role="alert"
            >
              Esistono già slot personalizzati per {DAYS_OF_WEEK[dayOfWeek]}.
              Premendo di nuovo verranno sostituiti con i nuovi.
            </div>
          )}

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
            ) : confirmReplace ? (
              "Conferma sostituzione"
            ) : (
              `Crea ${preview.length} slot`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

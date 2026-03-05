/**
 * Dialog per modificare un template slot esistente.
 * Permette di cambiare orario, prezzo e max prenotazioni.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import type { SlotTemplate } from "@/lib/types/database"
import { DAYS_OF_WEEK, formatTime } from "@/lib/utils/dates"
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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: SlotTemplate | null
  clubId: string
}

export function EditTemplateDialog({
  open,
  onOpenChange,
  template,
  clubId,
}: Props) {
  const router = useRouter()
  const [startTime, setStartTime] = useState(template?.start_time.substring(0, 5) ?? "09:00")
  const [endTime, setEndTime] = useState(template?.end_time.substring(0, 5) ?? "10:00")
  const [priceCents, setPriceCents] = useState(template?.price_cents ?? 0)
  const [maxBookings, setMaxBookings] = useState(template?.max_bookings ?? 1)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Aggiorna stato locale quando il template cambia
  if (template && startTime !== template.start_time.substring(0, 5) && !submitting) {
    setStartTime(template.start_time.substring(0, 5))
    setEndTime(template.end_time.substring(0, 5))
    setPriceCents(template.price_cents)
    setMaxBookings(template.max_bookings)
  }

  async function handleSave() {
    if (!template) return
    setSubmitting(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from("slot_templates")
      .update({
        start_time: startTime,
        end_time: endTime,
        price_cents: priceCents,
        max_bookings: maxBookings,
      })
      .eq("id", template.id)
      .eq("club_id", clubId)

    setSubmitting(false)

    if (updateError) {
      setError("Errore durante il salvataggio.")
      return
    }

    onOpenChange(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!template || !confirm("Eliminare questo slot dal template?")) return
    setDeleting(true)

    const supabase = createClient()
    await supabase
      .from("slot_templates")
      .delete()
      .eq("id", template.id)
      .eq("club_id", clubId)

    setDeleting(false)
    onOpenChange(false)
    router.refresh()
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Modifica slot — {DAYS_OF_WEEK[template.day_of_week]}{" "}
            {formatTime(template.start_time)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Orario */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-start">Inizio</Label>
              <Input
                id="edit-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-end">Fine</Label>
              <Input
                id="edit-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Prezzo */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-price">Prezzo (€)</Label>
            <Input
              id="edit-price"
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
            <Label htmlFor="edit-max">Prenotazioni per slot</Label>
            <Input
              id="edit-max"
              type="number"
              min={1}
              value={maxBookings}
              onChange={(e) => setMaxBookings(parseInt(e.target.value || "1", 10))}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600" role="alert">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={submitting || deleting}
              className="flex-1 touch-target"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Salvataggio...
                </>
              ) : (
                "Salva modifiche"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={submitting || deleting}
              className="touch-target text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

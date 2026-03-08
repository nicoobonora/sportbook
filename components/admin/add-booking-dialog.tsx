/**
 * Dialog per creare una prenotazione manuale dall'admin.
 * Usato per prenotazioni walk-in o telefoniche.
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  computeBookingPreview,
  generateDurationOptions,
} from "@/lib/scheduling/availability"

type FieldInfo = { id: string; name: string; sport: string }

type Props = {
  clubId: string
  fields: FieldInfo[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type AvailabilityData = {
  openingRanges: { start: string; end: string }[]
  bookings: { start: string; end: string; id: string; status: string; user_name: string }[]
  blocks: { start: string; end: string; reason: string | null }[]
  availableWindows: { start: string; end: string }[]
  startTimes: string[]
  openingHoursData: { start_time: string; end_time: string; price_per_hour_cents: number }[]
}

export function AddBookingDialog({ clubId, fields, open, onOpenChange }: Props) {
  const router = useRouter()

  // Form state
  const [fieldId, setFieldId] = useState(fields[0]?.id || "")
  const [date, setDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  })
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userPhone, setUserPhone] = useState("")
  const [notes, setNotes] = useState("")

  // Availability state
  const [availability, setAvailability] = useState<AvailabilityData | null>(null)
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch availability when field or date changes
  const fetchAvailability = useCallback(async () => {
    if (!fieldId || !date) return
    setLoadingAvailability(true)
    setStartTime("")
    setEndTime("")
    try {
      const res = await fetch(
        `/api/availability?club_id=${clubId}&field_id=${fieldId}&date=${date}`
      )
      if (res.ok) {
        const data = await res.json()
        setAvailability(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoadingAvailability(false)
    }
  }, [clubId, fieldId, date])

  useEffect(() => {
    if (open) {
      fetchAvailability()
    }
  }, [open, fetchAvailability])

  // Compute end time options based on selected start
  const endTimeOptions = (() => {
    if (!startTime || !availability) return []
    const preview = computeBookingPreview(startTime, availability)
    if (!preview) return []
    return generateDurationOptions(
      startTime,
      preview.maxEndTime,
      30,
      30,
    )
  })()

  // Reset end time if start changes
  useEffect(() => {
    setEndTime("")
  }, [startTime])

  function resetForm() {
    setStartTime("")
    setEndTime("")
    setUserName("")
    setUserEmail("")
    setUserPhone("")
    setNotes("")
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!fieldId || !date || !startTime || !endTime || !userName.trim()) {
      setError("Compila almeno campo, data, orario e nome.")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/bookings/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          club_id: clubId,
          field_id: fieldId,
          date,
          start_time: startTime,
          end_time: endTime,
          user_name: userName.trim(),
          user_email: userEmail.trim() || undefined,
          user_phone: userPhone.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Errore durante la creazione")
        return
      }

      // Successo
      resetForm()
      onOpenChange(false)
      router.refresh()
    } catch {
      setError("Errore di rete. Riprova.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nuova prenotazione
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo */}
          <div className="space-y-1.5">
            <Label htmlFor="admin-field">Campo</Label>
            <Select value={fieldId} onValueChange={setFieldId}>
              <SelectTrigger id="admin-field">
                <SelectValue placeholder="Seleziona campo" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} ({f.sport})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="space-y-1.5">
            <Label htmlFor="admin-date">Data</Label>
            <Input
              id="admin-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Orario inizio */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="admin-start">Inizio</Label>
              {loadingAvailability ? (
                <div className="flex items-center gap-2 h-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Caricamento...
                </div>
              ) : (
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger id="admin-start">
                    <SelectValue placeholder="Orario" />
                  </SelectTrigger>
                  <SelectContent>
                    {(availability?.startTimes || []).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!loadingAvailability && availability?.startTimes?.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nessun orario disponibile
                </p>
              )}
            </div>

            {/* Orario fine */}
            <div className="space-y-1.5">
              <Label htmlFor="admin-end">Fine</Label>
              <Select
                value={endTime}
                onValueChange={setEndTime}
                disabled={!startTime}
              >
                <SelectTrigger id="admin-end">
                  <SelectValue placeholder="Orario" />
                </SelectTrigger>
                <SelectContent>
                  {endTimeOptions.map((opt) => (
                    <SelectItem key={opt.endTime} value={opt.endTime}>
                      {opt.endTime} ({opt.label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dati utente */}
          <div className="space-y-1.5">
            <Label htmlFor="admin-name">Nome *</Label>
            <Input
              id="admin-name"
              placeholder="Nome del prenotante"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="Opzionale"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-phone">Telefono</Label>
              <Input
                id="admin-phone"
                type="tel"
                placeholder="Opzionale"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-notes">Note</Label>
            <Textarea
              id="admin-notes"
              placeholder="Opzionale"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Crea prenotazione
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

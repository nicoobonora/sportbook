/**
 * Step 4: Form dati utente + riepilogo prenotazione + invio.
 *
 * Campi: Nome, Email, Telefono, Note (opzionali)
 * Il riepilogo mostra struttura, data, orario e prezzo.
 * Al submit: POST /api/bookings con gestione errori inline.
 */
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, MapPin, Calendar, Clock } from "lucide-react"
import type { Field } from "@/lib/types/database"
import type { BookingTimeSelection } from "./step-time"
import {
  bookingFormSchema,
  type BookingFormValues,
} from "@/lib/validations/booking"
import { formatDate, formatTime, formatPrice } from "@/lib/utils/dates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type Props = {
  clubId: string
  field: Field
  date: string
  timeSelection: BookingTimeSelection
  onSuccess: (email?: string, bookingId?: string) => void
  onBack: () => void
}

export function StepForm({ clubId, field, date, timeSelection, onSuccess, onBack }: Props) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
  })

  async function onSubmit(data: BookingFormValues) {
    setError(null)

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        club_id: clubId,
        field_id: field.id,
        date: timeSelection.date,
        start_time: timeSelection.startTime,
        end_time: timeSelection.endTime,
      }),
    })

    if (!response.ok) {
      const result = await response.json()
      if (response.status === 409) {
        setError("L'orario selezionato non è più disponibile. Torna indietro e scegli un altro orario.")
      } else {
        setError(result.error || "Si è verificato un errore. Riprova.")
      }
      return
    }

    const result = await response.json()
    onSuccess(data.user_email, result.id)
  }

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
        Completa la prenotazione
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Inserisci i tuoi dati per completare la richiesta
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* ── Colonna sinistra: riepilogo ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riepilogo prenotazione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">{field.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{field.sport}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm">{formatDate(date)}</p>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p className="font-mono text-sm">
                {formatTime(timeSelection.startTime)} — {formatTime(timeSelection.endTime)}
              </p>
            </div>

            {timeSelection.priceCents > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Prezzo</span>
                  <span className="font-mono text-lg font-semibold text-primary">
                    {formatPrice(timeSelection.priceCents)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Colonna destra: form dati ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">I tuoi dati</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="booking-name">Nome e cognome *</Label>
                <Input
                  id="booking-name"
                  placeholder="Mario Rossi"
                  autoComplete="name"
                  aria-invalid={!!errors.user_name}
                  aria-describedby={errors.user_name ? "booking-name-error" : undefined}
                  {...register("user_name")}
                />
                {errors.user_name && (
                  <p id="booking-name-error" className="text-sm text-error" role="alert">
                    {errors.user_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking-email">Email *</Label>
                <Input
                  id="booking-email"
                  type="email"
                  placeholder="mario@email.it"
                  autoComplete="email"
                  aria-invalid={!!errors.user_email}
                  aria-describedby={errors.user_email ? "booking-email-error" : undefined}
                  {...register("user_email")}
                />
                {errors.user_email && (
                  <p id="booking-email-error" className="text-sm text-error" role="alert">
                    {errors.user_email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking-phone">Telefono *</Label>
                <Input
                  id="booking-phone"
                  type="tel"
                  placeholder="+39 333 1234567"
                  autoComplete="tel"
                  aria-invalid={!!errors.user_phone}
                  aria-describedby={errors.user_phone ? "booking-phone-error" : undefined}
                  {...register("user_phone")}
                />
                {errors.user_phone && (
                  <p id="booking-phone-error" className="text-sm text-error" role="alert">
                    {errors.user_phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking-notes">
                  Note <span className="text-muted-foreground">(opzionali)</span>
                </Label>
                <Textarea
                  id="booking-notes"
                  placeholder="Indicazioni particolari..."
                  rows={3}
                  aria-describedby="booking-notes-hint"
                  {...register("notes")}
                />
                <p id="booking-notes-hint" className="text-xs text-muted-foreground">
                  Massimo 500 caratteri
                </p>
              </div>

              {/* Errore API */}
              {error && (
                <div
                  className="rounded-md bg-red-50 p-3 text-sm text-error"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full touch-target"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Invio in corso...
                  </>
                ) : (
                  "Prenota e verifica via email"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Riceverai un&apos;email di verifica. Clicca il link nell&apos;email per confermare la prenotazione.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

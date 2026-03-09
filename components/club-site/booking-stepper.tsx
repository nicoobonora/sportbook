/**
 * Stepper di prenotazione in 4 o 5 step.
 *
 * Step 1: Scegli struttura (campo/campetto)
 * Step 2: Scegli data (calendario mensile)
 * Step 3: Scegli orario e durata (selezione flessibile)
 * Step 4: Inserisci dati (form) + riepilogo + invio
 * Step 5: Pagamento online (opzionale, solo se il circolo lo ha attivo)
 *
 * Ogni step è navigabile da tastiera con aria-current="step".
 * Nessuna registrazione richiesta per prenotare.
 */
"use client"

import { useState, useCallback, useMemo } from "react"
import type { Field } from "@/lib/types/database"
import type { BookingTimeSelection } from "./booking/step-time"
import { StepIndicator } from "./booking/step-indicator"
import { StepField } from "./booking/step-field"
import { StepDate } from "./booking/step-date"
import { StepTime } from "./booking/step-time"
import { StepForm } from "./booking/step-form"
import { BookingSuccess } from "./booking/booking-success"
import { PaymentForm } from "@/components/booking/payment-form"

type Props = {
  clubId: string
  clubName: string
  basePath?: string
  fields: Field[]
  paymentEnabled?: boolean
}

export function BookingStepper({ clubId, clubName, basePath = "", fields, paymentEnabled = false }: Props) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedField, setSelectedField] = useState<Field | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<BookingTimeSelection | null>(null)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)

  const steps = useMemo(() => {
    const base = [
      { id: 1, label: "Struttura" },
      { id: 2, label: "Data" },
      { id: 3, label: "Orario" },
      { id: 4, label: "Dati" },
    ]
    if (paymentEnabled) {
      base.push({ id: 5, label: "Pagamento" })
    }
    return base
  }, [paymentEnabled])

  const handleFieldSelect = useCallback((field: Field) => {
    setSelectedField(field)
    setSelectedDate(null)
    setSelectedTime(null)
    setCurrentStep(2)
  }, [])

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date)
    setSelectedTime(null)
    setCurrentStep(3)
  }, [])

  const handleTimeSelect = useCallback((selection: BookingTimeSelection) => {
    setSelectedTime(selection)
    setCurrentStep(4)
  }, [])

  const handleBookingSuccess = useCallback((email?: string, id?: string) => {
    setUserEmail(email || null)
    setBookingId(id || null)

    if (paymentEnabled && id) {
      // Vai allo step pagamento
      setCurrentStep(5)
    } else {
      // Nessun pagamento: prenotazione completata
      setBookingComplete(true)
    }
  }, [paymentEnabled])

  const handlePaymentSuccess = useCallback(() => {
    setBookingComplete(true)
  }, [])

  const handleSkipPayment = useCallback(async () => {
    // L'utente ha scelto "paga di persona": invia l'email di verifica ora
    if (bookingId) {
      try {
        await fetch("/api/bookings/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        })
      } catch {
        // Non blocchiamo il flusso se l'invio email fallisce
      }
    }
    setBookingComplete(true)
  }, [bookingId])

  const handleReset = useCallback(() => {
    setCurrentStep(1)
    setSelectedField(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setBookingComplete(false)
    setUserEmail(null)
    setBookingId(null)
  }, [])

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }, [])

  // Stato di successo finale
  if (bookingComplete) {
    return (
      <BookingSuccess
        clubName={clubName}
        userEmail={userEmail || undefined}
        basePath={basePath}
        onNewBooking={handleReset}
      />
    )
  }

  // Se non ci sono strutture
  if (fields.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-muted-foreground">
          Nessuna struttura disponibile al momento.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Contattaci per maggiori informazioni.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Indicatore step */}
      <StepIndicator steps={steps} currentStep={currentStep} />

      {/* Contenuto step */}
      <div className="mt-8">
        {currentStep === 1 && (
          <StepField
            fields={fields}
            selectedField={selectedField}
            onSelect={handleFieldSelect}
          />
        )}

        {currentStep === 2 && selectedField && (
          <StepDate
            clubId={clubId}
            fieldId={selectedField.id}
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
            onBack={goBack}
          />
        )}

        {currentStep === 3 && selectedField && selectedDate && (
          <StepTime
            clubId={clubId}
            fieldId={selectedField.id}
            date={selectedDate}
            onSelect={handleTimeSelect}
            onBack={goBack}
          />
        )}

        {currentStep === 4 && selectedField && selectedDate && selectedTime && (
          <StepForm
            clubId={clubId}
            field={selectedField}
            date={selectedDate}
            timeSelection={selectedTime}
            onSuccess={handleBookingSuccess}
            onBack={goBack}
          />
        )}

        {currentStep === 5 && paymentEnabled && bookingId && (
          <PaymentForm
            bookingId={bookingId}
            onSuccess={handlePaymentSuccess}
            onSkip={handleSkipPayment}
          />
        )}
      </div>
    </div>
  )
}

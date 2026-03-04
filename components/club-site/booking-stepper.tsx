/**
 * Stepper di prenotazione in 4 step.
 *
 * Step 1: Scegli struttura (campo/campetto)
 * Step 2: Scegli data (calendario mensile)
 * Step 3: Scegli orario (griglia slot)
 * Step 4: Inserisci dati (form) + riepilogo + invio
 *
 * Ogni step è navigabile da tastiera con aria-current="step".
 * Nessuna registrazione richiesta per prenotare.
 */
"use client"

import { useState, useCallback } from "react"
import type { Field, Slot } from "@/lib/types/database"
import { StepIndicator } from "./booking/step-indicator"
import { StepField } from "./booking/step-field"
import { StepDate } from "./booking/step-date"
import { StepSlot } from "./booking/step-slot"
import { StepForm } from "./booking/step-form"
import { BookingSuccess } from "./booking/booking-success"

const STEPS = [
  { id: 1, label: "Struttura" },
  { id: 2, label: "Data" },
  { id: 3, label: "Orario" },
  { id: 4, label: "Dati" },
] as const

type Props = {
  clubId: string
  clubName: string
  fields: Field[]
}

export function BookingStepper({ clubId, clubName, fields }: Props) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedField, setSelectedField] = useState<Field | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [bookingComplete, setBookingComplete] = useState(false)

  const handleFieldSelect = useCallback((field: Field) => {
    setSelectedField(field)
    setSelectedDate(null)
    setSelectedSlot(null)
    setCurrentStep(2)
  }, [])

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    setCurrentStep(3)
  }, [])

  const handleSlotSelect = useCallback((slot: Slot) => {
    setSelectedSlot(slot)
    setCurrentStep(4)
  }, [])

  const handleBookingSuccess = useCallback(() => {
    setBookingComplete(true)
  }, [])

  const handleReset = useCallback(() => {
    setCurrentStep(1)
    setSelectedField(null)
    setSelectedDate(null)
    setSelectedSlot(null)
    setBookingComplete(false)
  }, [])

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }, [])

  // Stato di successo finale
  if (bookingComplete) {
    return (
      <BookingSuccess
        clubName={clubName}
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
      <StepIndicator steps={STEPS} currentStep={currentStep} />

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
          <StepSlot
            clubId={clubId}
            fieldId={selectedField.id}
            date={selectedDate}
            onSelect={handleSlotSelect}
            onBack={goBack}
          />
        )}

        {currentStep === 4 && selectedField && selectedDate && selectedSlot && (
          <StepForm
            clubId={clubId}
            field={selectedField}
            date={selectedDate}
            slot={selectedSlot}
            onSuccess={handleBookingSuccess}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Form contatto del sito pubblico.
 * Invia il messaggio via API che lo recapita con Resend all'email del circolo.
 */
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, CheckCircle } from "lucide-react"
import {
  contactFormSchema,
  type ContactFormValues,
} from "@/lib/validations/contact"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type Props = {
  clubId: string
  clubEmail: string | null
}

export function ContactForm({ clubId, clubEmail }: Props) {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  })

  async function onSubmit(data: ContactFormValues) {
    setError(null)

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, club_id: clubId }),
    })

    if (!response.ok) {
      setError("Si è verificato un errore. Riprova più tardi.")
      return
    }

    setSent(true)
    reset()
  }

  // Stato di successo
  if (sent) {
    return (
      <div
        className="flex flex-col items-center gap-3 py-8 text-center"
        role="status"
        aria-live="polite"
      >
        <CheckCircle className="h-12 w-12 text-success" aria-hidden="true" />
        <p className="text-lg font-medium">Messaggio inviato!</p>
        <p className="text-sm text-muted-foreground">
          Ti risponderemo il prima possibile.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setSent(false)}
        >
          Invia un altro messaggio
        </Button>
      </div>
    )
  }

  if (!clubEmail) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Il form di contatto non è ancora disponibile per questo circolo.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="contact-name">Nome *</Label>
        <Input
          id="contact-name"
          placeholder="Il tuo nome"
          autoComplete="name"
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name && (
          <p id="contact-name-error" className="text-sm text-error" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">Email *</Label>
        <Input
          id="contact-email"
          type="email"
          placeholder="la-tua@email.it"
          autoComplete="email"
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p id="contact-email-error" className="text-sm text-error" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Messaggio *</Label>
        <Textarea
          id="contact-message"
          placeholder="Scrivi qui il tuo messaggio..."
          rows={5}
          aria-describedby={
            errors.message ? "contact-message-error" : "contact-message-hint"
          }
          aria-invalid={!!errors.message}
          {...register("message")}
        />
        <p id="contact-message-hint" className="text-xs text-muted-foreground">
          Minimo 10 caratteri, massimo 2000
        </p>
        {errors.message && (
          <p id="contact-message-error" className="text-sm text-error" role="alert">
            {errors.message.message}
          </p>
        )}
      </div>

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
          "Invia messaggio"
        )}
      </Button>
    </form>
  )
}

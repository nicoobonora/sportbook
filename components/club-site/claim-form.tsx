"use client"

/**
 * Form di reclamo circolo — componente client con validazione e invio.
 */
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { claimRequestSchema, CLAIM_ROLES, type ClaimRequestFormValues } from "@/lib/validations/claim"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Loader2, Send } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  proprietario: "Proprietario",
  gestore: "Gestore / Responsabile",
  collaboratore: "Collaboratore / Staff",
  altro: "Altro",
}

interface ClaimFormProps {
  clubId: string
  clubName: string
}

export function ClaimForm({ clubId, clubName }: ClaimFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimRequestFormValues>({
    resolver: zodResolver(claimRequestSchema),
    defaultValues: {
      club_id: clubId,
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      role: "proprietario",
      message: "",
    },
  })

  async function onSubmit(data: ClaimRequestFormValues) {
    setIsSubmitting(true)
    setServerError(null)

    try {
      const res = await fetch("/api/clubs/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json()
        setServerError(body.error || "Errore durante l'invio della richiesta")
        return
      }

      setIsSuccess(true)
    } catch {
      setServerError("Errore di rete. Riprova più tardi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Stato di successo
  if (isSuccess) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Richiesta inviata!</h2>
            <p className="mt-2 text-muted-foreground">
              Abbiamo ricevuto la tua richiesta per <strong>{clubName}</strong>.
              Ti contatteremo entro 24 ore per verificare la tua identità
              e attivare la tua pagina.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>I tuoi dati</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" {...register("club_id")} />

          {/* Nome e cognome */}
          <div className="space-y-1.5">
            <Label htmlFor="contact_name">Nome e cognome *</Label>
            <Input
              id="contact_name"
              placeholder="Mario Rossi"
              {...register("contact_name")}
              aria-invalid={!!errors.contact_name}
            />
            {errors.contact_name && (
              <p className="text-sm text-destructive">{errors.contact_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="contact_email">Email *</Label>
            <Input
              id="contact_email"
              type="email"
              placeholder="mario@esempio.it"
              {...register("contact_email")}
              aria-invalid={!!errors.contact_email}
            />
            {errors.contact_email && (
              <p className="text-sm text-destructive">{errors.contact_email.message}</p>
            )}
          </div>

          {/* Telefono */}
          <div className="space-y-1.5">
            <Label htmlFor="contact_phone">Telefono *</Label>
            <Input
              id="contact_phone"
              type="tel"
              placeholder="+39 333 1234567"
              {...register("contact_phone")}
              aria-invalid={!!errors.contact_phone}
            />
            {errors.contact_phone && (
              <p className="text-sm text-destructive">{errors.contact_phone.message}</p>
            )}
          </div>

          {/* Ruolo */}
          <div className="space-y-1.5">
            <Label htmlFor="role">Il tuo ruolo *</Label>
            <select
              id="role"
              {...register("role")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {CLAIM_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] || role}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {/* Messaggio opzionale */}
          <div className="space-y-1.5">
            <Label htmlFor="message">
              Messaggio <span className="text-muted-foreground">(opzionale)</span>
            </Label>
            <textarea
              id="message"
              rows={3}
              placeholder="Informazioni aggiuntive che possono aiutarci nella verifica..."
              {...register("message")}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          {/* Errore server */}
          {serverError && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Invio in corso...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Invia richiesta di reclamo
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Inviando questo form accetti di essere contattato dal team di
            PrenotaUnCampetto per la verifica della tua identità.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

/**
 * Schemi Zod per la validazione delle richieste di reclamo circoli.
 */
import { z } from "zod"

export const CLAIM_ROLES = [
  "proprietario",
  "gestore",
  "collaboratore",
  "altro",
] as const

export const claimRequestSchema = z.object({
  club_id: z.string().uuid("ID circolo non valido"),
  contact_name: z
    .string()
    .min(2, "Il nome deve avere almeno 2 caratteri")
    .max(100, "Il nome è troppo lungo"),
  contact_email: z.string().email("Inserisci un indirizzo email valido"),
  contact_phone: z
    .string()
    .min(6, "Numero di telefono non valido")
    .max(20, "Numero di telefono troppo lungo"),
  role: z.enum(CLAIM_ROLES, {
    error: "Seleziona un ruolo",
  }),
  message: z
    .string()
    .max(1000, "Il messaggio è troppo lungo")
    .optional()
    .or(z.literal("")),
})

export type ClaimRequestFormValues = z.infer<typeof claimRequestSchema>

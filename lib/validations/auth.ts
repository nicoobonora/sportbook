/**
 * Schemi Zod per la validazione dell'autenticazione.
 */
import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Inserisci un indirizzo email valido"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
})

export type LoginValues = z.infer<typeof loginSchema>

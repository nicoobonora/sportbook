/**
 * Schema Zod per il form contatti del sito pubblico.
 */
import { z } from "zod"

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, "Il nome deve avere almeno 2 caratteri")
    .max(100, "Il nome è troppo lungo"),
  email: z
    .string()
    .email("Inserisci un indirizzo email valido"),
  message: z
    .string()
    .min(10, "Il messaggio deve avere almeno 10 caratteri")
    .max(2000, "Il messaggio non può superare i 2000 caratteri"),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>

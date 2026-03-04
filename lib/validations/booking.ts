/**
 * Schemi Zod per la validazione delle prenotazioni.
 * Usati sia lato client (form) che lato server (API).
 */
import { z } from "zod"

export const bookingFormSchema = z.object({
  user_name: z
    .string()
    .min(2, "Il nome deve avere almeno 2 caratteri")
    .max(100, "Il nome è troppo lungo"),
  user_email: z
    .string()
    .email("Inserisci un indirizzo email valido"),
  user_phone: z
    .string()
    .min(8, "Il numero di telefono deve avere almeno 8 cifre")
    .max(20, "Il numero di telefono è troppo lungo")
    .regex(/^[+]?[\d\s()-]+$/, "Inserisci un numero di telefono valido"),
  notes: z
    .string()
    .max(500, "Le note non possono superare i 500 caratteri")
    .optional()
    .or(z.literal("")),
})

export const bookingCreateSchema = bookingFormSchema.extend({
  club_id: z.string().uuid(),
  slot_id: z.string().uuid(),
  field_id: z.string().uuid(),
})

export const bookingActionSchema = z.object({
  booking_id: z.string().uuid(),
  action: z.enum(["confirm", "reject"]),
  rejection_reason: z.string().max(500).optional(),
})

export type BookingFormValues = z.infer<typeof bookingFormSchema>
export type BookingCreateValues = z.infer<typeof bookingCreateSchema>
export type BookingActionValues = z.infer<typeof bookingActionSchema>

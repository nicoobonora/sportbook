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
  field_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido (YYYY-MM-DD)"),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:MM)"),
  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:MM)"),
})

/** Schema per prenotazione creata dall'admin (telefono e note opzionali) */
export const adminBookingCreateSchema = z.object({
  club_id: z.string().uuid(),
  field_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido (YYYY-MM-DD)"),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:MM)"),
  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:MM)"),
  user_name: z
    .string()
    .min(2, "Il nome deve avere almeno 2 caratteri")
    .max(100, "Il nome è troppo lungo"),
  user_email: z
    .string()
    .email("Inserisci un indirizzo email valido")
    .optional()
    .or(z.literal("")),
  user_phone: z
    .string()
    .max(20)
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(500, "Le note non possono superare i 500 caratteri")
    .optional()
    .or(z.literal("")),
})

export const bookingActionSchema = z.object({
  booking_id: z.string().uuid(),
  action: z.enum(["confirm", "reject", "cancel"]),
  rejection_reason: z.string().max(500).optional(),
})

export type BookingFormValues = z.infer<typeof bookingFormSchema>
export type BookingCreateValues = z.infer<typeof bookingCreateSchema>
export type AdminBookingCreateValues = z.infer<typeof adminBookingCreateSchema>
export type BookingActionValues = z.infer<typeof bookingActionSchema>

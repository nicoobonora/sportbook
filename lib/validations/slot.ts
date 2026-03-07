/**
 * Schemi Zod per la validazione degli slot e template.
 */
import { z } from "zod"

export const slotTemplateSchema = z.object({
  club_id: z.string().uuid(),
  field_id: z.string().uuid(),
  day_of_week: z.number().min(0).max(6),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:MM)"),
  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:MM)"),
  price_cents: z.number().min(0, "Il prezzo non può essere negativo"),
  max_bookings: z.number().min(1, "Deve esserci almeno 1 prenotazione possibile"),
  is_active: z.boolean(),
})

export const slotManualSchema = z.object({
  club_id: z.string().uuid(),
  field_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido (YYYY-MM-DD)"),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:MM)"),
  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:MM)"),
  price_cents: z.number().min(0).default(0),
  max_bookings: z.number().min(1).default(1),
  is_blocked: z.boolean().default(false),
})

export const slotBlockSchema = z.object({
  club_id: z.string().uuid(),
  field_id: z.string().uuid(),
  block_type: z.enum(["single_date", "recurring"]),
  block_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido (YYYY-MM-DD)")
    .nullable()
    .optional(),
  day_of_week: z.number().min(0).max(6).nullable().optional(),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:MM)")
    .nullable()
    .optional(),
  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:MM)")
    .nullable()
    .optional(),
  reason: z.string().max(200).optional(),
})

export const openingHoursSchema = z.object({
  club_id: z.string().uuid(),
  field_id: z.string().uuid(),
  day_of_week: z.number().min(0).max(6),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:MM)"),
  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:MM)"),
  price_per_hour_cents: z.number().min(0, "Il prezzo non può essere negativo"),
  is_active: z.boolean(),
})

export type SlotTemplateValues = z.infer<typeof slotTemplateSchema>
export type SlotManualValues = z.infer<typeof slotManualSchema>
export type SlotBlockValues = z.infer<typeof slotBlockSchema>
export type OpeningHoursValues = z.infer<typeof openingHoursSchema>

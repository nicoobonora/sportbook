/**
 * Schemi Zod per la validazione degli annunci.
 */
import { z } from "zod"

export const announcementFormSchema = z.object({
  title: z
    .string()
    .min(3, "Il titolo deve avere almeno 3 caratteri")
    .max(200, "Il titolo è troppo lungo"),
  body: z
    .string()
    .min(10, "Il contenuto deve avere almeno 10 caratteri")
    .max(10000, "Il contenuto è troppo lungo"),
  is_pinned: z.boolean().default(false),
  expires_at: z
    .string()
    .optional()
    .or(z.literal("")),
})

export const announcementCreateSchema = announcementFormSchema.extend({
  club_id: z.string().uuid(),
  image_url: z.string().url().optional().or(z.literal("")).or(z.null()),
})

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>

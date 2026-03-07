/**
 * Schemi Zod per la validazione dei circoli sportivi.
 */
import { z } from "zod"

const SPORTS_OPTIONS = [
  "calcetto",
  "calcio",
  "padel",
  "tennis",
  "basket",
  "pallavolo",
  "nuoto",
  "beach-volley",
  "ping-pong",
  "badminton",
  "fitness",
  "crossfit",
  "yoga",
  "golf",
  "rugby",
  "atletica",
] as const

export const clubFormSchema = z.object({
  name: z
    .string()
    .min(2, "Il nome deve avere almeno 2 caratteri")
    .max(100, "Il nome è troppo lungo"),
  slug: z
    .string()
    .min(2, "Lo slug deve avere almeno 2 caratteri")
    .max(50, "Lo slug è troppo lungo")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lo slug può contenere solo lettere minuscole, numeri e trattini"
    ),
  tagline: z
    .string()
    .max(200, "Il tagline non può superare i 200 caratteri")
    .optional()
    .or(z.literal("")),
  about_text: z
    .string()
    .max(5000, "Il testo about è troppo lungo")
    .optional()
    .or(z.literal("")),
  sports: z
    .array(z.string())
    .min(1, "Seleziona almeno uno sport"),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  postal_code: z.string().max(10).optional().or(z.literal("")),
  region: z.string().max(50).optional().or(z.literal("")),
  country: z.string().max(2).default("IT").optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  instagram_url: z.string().url("URL non valido").optional().or(z.literal("")),
  facebook_url: z.string().url("URL non valido").optional().or(z.literal("")),
})

export const clubAdminInviteSchema = z.object({
  email: z.string().email("Inserisci un indirizzo email valido"),
  club_id: z.string().uuid(),
})

export { SPORTS_OPTIONS }
export type ClubFormValues = z.infer<typeof clubFormSchema>

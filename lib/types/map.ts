/**
 * Tipi per la mappa di scoperta circoli.
 */

/** Dati leggeri di un circolo per i marker sulla mappa */
export type MapClub = {
  id: string
  slug: string
  name: string
  sports: string[]
  latitude: number
  longitude: number
  logo_url: string | null
  cover_image_url: string | null
  city: string | null
  region: string | null
  address: string | null
  tagline: string | null
  claim_status: "unclaimed" | "pending" | "claimed"
}

/** Centro dell'Italia (approssimativo) */
export const ITALY_CENTER = { lat: 42.0, lng: 12.5 } as const

/** Zoom iniziale per mostrare tutta l'Italia */
export const ITALY_DEFAULT_ZOOM = 6

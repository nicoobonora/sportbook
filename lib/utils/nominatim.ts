/**
 * Utility per il geocoding con Nominatim (OpenStreetMap).
 * Gratuito, senza API key. Rate limit: 1 req/s (gestito via debounce nel componente).
 */

export type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: {
    road?: string
    house_number?: string
    postcode?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    country_code?: string
  }
}

export type ParsedAddress = {
  address: string
  city: string
  postal_code: string
  region: string
  country: string
  latitude: number
  longitude: number
}

/** Cerca indirizzi in Italia tramite Nominatim */
export async function searchAddress(query: string): Promise<NominatimResult[]> {
  if (query.length < 3) return []

  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    countrycodes: "it",
    limit: "5",
  })

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        "User-Agent": "PrenotaUnCampetto/1.0 (prenotauncampetto.it)",
        Accept: "application/json",
      },
    }
  )

  if (!res.ok) return []
  return res.json()
}

/** Converte un risultato Nominatim in campi strutturati */
export function parseNominatimResult(result: NominatimResult): ParsedAddress {
  const addr = result.address
  const road = [addr.road, addr.house_number].filter(Boolean).join(" ")

  return {
    address: road || result.display_name.split(",")[0],
    city: addr.city || addr.town || addr.village || addr.municipality || "",
    postal_code: addr.postcode || "",
    region: addr.state || "",
    country: (addr.country_code || "it").toUpperCase(),
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
  }
}

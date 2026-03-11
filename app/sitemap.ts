/**
 * Genera la sitemap dinamica per SEO.
 * Include pagine pubbliche di ogni circolo attivo (con URL sottodominio reali)
 * e le landing page aggregate per sport+città.
 */
import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  // Dominio root senza "app." e senza protocollo (es. "prenotauncampetto.it")
  const rootDomain = baseUrl.replace(/^https?:\/\/(app\.)?/, "")
  const isLocalhost = baseUrl.includes("localhost")
  const supabase = createClient()

  const { data: clubs } = await supabase
    .from("clubs")
    .select("slug, updated_at, city, province, sports")
    .eq("is_active", true)

  // ── URL delle pagine di ogni circolo ──
  const clubPages = (clubs || []).flatMap((club) => {
    // In produzione: https://slug.prenotauncampetto.it
    // In locale: http://localhost:3000/club/slug
    const clubBase = isLocalhost
      ? `${baseUrl}/club/${club.slug}`
      : `https://${club.slug}.${rootDomain}`

    return [
      {
        url: clubBase,
        lastModified: new Date(club.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      {
        url: `${clubBase}/prenota`,
        lastModified: new Date(club.updated_at),
        changeFrequency: "daily" as const,
        priority: 0.9,
      },
      {
        url: `${clubBase}/annunci`,
        lastModified: new Date(club.updated_at),
        changeFrequency: "daily" as const,
        priority: 0.6,
      },
      {
        url: `${clubBase}/contatti`,
        lastModified: new Date(club.updated_at),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      },
    ]
  })

  // ── Landing page sport index (es. /calcetto, /padel) ──
  const sportsWithClubs = new Set<string>()
  for (const club of clubs || []) {
    for (const sport of club.sports || []) {
      sportsWithClubs.add(sport)
    }
  }

  const sportIndexEntries: MetadataRoute.Sitemap = Array.from(sportsWithClubs).map(
    (sport) => ({
      url: `${baseUrl}/${sport}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })
  )

  // ── Landing page sport+città aggregate (es. /calcetto/bologna) ──
  // Genera combinazioni uniche sport/città dai circoli attivi
  const sportCitySet = new Set<string>()
  const sportCityEntries: MetadataRoute.Sitemap = []

  for (const club of clubs || []) {
    const city = club.city?.toLowerCase().replace(/\s+/g, "-")
    if (!city) continue
    for (const sport of club.sports || []) {
      const key = `${sport}/${city}`
      if (!sportCitySet.has(key)) {
        sportCitySet.add(key)
        sportCityEntries.push({
          url: `${baseUrl}/${sport}/${city}`,
          lastModified: new Date(club.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })
      }
    }
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...sportIndexEntries,
    ...sportCityEntries,
    ...clubPages,
  ]
}

/**
 * Genera la sitemap dinamica per SEO.
 * Include pagine pubbliche di ogni circolo attivo.
 */
import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const supabase = createClient()

  const { data: clubs } = await supabase
    .from("clubs")
    .select("slug, updated_at")
    .eq("is_active", true)

  const clubPages = (clubs || []).flatMap((club) => [
    {
      url: `${baseUrl}/?club=${club.slug}`,
      lastModified: new Date(club.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/prenota?club=${club.slug}`,
      lastModified: new Date(club.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/annunci?club=${club.slug}`,
      lastModified: new Date(club.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contatti?club=${club.slug}`,
      lastModified: new Date(club.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ])

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...clubPages,
  ]
}

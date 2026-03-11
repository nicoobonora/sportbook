/**
 * Componente JSON-LD per i dati strutturati del circolo.
 * Inietta schema.org SportsActivityLocation + LocalBusiness per SEO.
 */
import type { Club } from "@/lib/types/database"

interface ClubJsonLdProps {
  club: Club
  /** URL completo della pagina del circolo */
  clubUrl: string
}

export function ClubJsonLd({ club, clubUrl }: ClubJsonLdProps) {
  const sportsLabels = club.sports.map(
    (s) => s.charAt(0).toUpperCase() + s.slice(1)
  )

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["SportsActivityLocation", "LocalBusiness"],
    name: club.name,
    ...(club.tagline && { description: club.tagline }),
    ...(club.about_text && {
      disambiguatingDescription: club.about_text.slice(0, 300),
    }),
    url: clubUrl,
    ...(club.logo_url && { logo: club.logo_url }),
    ...(club.cover_image_url && { image: club.cover_image_url }),
    ...(club.phone && { telephone: club.phone }),
    ...(club.email && { email: club.email }),

    // Sport offerti
    ...(sportsLabels.length > 0 && {
      sport: sportsLabels,
      keywords: sportsLabels
        .map((s) => [s, `${s} ${club.city || ""}`.trim()])
        .flat()
        .filter(Boolean),
    }),

    // Indirizzo strutturato
    ...((club.address || club.city) && {
      address: {
        "@type": "PostalAddress",
        ...(club.address && { streetAddress: club.address }),
        ...(club.city && { addressLocality: club.city }),
        ...(club.postal_code && { postalCode: club.postal_code }),
        ...(club.province && { addressRegion: club.province }),
        ...(club.region && { addressRegion: club.region }),
        addressCountry: club.country || "IT",
      },
    }),

    // Coordinate geografiche
    ...(club.latitude &&
      club.longitude && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: club.latitude,
          longitude: club.longitude,
        },
      }),

    // Rating Google (se disponibile)
    ...(club.google_rating &&
      club.google_total_ratings && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: club.google_rating,
          reviewCount: club.google_total_ratings,
          bestRating: 5,
          worstRating: 1,
        },
      }),

    // Social e link
    sameAs: [
      club.instagram_url,
      club.facebook_url,
      club.website_url,
      club.google_maps_url,
    ].filter(Boolean),

    // Azione prenotazione
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${clubUrl}/prenota`,
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
        ],
      },
      name: "Prenota un campo",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

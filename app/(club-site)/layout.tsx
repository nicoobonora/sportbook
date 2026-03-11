/**
 * Layout del sito pubblico del circolo.
 * Mostra header/footer, JSON-LD e banner anteprima per circoli inattivi.
 */
import { headers } from "next/headers"
import { getClubFromHeaders, getClubBasePath } from "@/lib/hooks/use-club"
import { ClubHeader } from "@/components/club-site/header"
import { ClubFooter } from "@/components/club-site/footer"
import { CookieBanner } from "@/components/club-site/cookie-banner"
import { ClubJsonLd } from "@/components/seo/club-jsonld"

export default async function ClubSiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const club = await getClubFromHeaders()

  // In sviluppo locale senza ?club=slug, mostra la pagina di default
  if (!club) {
    return <>{children}</>
  }

  // Admin pages hanno il loro layout (sidebar) — skip header/footer pubblico
  const headersList = headers()
  const isAdmin = headersList.get("x-sportbook-admin") === "true"

  if (isAdmin) {
    return <div>{children}</div>
  }

  const basePath = getClubBasePath()

  // Costruisci l'URL canonico del circolo per JSON-LD
  const host = headersList.get("host") || ""
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1")
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const rootDomain = baseUrl.replace(/^https?:\/\/(app\.)?/, "")
  const clubUrl = isLocalhost
    ? `${baseUrl}/club/${club.slug}`
    : `https://${club.slug}.${rootDomain}`

  return (
    <div>
      <ClubJsonLd club={club} clubUrl={clubUrl} />
      {!club.is_active && (
        <div className="bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-yellow-950">
          Anteprima — Questo circolo non è ancora attivo
        </div>
      )}
      <ClubHeader club={club} basePath={basePath} />
      {children}
      <ClubFooter club={club} basePath={basePath} />
      <CookieBanner />
    </div>
  )
}

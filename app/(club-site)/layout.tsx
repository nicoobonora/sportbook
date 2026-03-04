/**
 * Layout del sito pubblico del circolo.
 * Inietta il tema (colori) del circolo e mostra header/footer.
 * I circoli inattivi sono visibili in anteprima con un banner informativo.
 */
import { getClubFromHeaders, getClubBasePath } from "@/lib/hooks/use-club"
import { getClubThemeStyles } from "@/lib/utils/colors"
import { ClubHeader } from "@/components/club-site/header"
import { ClubFooter } from "@/components/club-site/footer"
import { CookieBanner } from "@/components/club-site/cookie-banner"

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

  const themeStyles = getClubThemeStyles(club.primary_color, club.accent_color)
  const basePath = getClubBasePath()

  return (
    <div style={themeStyles}>
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

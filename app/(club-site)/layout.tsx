/**
 * Layout del sito pubblico del circolo.
 * Inietta il tema (colori) del circolo e mostra header/footer.
 */
import { notFound } from "next/navigation"
import { getClubFromHeaders } from "@/lib/hooks/use-club"
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

  if (!club.is_active) {
    notFound()
  }

  const themeStyles = getClubThemeStyles(club.primary_color, club.accent_color)

  return (
    <div style={themeStyles}>
      <ClubHeader club={club} />
      {children}
      <ClubFooter club={club} />
      <CookieBanner />
    </div>
  )
}

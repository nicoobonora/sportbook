/**
 * Pagina Annunci del sito pubblico del circolo.
 * Lista annunci in ordine cronologico inverso con paginazione.
 * Annunci pinnati sempre in cima, annunci scaduti nascosti.
 */
import type { Metadata } from "next"
import { getClubFromHeaders } from "@/lib/hooks/use-club"
import { createClient } from "@/lib/supabase/server"
import { AnnouncementList } from "@/components/club-site/announcement-list"

const PAGE_SIZE = 10

export async function generateMetadata(): Promise<Metadata> {
  const club = await getClubFromHeaders()
  if (!club) return { title: "Annunci — SportBook" }

  const locationLabel = [club.city, club.province].filter(Boolean).join(", ")
  const locationSuffix = locationLabel ? ` — ${locationLabel}` : ""

  return {
    title: `Annunci e Novità — ${club.name}${locationSuffix}`,
    description: `Scopri annunci, eventi e novità dal circolo sportivo ${club.name}${locationLabel ? ` di ${locationLabel}` : ""}. Resta aggiornato sulle attività.`,
  }
}

export default async function AnnunciPage({
  searchParams,
}: {
  searchParams: { pagina?: string }
}) {
  const club = await getClubFromHeaders()
  if (!club) return null

  const currentPage = Math.max(1, parseInt(searchParams.pagina || "1", 10) || 1)
  const offset = (currentPage - 1) * PAGE_SIZE

  const supabase = createClient()

  // Conta totale annunci non scaduti per la paginazione
  const { count: totalCount } = await supabase
    .from("announcements")
    .select("*", { count: "exact", head: true })
    .eq("club_id", club.id)

  const totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE)

  // Recupera annunci paginati: pinnati prima, poi per data
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .eq("club_id", club.id)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="container-sportbook py-8 sm:py-12">
        <h1 className="font-display text-display-lg uppercase tracking-tight">
          Annunci
        </h1>
        <p className="mt-1 text-muted-foreground">
          Novità ed eventi da {club.name}
        </p>

        <div className="mt-8">
          <AnnouncementList
            announcements={announcements || []}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </div>
      </div>
    </main>
  )
}

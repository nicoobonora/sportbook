/**
 * Pagina gestione annunci del pannello admin.
 * Lista, creazione, modifica ed eliminazione annunci.
 */
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getClubFromHeaders } from "@/lib/hooks/use-club"
import { AnnouncementManager } from "@/components/admin/announcement-manager"

export const metadata: Metadata = {
  title: "Annunci — Admin",
}

export default async function AdminAnnunciPage() {
  const club = await getClubFromHeaders()
  if (!club) return null

  const supabase = createClient()
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .eq("club_id", club.id)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })

  return (
    <>
      <h1 className="font-display text-display-lg uppercase tracking-tight">
        Annunci
      </h1>
      <p className="mt-1 text-muted-foreground">
        Gestisci gli annunci e le novità del circolo
      </p>

      <div className="mt-8">
        <AnnouncementManager
          clubId={club.id}
          announcements={announcements || []}
        />
      </div>
    </>
  )
}

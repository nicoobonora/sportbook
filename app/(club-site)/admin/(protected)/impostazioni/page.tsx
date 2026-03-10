/**
 * Pagina impostazioni del circolo.
 * Modifica dati, contatti, about, gestione strutture.
 */
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getClubFromHeaders } from "@/lib/hooks/use-club"
import { ClubSettings } from "@/components/admin/club-settings"

export const metadata: Metadata = {
  title: "Impostazioni — Admin",
}

export default async function ImpostazioniPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const club = await getClubFromHeaders()
  if (!club) return null

  const supabase = createClient()

  // Fetch campi
  const { data: fields } = await supabase
    .from("fields")
    .select("*")
    .eq("club_id", club.id)
    .order("sort_order")

  return (
    <>
      <h1 className="font-display text-display-lg uppercase tracking-tight">
        Impostazioni
      </h1>
      <p className="mt-1 text-muted-foreground">
        Configura il circolo e le strutture
      </p>

      <div className="mt-8">
        <ClubSettings
          club={club}
          fields={fields || []}
          defaultTab={searchParams?.tab}
        />
      </div>
    </>
  )
}

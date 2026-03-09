/**
 * Pagina impostazioni del circolo.
 * Modifica dati, contatti, about, gestione strutture, abbonamento, pagamenti.
 */
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getClubFromHeaders } from "@/lib/hooks/use-club"
import { ClubSettings } from "@/components/admin/club-settings"

export const metadata: Metadata = {
  title: "Impostazioni — Admin",
}

// Disabilita cache — i dati abbonamento devono essere sempre freschi
export const dynamic = "force-dynamic"

export default async function ImpostazioniPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const club = await getClubFromHeaders()
  if (!club) return null

  const supabase = createClient()
  const adminClient = createAdminClient()

  // Fetch campi
  const { data: fields } = await supabase
    .from("fields")
    .select("*")
    .eq("club_id", club.id)
    .order("sort_order")

  // Fetch abbonamento attivo (usa admin client per bypassare RLS)
  const { data: subscription } = await adminClient
    .from("stripe_subscriptions")
    .select("*")
    .eq("club_id", club.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

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
          subscription={subscription}
          defaultTab={searchParams?.tab}
        />
      </div>
    </>
  )
}

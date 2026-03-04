/**
 * Pagina gestione circolo: admin, statistiche, slot e anteprima.
 * Accessibile solo al super-admin.
 */
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Building2,
  Calendar,
  ExternalLink,
  Settings,
  Users,
  Zap,
} from "lucide-react"
import { formatDate } from "@/lib/utils/dates"
import { InviteAdminForm } from "@/components/super-admin/invite-admin-form"
import { AdminList } from "@/components/super-admin/admin-list"
import { GenerateSlotsButton } from "@/components/super-admin/generate-slots-button"

export const metadata: Metadata = {
  title: "Gestione Circolo — SportBook Admin",
}

export default async function ManageClubPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createAdminClient()

  // Fetch club + admin + statistiche in parallelo
  const [
    { data: club },
    { data: admins },
    { count: fieldsCount },
    { count: bookingsCount },
    { count: templatesCount },
    { count: slotsCount },
  ] = await Promise.all([
    supabase.from("clubs").select("*").eq("id", params.id).single(),
    supabase
      .from("club_admins")
      .select("id, user_id, created_at")
      .eq("club_id", params.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("fields")
      .select("*", { count: "exact", head: true })
      .eq("club_id", params.id),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("club_id", params.id),
    supabase
      .from("slot_templates")
      .select("*", { count: "exact", head: true })
      .eq("club_id", params.id),
    supabase
      .from("slots")
      .select("*", { count: "exact", head: true })
      .eq("club_id", params.id),
  ])

  if (!club) {
    notFound()
  }

  // Recupera email degli admin tramite auth (via admin client non disponibile senza service role)
  // Per ora mostriamo user_id e role

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link href="/clubs">
              <ArrowLeft className="mr-1 h-3 w-3" aria-hidden="true" />
              Circoli
            </Link>
          </Button>
          <h1 className="font-display text-display-lg uppercase tracking-tight">
            {club.name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {club.slug}.sportbook.it
            {club.city && <> · {club.city}</>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clubs/${club.id}/edit`}>
              <Settings className="mr-1 h-3 w-3" aria-hidden="true" />
              Modifica
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/preview/${club.slug}`}>
              <ExternalLink className="mr-1 h-3 w-3" aria-hidden="true" />
              Anteprima
            </Link>
          </Button>
        </div>
      </div>

      {/* Stato e statistiche */}
      <div className="mt-6 flex flex-wrap gap-2">
        {club.is_active ? (
          <Badge variant="default" className="bg-success">Attivo</Badge>
        ) : club.is_published ? (
          <Badge variant="secondary">Preview</Badge>
        ) : (
          <Badge variant="outline">Bozza</Badge>
        )}
        {club.sports?.map((sport: string) => (
          <Badge key={sport} variant="outline" className="capitalize">
            {sport}
          </Badge>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Strutture
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold">{fieldsCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prenotazioni
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold">{bookingsCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Template
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold">{templatesCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Slot generati
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold">{slotsCount || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Gestione Admin */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" aria-hidden="true" />
              Amministratori
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdminList admins={admins || []} clubId={club.id} />
            <InviteAdminForm clubId={club.id} />
          </CardContent>
        </Card>

        {/* Generazione slot */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" aria-hidden="true" />
              Generazione slot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Genera automaticamente gli slot per le prossime settimane
              partendo dai {templatesCount || 0} template configurati.
            </p>
            <GenerateSlotsButton
              clubId={club.id}
              disabled={(templatesCount || 0) === 0}
            />

            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Info:</strong> Creato il {formatDate(club.created_at)}
                {club.updated_at !== club.created_at && (
                  <> · Aggiornato il {formatDate(club.updated_at)}</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

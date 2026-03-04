/**
 * Lista circoli nel pannello super-admin.
 * Include ricerca, filtro stato, conteggio admin e azioni inline.
 */
import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, ExternalLink, Settings, Users } from "lucide-react"
import { formatDate } from "@/lib/utils/dates"
import { ClubActions } from "@/components/super-admin/club-actions"

export const metadata: Metadata = {
  title: "Circoli — SportBook Admin",
}

export default async function ClubsListPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const supabase = createClient()

  let query = supabase
    .from("clubs")
    .select("*")
    .order("created_at", { ascending: false })

  if (searchParams.status === "active") {
    query = query.eq("is_active", true)
  } else if (searchParams.status === "preview") {
    query = query.eq("is_published", true).eq("is_active", false)
  } else if (searchParams.status === "draft") {
    query = query.eq("is_published", false).eq("is_active", false)
  }

  if (searchParams.q) {
    query = query.ilike("name", `%${searchParams.q}%`)
  }

  const { data: clubs } = await query

  // Conta admin per ogni circolo
  const clubIds = (clubs || []).map((c) => c.id)
  const { data: adminCounts } = clubIds.length > 0
    ? await supabase
        .from("club_admins")
        .select("club_id")
        .in("club_id", clubIds)
    : { data: [] }

  const adminCountMap = (adminCounts || []).reduce(
    (acc: Record<string, number>, row) => {
      acc[row.club_id] = (acc[row.club_id] || 0) + 1
      return acc
    },
    {}
  )

  const currentStatus = searchParams.status || "all"

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-lg uppercase tracking-tight">
            Circoli
          </h1>
          <p className="mt-1 text-muted-foreground">
            {clubs?.length || 0} circol{(clubs?.length || 0) === 1 ? "o" : "i"}
          </p>
        </div>
        <Button asChild>
          <Link href="/clubs/new">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nuovo circolo
          </Link>
        </Button>
      </div>

      {/* Filtri */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="flex-1" action="/clubs" method="get">
          {searchParams.status && (
            <input type="hidden" name="status" value={searchParams.status} />
          )}
          <Input
            name="q"
            placeholder="Cerca per nome..."
            defaultValue={searchParams.q || ""}
            className="max-w-sm"
            aria-label="Cerca circoli"
          />
        </form>

        <div className="flex gap-1">
          {[
            { value: "all", label: "Tutti" },
            { value: "active", label: "Attivi" },
            { value: "preview", label: "Preview" },
            { value: "draft", label: "Bozze" },
          ].map((filter) => (
            <Button
              key={filter.value}
              variant={currentStatus === filter.value ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link
                href={`/clubs?${new URLSearchParams({
                  ...(searchParams.q ? { q: searchParams.q } : {}),
                  ...(filter.value !== "all" ? { status: filter.value } : {}),
                }).toString()}`}
              >
                {filter.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Lista circoli */}
      <div className="mt-6 grid gap-4">
        {clubs && clubs.length > 0 ? (
          clubs.map((club) => (
            <Card key={club.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{club.name}</CardTitle>
                    {club.is_active ? (
                      <Badge variant="default" className="bg-success">
                        Attivo
                      </Badge>
                    ) : club.is_published ? (
                      <Badge variant="secondary">Preview</Badge>
                    ) : (
                      <Badge variant="outline">Bozza</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {club.slug}.sportbook.it
                    {club.city && <> · {club.city}</>}
                    {club.sports && club.sports.length > 0 && (
                      <> · {club.sports.join(", ")}</>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Creato il {formatDate(club.created_at)}
                    <span className="mx-1">·</span>
                    <Users
                      className="inline h-3 w-3 align-text-bottom"
                      aria-hidden="true"
                    />{" "}
                    {adminCountMap[club.id] || 0} admin
                  </p>
                </div>

                <div className="flex shrink-0 gap-1.5">
                  <div
                    className="h-6 w-6 rounded-full border"
                    style={{ backgroundColor: club.primary_color }}
                    title={`Primario: ${club.primary_color}`}
                  />
                  <div
                    className="h-6 w-6 rounded-full border"
                    style={{ backgroundColor: club.accent_color }}
                    title={`Accento: ${club.accent_color}`}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/clubs/${club.id}/edit`}>
                    <Settings className="mr-1 h-3 w-3" aria-hidden="true" />
                    Modifica
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/clubs/${club.id}/manage`}>
                    <Users className="mr-1 h-3 w-3" aria-hidden="true" />
                    Gestisci
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={`/?club=${club.slug}`}
                    target="_blank"
                    rel="noopener"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" aria-hidden="true" />
                    Anteprima
                  </Link>
                </Button>

                <ClubActions club={club} />
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Nessun circolo trovato.</p>
              <Button className="mt-4" asChild>
                <Link href="/clubs/new">
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Crea il primo circolo
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}

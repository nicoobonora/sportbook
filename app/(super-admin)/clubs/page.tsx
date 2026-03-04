/**
 * Lista circoli nel pannello super-admin.
 */
import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ExternalLink } from "lucide-react"
import { formatDate } from "@/lib/utils/dates"

export const metadata: Metadata = {
  title: "Circoli — SportBook Admin",
}

export default async function ClubsListPage() {
  const supabase = createClient()
  const { data: clubs } = await supabase
    .from("clubs")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-lg uppercase tracking-tight">
            Circoli
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gestisci tutti i circoli sportivi della piattaforma
          </p>
        </div>
        <Button asChild>
          <Link href="/clubs/new">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nuovo circolo
          </Link>
        </Button>
      </div>

      {/* Lista circoli */}
      <div className="mt-8 grid gap-4">
        {clubs && clubs.length > 0 ? (
          clubs.map((club) => (
            <Card key={club.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{club.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {club.slug}.sportbook.it &middot; Creato il {formatDate(club.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {club.is_active ? (
                    <Badge variant="default" className="bg-success">Attivo</Badge>
                  ) : club.is_published ? (
                    <Badge variant="secondary">Preview</Badge>
                  ) : (
                    <Badge variant="outline">Bozza</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/clubs/${club.id}/edit`}>
                    Modifica
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/preview/${club.slug}`}>
                    <ExternalLink className="mr-1 h-3 w-3" aria-hidden="true" />
                    Preview
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Nessun circolo creato.</p>
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

/**
 * Pagina modifica circolo esistente.
 * Include link a gestione admin/slot e anteprima.
 */
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { ClubForm } from "@/components/super-admin/club-form"
import { Button } from "@/components/ui/button"
import { ExternalLink, Users } from "lucide-react"

export const metadata: Metadata = {
  title: "Modifica Circolo — SportBook Admin",
}

export default async function EditClubPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createAdminClient()
  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!club) {
    notFound()
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-display-lg uppercase tracking-tight">
            Modifica: {club.name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {club.slug}.sportbook.it
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clubs/${club.id}/manage`}>
              <Users className="mr-1 h-3 w-3" aria-hidden="true" />
              Gestisci
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
      <div className="mt-8">
        <ClubForm club={club} />
      </div>
    </>
  )
}

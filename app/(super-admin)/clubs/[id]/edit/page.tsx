/**
 * Pagina modifica circolo esistente.
 */
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClubForm } from "@/components/super-admin/club-form"

export const metadata: Metadata = {
  title: "Modifica Circolo — SportBook Admin",
}

export default async function EditClubPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
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
      <h1 className="font-display text-display-lg uppercase tracking-tight">
        Modifica: {club.name}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {club.slug}.sportbook.it
      </p>
      <div className="mt-8">
        <ClubForm club={club} />
      </div>
    </>
  )
}

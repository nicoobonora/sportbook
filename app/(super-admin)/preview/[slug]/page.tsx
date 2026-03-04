/**
 * Pagina anteprima circolo per il super-admin.
 * Mostra il sito del circolo in un iframe con barra di anteprima.
 * Se il circolo non è pubblicato, richiede un token valido.
 */
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PreviewFrame } from "@/components/super-admin/preview-frame"

export const metadata: Metadata = {
  title: "Anteprima Circolo — SportBook Admin",
}

export default async function PreviewPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = createClient()
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug, is_active, is_published")
    .eq("slug", params.slug)
    .single()

  if (!club) {
    notFound()
  }

  const previewUrl = `/?club=${club.slug}`

  return (
    <>
      <PreviewFrame club={club} previewUrl={previewUrl} />
    </>
  )
}

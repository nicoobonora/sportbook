/**
 * Pagina creazione nuovo circolo.
 */
import type { Metadata } from "next"
import { ClubForm } from "@/components/super-admin/club-form"

export const metadata: Metadata = {
  title: "Nuovo Circolo — SportBook Admin",
}

export default function NewClubPage() {
  return (
    <>
      <h1 className="font-display text-display-lg uppercase tracking-tight">
        Nuovo Circolo
      </h1>
      <p className="mt-1 text-muted-foreground">
        Configura un nuovo circolo sportivo sulla piattaforma
      </p>
      <div className="mt-8">
        <ClubForm />
      </div>
    </>
  )
}

/**
 * Gestione richieste di reclamo nel pannello super-admin.
 */
import type { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/dates"
import { ClaimActions } from "@/components/super-admin/claim-actions"
import Link from "next/link"
import { Mail, Phone, User, MessageSquare, Settings } from "lucide-react"

export const metadata: Metadata = {
  title: "Richieste di reclamo — SportBook Admin",
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: "In attesa", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Approvata", className: "bg-green-100 text-green-700" },
  rejected: { label: "Rifiutata", className: "bg-red-100 text-red-700" },
}

export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const supabase = createAdminClient()

  const statusFilter = searchParams.status || "pending"

  let claimsQuery = supabase
    .from("claim_requests")
    .select("*")
    .order("created_at", { ascending: false })

  if (["pending", "approved", "rejected"].includes(statusFilter)) {
    claimsQuery = claimsQuery.eq("status", statusFilter as "pending" | "approved" | "rejected")
  }

  const [{ data: rawClaims }, { count: pendingCount }] = await Promise.all([
    claimsQuery,
    supabase
      .from("claim_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending" as const),
  ])

  // Fetch club data for each claim
  const clubIds = Array.from(new Set((rawClaims || []).map((c) => c.club_id)))
  const { data: clubs } = clubIds.length > 0
    ? await supabase
        .from("clubs")
        .select("id, name, slug, city, sports, phone")
        .in("id", clubIds)
    : { data: [] }

  const clubMap = new Map((clubs || []).map((c) => [c.id, c]))

  const claims = (rawClaims || []).map((claim) => ({
    ...claim,
    club: clubMap.get(claim.club_id) || null,
  }))

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-lg uppercase tracking-tight">
            Richieste di reclamo
          </h1>
          <p className="mt-1 text-muted-foreground">
            {pendingCount || 0} richiest{pendingCount === 1 ? "a" : "e"} in attesa
          </p>
        </div>
      </div>

      {/* Filtri */}
      <div className="mt-6 flex gap-1">
        {[
          { value: "pending", label: "In attesa" },
          { value: "approved", label: "Approvate" },
          { value: "rejected", label: "Rifiutate" },
          { value: "all", label: "Tutte" },
        ].map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link
              href={`/super-admin/claims${
                filter.value !== "all" ? `?status=${filter.value}` : ""
              }`}
            >
              {filter.label}
              {filter.value === "pending" && pendingCount ? (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                  {pendingCount}
                </span>
              ) : null}
            </Link>
          </Button>
        ))}
      </div>

      {/* Lista richieste */}
      <div className="mt-6 grid gap-4">
        {claims && claims.length > 0 ? (
          claims.map((claim) => {
            const club = claim.club
            const badgeInfo = STATUS_BADGE[claim.status] || STATUS_BADGE.pending

            return (
              <Card key={claim.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {club?.name || "Circolo sconosciuto"}
                        </CardTitle>
                        <Badge variant="secondary" className={badgeInfo.className}>
                          {badgeInfo.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {club?.slug}.prenotauncampetto.it
                        {club?.city && <> · {club.city}</>}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(claim.created_at)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dati richiedente */}
                  <div className="grid gap-2 rounded-lg bg-muted/50 p-4 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{claim.contact_name}</span>
                      <span className="text-muted-foreground capitalize">
                        ({claim.role})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${claim.contact_email}`}
                        className="text-primary hover:underline"
                      >
                        {claim.contact_email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${claim.contact_phone}`}
                        className="text-primary hover:underline"
                      >
                        {claim.contact_phone}
                      </a>
                    </div>
                    {club?.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>Circolo: {club.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Messaggio */}
                  {claim.message && (
                    <div className="flex gap-2 text-sm">
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <p className="text-muted-foreground">{claim.message}</p>
                    </div>
                  )}

                  {/* Note di review */}
                  {claim.review_notes && (
                    <div className="rounded-md border-l-2 border-primary bg-muted/30 p-3 text-sm">
                      <p className="font-medium">Note di revisione:</p>
                      <p className="mt-1 text-muted-foreground">{claim.review_notes}</p>
                    </div>
                  )}

                  {/* Azioni */}
                  <div className="flex flex-wrap gap-2">
                    {claim.status === "pending" && (
                      <ClaimActions claimId={claim.id} clubName={club?.name || ""} />
                    )}
                    {club && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/super-admin/clubs/${club.id}/edit`}>
                          <Settings className="mr-1 h-3 w-3" />
                          Modifica circolo
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Nessuna richiesta trovata.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}

/**
 * Lista prenotazioni admin con filtri e azioni conferma/rifiuto.
 */
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CheckCircle,
  XCircle,
  Loader2,
  Phone,
  Mail,
  Filter,
  Search,
} from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils/dates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"

const STATUS_CONFIG = {
  unverified: { label: "Email non verificata", variant: "outline" as const },
  pending: { label: "In attesa", variant: "secondary" as const },
  confirmed: { label: "Confermata", variant: "default" as const },
  rejected: { label: "Rifiutata", variant: "destructive" as const },
  cancelled: { label: "Annullata", variant: "outline" as const },
}

type FieldInfo = { id: string; name: string; sport: string }

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bookings: any[]
  fields: FieldInfo[]
  currentPage: number
  totalPages: number
  filters: {
    stato?: string
    data?: string
    campo?: string
    cerca?: string
  }
}

export function BookingList({
  bookings,
  fields,
  currentPage,
  totalPages,
  filters,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("pagina") // Reset paginazione
    router.push(`/admin/prenotazioni?${params.toString()}`)
  }

  return (
    <div>
      {/* ── Filtri ── */}
      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Filtro stato */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-xs">
              <Filter className="h-3 w-3" aria-hidden="true" />
              Stato
            </Label>
            <Select
              value={filters.stato || "all"}
              onValueChange={(v) => updateFilter("stato", v)}
            >
              <SelectTrigger aria-label="Filtra per stato">
                <SelectValue placeholder="Tutti gli stati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="confirmed">Confermate</SelectItem>
                <SelectItem value="rejected">Rifiutate</SelectItem>
                <SelectItem value="cancelled">Annullate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro data */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-date" className="text-xs">
              Data
            </Label>
            <Input
              id="filter-date"
              type="date"
              value={filters.data || ""}
              onChange={(e) => updateFilter("data", e.target.value)}
            />
          </div>

          {/* Filtro campo */}
          <div className="space-y-1.5">
            <Label className="text-xs">Struttura</Label>
            <Select
              value={filters.campo || "all"}
              onValueChange={(v) => updateFilter("campo", v)}
            >
              <SelectTrigger aria-label="Filtra per struttura">
                <SelectValue placeholder="Tutte le strutture" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                {fields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ricerca */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-search" className="flex items-center gap-1 text-xs">
              <Search className="h-3 w-3" aria-hidden="true" />
              Cerca
            </Label>
            <Input
              id="filter-search"
              placeholder="Nome o email..."
              defaultValue={filters.cerca || ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateFilter("cerca", e.currentTarget.value)
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Lista prenotazioni ── */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nessuna prenotazione trovata con questi filtri.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}

      {/* ── Paginazione ── */}
      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Paginazione">
          <Button
            variant="outline"
            size="sm"
            className="touch-target"
            disabled={currentPage <= 1}
            asChild
          >
            <Link
              href={`/admin/prenotazioni?${buildPageUrl(searchParams, currentPage - 1)}`}
              aria-label="Pagina precedente"
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
            >
              &larr; Prec.
            </Link>
          </Button>
          <span className="px-3 text-sm text-muted-foreground" aria-live="polite">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="touch-target"
            disabled={currentPage >= totalPages}
            asChild
          >
            <Link
              href={`/admin/prenotazioni?${buildPageUrl(searchParams, currentPage + 1)}`}
              aria-label="Pagina successiva"
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
            >
              Succ. &rarr;
            </Link>
          </Button>
        </nav>
      )}
    </div>
  )
}

function buildPageUrl(params: URLSearchParams, page: number): string {
  const newParams = new URLSearchParams(params.toString())
  newParams.set("pagina", String(page))
  return newParams.toString()
}

/** Card singola prenotazione con azioni espandibili */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BookingCard({ booking }: { booking: any }) {
  const [expanded, setExpanded] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<string | null>(null)
  const router = useRouter()

  const status = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slot = booking.slots as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const field = booking.fields as any

  async function handleAction(action: "confirm" | "reject") {
    setActionLoading(action)
    setActionResult(null)

    const response = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booking_id: booking.id,
        action,
        rejection_reason: action === "reject" ? rejectionReason : undefined,
      }),
    })

    setActionLoading(null)

    if (response.ok) {
      setActionResult(action === "confirm" ? "Confermata" : "Rifiutata")
      router.refresh()
    } else {
      const data = await response.json()
      setActionResult(`Errore: ${data.error}`)
    }
  }

  return (
    <Card>
      <CardContent className="py-4">
        {/* Riga principale */}
        <button
          type="button"
          className="flex w-full items-center justify-between text-left touch-target"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={`Dettagli prenotazione di ${booking.user_name}`}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{booking.user_name}</p>
            <p className="text-sm text-muted-foreground">
              {field?.name || "—"} ·{" "}
              {slot?.date ? formatDate(slot.date) : "—"} ·{" "}
              {slot?.start_time ? formatTime(slot.start_time) : ""}
              {slot?.end_time ? `–${formatTime(slot.end_time)}` : ""}
            </p>
          </div>
          <Badge variant={status.variant} className="ml-2 shrink-0">
            {status.label}
          </Badge>
        </button>

        {/* Dettagli espansi */}
        {expanded && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* Info contatto */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <a href={`mailto:${booking.user_email}`} className="hover:underline">
                  {booking.user_email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <a href={`tel:${booking.user_phone}`} className="hover:underline">
                  {booking.user_phone}
                </a>
              </div>
            </div>

            {/* Note */}
            {booking.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Note:</p>
                <p className="mt-1 text-sm">{booking.notes}</p>
              </div>
            )}

            {/* Motivo rifiuto (se rifiutata) */}
            {booking.status === "rejected" && booking.rejection_reason && (
              <div>
                <p className="text-xs font-medium text-error">Motivo rifiuto:</p>
                <p className="mt-1 text-sm">{booking.rejection_reason}</p>
              </div>
            )}

            {/* Risultato azione */}
            {actionResult && (
              <div
                className="rounded-md bg-muted px-3 py-2 text-sm"
                role="status"
                aria-live="polite"
              >
                {actionResult}
              </div>
            )}

            {/* Azioni (solo per prenotazioni in attesa) */}
            {booking.status === "pending" && !actionResult && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="touch-target gap-1 bg-success hover:bg-success/90"
                    onClick={() => handleAction("confirm")}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === "confirm" ? (
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    ) : (
                      <CheckCircle className="h-3 w-3" aria-hidden="true" />
                    )}
                    Conferma
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="touch-target gap-1"
                    onClick={() => handleAction("reject")}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === "reject" ? (
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-3 w-3" aria-hidden="true" />
                    )}
                    Rifiuta
                  </Button>
                </div>

                {/* Campo motivo rifiuto */}
                <div className="space-y-1">
                  <Label htmlFor={`reject-reason-${booking.id}`} className="text-xs">
                    Motivo rifiuto (opzionale)
                  </Label>
                  <Textarea
                    id={`reject-reason-${booking.id}`}
                    placeholder="Es. Slot occupato per manutenzione..."
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

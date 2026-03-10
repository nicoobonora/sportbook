/**
 * Calendario settimanale prenotazioni.
 * Mostra le prenotazioni in una griglia con colonne per giorno
 * e righe per fascia oraria. Colori: giallo=pending, verde=confermata, rosso=rifiutata.
 */
"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  Trash2,
  Plus,
  Mail,
  Phone,
  User,
  Clock,
  MapPin,
  CreditCard,
} from "lucide-react"
import { formatTime, formatDate, formatDateShort } from "@/lib/utils/dates"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddBookingDialog } from "@/components/admin/add-booking-dialog"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BookingData = any

type FieldInfo = { id: string; name: string; sport: string }

type Props = {
  bookings: BookingData[]
  fields: FieldInfo[]
  weekStart: string // YYYY-MM-DD (monday)
  weekEnd: string   // YYYY-MM-DD (sunday)
  selectedFieldId: string | null
  basePath: string  // "/club/slug" on localhost, "" in prod
  clubId: string
}

const STATUS_COLORS = {
  pending: {
    bg: "bg-amber-100 dark:bg-amber-900/40",
    border: "border-amber-300 dark:border-amber-700",
    text: "text-amber-800 dark:text-amber-200",
    dot: "bg-amber-400",
    label: "In attesa",
  },
  confirmed: {
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    border: "border-emerald-300 dark:border-emerald-700",
    text: "text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-400",
    label: "Confermata",
  },
  rejected: {
    bg: "bg-red-100 dark:bg-red-900/40",
    border: "border-red-300 dark:border-red-700",
    text: "text-red-800 dark:text-red-200",
    dot: "bg-red-400",
    label: "Rifiutata",
  },
  cancelled: {
    bg: "bg-gray-100 dark:bg-gray-800/40",
    border: "border-gray-300 dark:border-gray-700",
    text: "text-gray-500 dark:text-gray-400",
    dot: "bg-gray-400",
    label: "Annullata",
  },
} as const

export function BookingCalendar({
  bookings,
  fields,
  weekStart,
  weekEnd,
  selectedFieldId,
  basePath,
  clubId,
}: Props) {
  const router = useRouter()
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [addBookingOpen, setAddBookingOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Build the 7 days of this week
  const weekDays = useMemo(() => {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    const start = new Date(weekStart + "T12:00:00Z")
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setUTCDate(d.getUTCDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      return {
        date: dateStr,
        dayIndex: d.getUTCDay(), // 0=Sun
        label: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"][d.getUTCDay()],
        full: formatDateShort(dateStr),
        isToday: dateStr === todayStr,
      }
    })
  }, [weekStart])

  // Filter bookings
  const filteredBookings = useMemo(() => {
    let filtered = bookings
    if (statusFilter !== "all") {
      filtered = filtered.filter((b: BookingData) => b.status === statusFilter)
    }
    return filtered
  }, [bookings, statusFilter])

  // Group bookings by date → time
  const bookingsByDateAndTime = useMemo(() => {
    const map: Record<string, Record<string, BookingData[]>> = {}
    for (const b of filteredBookings) {
      const date = b.date || b.slots?.date
      const startTime = (b.start_time || b.slots?.start_time)?.substring(0, 5)
      if (!date || !startTime) continue
      if (!map[date]) map[date] = {}
      if (!map[date][startTime]) map[date][startTime] = []
      map[date][startTime].push(b)
    }
    return map
  }, [filteredBookings])

  // Collect all unique time slots across the week
  const allTimeSlots = useMemo(() => {
    const times = new Set<string>()
    for (const dateMap of Object.values(bookingsByDateAndTime)) {
      for (const time of Object.keys(dateMap)) {
        times.add(time)
      }
    }
    return Array.from(times).sort()
  }, [bookingsByDateAndTime])

  // Navigation
  function navigateWeek(direction: -1 | 1) {
    const start = new Date(weekStart + "T12:00:00Z")
    start.setUTCDate(start.getUTCDate() + direction * 7)
    const newStart = start.toISOString().split("T")[0]
    const params = new URLSearchParams()
    params.set("settimana", newStart)
    if (selectedFieldId) params.set("campo", selectedFieldId)
    router.push(`${basePath}/admin/prenotazioni?${params.toString()}`)
  }

  function goToToday() {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")
    const todayStr = `${yyyy}-${mm}-${dd}`
    const today = new Date(todayStr + "T12:00:00Z")
    const day = today.getUTCDay()
    today.setUTCDate(today.getUTCDate() - ((day + 6) % 7))
    const newStart = today.toISOString().split("T")[0]
    const params = new URLSearchParams()
    params.set("settimana", newStart)
    if (selectedFieldId) params.set("campo", selectedFieldId)
    router.push(`${basePath}/admin/prenotazioni?${params.toString()}`)
  }

  function handleFieldChange(fieldId: string) {
    const params = new URLSearchParams()
    params.set("settimana", weekStart)
    if (fieldId !== "all") params.set("campo", fieldId)
    router.push(`${basePath}/admin/prenotazioni?${params.toString()}`)
  }

  function openBookingDetail(booking: BookingData) {
    setSelectedBooking(booking)
    setDetailOpen(true)
  }

  // Booking counts by status
  const counts = useMemo(() => {
    const c = { pending: 0, confirmed: 0, rejected: 0, cancelled: 0 }
    for (const b of bookings) {
      if (b.status in c) c[b.status as keyof typeof c]++
    }
    return c
  }, [bookings])

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateWeek(-1)}
            aria-label="Settimana precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="font-medium"
            onClick={goToToday}
          >
            Oggi
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateWeek(1)}
            aria-label="Settimana successiva"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {formatDateShort(weekStart)} — {formatDateShort(weekEnd)}
          </span>
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center gap-2">
          {/* Add booking button */}
          <Button
            size="sm"
            className="h-8 gap-1"
            onClick={() => setAddBookingOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nuova</span>
          </Button>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs" aria-label="Filtra per stato">
              <Filter className="h-3 w-3 mr-1" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti ({bookings.length})</SelectItem>
              <SelectItem value="pending">In attesa ({counts.pending})</SelectItem>
              <SelectItem value="confirmed">Confermate ({counts.confirmed})</SelectItem>
              <SelectItem value="rejected">Rifiutate ({counts.rejected})</SelectItem>
            </SelectContent>
          </Select>

          {/* Field filter */}
          {fields.length > 1 && (
            <Select
              value={selectedFieldId || "all"}
              onValueChange={handleFieldChange}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs" aria-label="Filtra per struttura">
                <SelectValue placeholder="Tutte le strutture" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le strutture</SelectItem>
                {fields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* ── Status legend ── */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          In attesa
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          Confermata
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          Rifiutata
        </span>
        <span className="flex items-center gap-1">
          <CreditCard className="h-3 w-3 text-emerald-600" aria-hidden="true" />
          Pagato online
        </span>
      </div>

      {/* ── Desktop: griglia 7 colonne ── */}
      <div className="hidden md:block overflow-x-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-border rounded-lg overflow-hidden min-w-[700px]">
          {/* Header row */}
          <div className="bg-card p-2" />
          {weekDays.map((day) => (
            <div
              key={day.date}
              className={`bg-card p-2 text-center ${day.isToday ? "bg-primary/5" : ""}`}
            >
              <span className="text-xs text-muted-foreground">{day.label}</span>
              <p className={`text-sm font-semibold ${day.isToday ? "text-primary" : ""}`}>
                {day.full}
              </p>
            </div>
          ))}

          {/* Time rows */}
          {allTimeSlots.length === 0 ? (
            <>
              <div className="bg-card p-2" />
              <div className="col-span-7 bg-card py-12 text-center text-sm text-muted-foreground">
                Nessuna prenotazione questa settimana.
              </div>
            </>
          ) : (
            allTimeSlots.map((time) => (
              <>
                <div
                  key={`time-${time}`}
                  className="bg-card p-2 flex items-start justify-end"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {time}
                  </span>
                </div>
                {weekDays.map((day) => {
                  const cellBookings =
                    bookingsByDateAndTime[day.date]?.[time] || []

                  return (
                    <div
                      key={`${day.date}-${time}`}
                      className={`bg-card p-1 min-h-[48px] ${day.isToday ? "bg-primary/5" : ""}`}
                    >
                      {cellBookings.map((b: BookingData) => (
                        <BookingChip
                          key={b.id}
                          booking={b}
                          onClick={() => openBookingDetail(b)}
                        />
                      ))}
                    </div>
                  )
                })}
              </>
            ))
          )}
        </div>
      </div>

      {/* ── Mobile: vista singolo giorno ── */}
      <div className="md:hidden">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weekDays.map((day, i) => (
            <Button
              key={day.date}
              variant={
                (selectedDay === null && day.isToday) || selectedDay === i
                  ? "default"
                  : "outline"
              }
              size="sm"
              className="shrink-0 text-xs flex-col h-auto py-1.5 px-3"
              onClick={() => setSelectedDay(i)}
            >
              <span>{day.label}</span>
              <span className="text-[10px] opacity-70">{day.full}</span>
            </Button>
          ))}
        </div>

        <MobileDayBookings
          day={weekDays[selectedDay ?? weekDays.findIndex((d) => d.isToday) ?? 0]}
          bookings={filteredBookings.filter(
            (b: BookingData) =>
              (b.date || b.slots?.date) ===
              weekDays[selectedDay ?? weekDays.findIndex((d) => d.isToday) ?? 0]?.date
          )}
          onOpenDetail={openBookingDetail}
        />
      </div>

      {/* ── Detail dialog ── */}
      <BookingDetailDialog
        booking={selectedBooking}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* ── Add booking dialog ── */}
      <AddBookingDialog
        clubId={clubId}
        fields={fields}
        open={addBookingOpen}
        onOpenChange={setAddBookingOpen}
      />
    </div>
  )
}

/** Chip compatta per una prenotazione nella griglia */
function BookingChip({
  booking,
  onClick,
}: {
  booking: BookingData
  onClick: () => void
}) {
  const status =
    STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS] ||
    STATUS_COLORS.pending
  const field = booking.fields as { name?: string } | null

  const isPaid = booking.payment_status === "paid"

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded px-1.5 py-1 mb-0.5 border text-[11px] leading-tight transition-opacity hover:opacity-80 ${status.bg} ${status.border}`}
      aria-label={`Prenotazione di ${booking.user_name} — ${status.label}${isPaid ? " — Pagato online" : ""}`}
    >
      <div className="flex items-center gap-1">
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${status.dot}`} />
        <span className={`truncate font-medium ${status.text}`}>
          {booking.user_name}
        </span>
        {isPaid && (
          <CreditCard className="h-2.5 w-2.5 shrink-0 text-emerald-600" aria-label="Pagato online" />
        )}
      </div>
      {field?.name && (
        <p className="truncate text-[10px] text-muted-foreground mt-0.5">
          {field.name}
        </p>
      )}
    </button>
  )
}

/** Vista mobile: prenotazioni di un giorno */
function MobileDayBookings({
  day,
  bookings,
  onOpenDetail,
}: {
  day: { date: string; full: string; label: string } | undefined
  bookings: BookingData[]
  onOpenDetail: (b: BookingData) => void
}) {
  if (!day) return null

  // Sort by time
  const sorted = [...bookings].sort((a, b) => {
    const ta = a.start_time || a.slots?.start_time || ""
    const tb = b.start_time || b.slots?.start_time || ""
    return ta.localeCompare(tb)
  })

  return (
    <div className="space-y-1.5 mt-2">
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nessuna prenotazione per {day.label} {day.full}.
        </p>
      ) : (
        sorted.map((b: BookingData) => {
          const status =
            STATUS_COLORS[b.status as keyof typeof STATUS_COLORS] ||
            STATUS_COLORS.pending
          const startTime = b.start_time || b.slots?.start_time
          const endTime = b.end_time || b.slots?.end_time
          const field = b.fields as { name?: string } | null

          const isPaid = b.payment_status === "paid"

          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onOpenDetail(b)}
              className={`w-full text-left rounded-lg border p-3 transition-opacity hover:opacity-80 ${status.bg} ${status.border}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${status.dot}`} />
                  <span className={`font-medium truncate ${status.text}`}>
                    {b.user_name}
                  </span>
                  {isPaid && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      <CreditCard className="h-2.5 w-2.5" aria-hidden="true" />
                      Pagato
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-muted-foreground shrink-0 ml-2">
                  {startTime ? formatTime(startTime) : ""}
                  {endTime ? `–${formatTime(endTime)}` : ""}
                </span>
              </div>
              {field?.name && (
                <p className="text-xs text-muted-foreground mt-1 ml-[18px]">
                  {field.name}
                </p>
              )}
            </button>
          )
        })
      )}
    </div>
  )
}

/** Dialog dettaglio prenotazione con azioni conferma/rifiuto */
function BookingDetailDialog({
  booking,
  open,
  onOpenChange,
}: {
  booking: BookingData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [rejectionReason, setRejectionReason] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<string | null>(null)

  if (!booking) return null

  const status =
    STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS] ||
    STATUS_COLORS.pending
  const bookingDate = booking.date || booking.slots?.date
  const bookingStartTime = booking.start_time || booking.slots?.start_time
  const bookingEndTime = booking.end_time || booking.slots?.end_time
  const field = booking.fields as { name?: string; sport?: string } | null

  async function handleAction(action: "confirm" | "reject" | "cancel") {
    setActionLoading(action)
    setActionResult(null)

    const response = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booking_id: booking!.id,
        action,
        rejection_reason: action === "reject" ? rejectionReason : undefined,
      }),
    })

    setActionLoading(null)

    if (response.ok) {
      const labels = { confirm: "Confermata!", reject: "Rifiutata.", cancel: "Cancellata." }
      setActionResult(labels[action])
      setTimeout(() => {
        onOpenChange(false)
        setActionResult(null)
        setRejectionReason("")
        router.refresh()
      }, 800)
    } else {
      const data = await response.json()
      setActionResult(`Errore: ${data.error}`)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setActionResult(null)
          setRejectionReason("")
        }
        onOpenChange(o)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Prenotazione
            <Badge
              className={`${status.bg} ${status.text} ${status.border} border`}
            >
              {status.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info utente */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium">{booking.user_name}</span>
            </div>
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

          {/* Info slot */}
          <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
            {field?.name && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span>
                  {field.name}
                  {field.sport && (
                    <span className="text-muted-foreground"> ({field.sport})</span>
                  )}
                </span>
              </div>
            )}
            {bookingDate && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span>
                  {formatDate(bookingDate)}
                  {bookingStartTime && (
                    <span className="font-mono ml-1">
                      {formatTime(bookingStartTime)}
                      {bookingEndTime && `–${formatTime(bookingEndTime)}`}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Payment status */}
          {booking.payment_status === "paid" && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
              <CreditCard className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  Pagato online
                </p>
                {booking.paid_at && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {new Date(booking.paid_at).toLocaleString("it-IT", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Note */}
          {booking.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Note:</p>
              <p className="mt-1 text-sm">{booking.notes}</p>
            </div>
          )}

          {/* Rejection reason */}
          {booking.status === "rejected" && booking.rejection_reason && (
            <div>
              <p className="text-xs font-medium text-red-600">Motivo rifiuto:</p>
              <p className="mt-1 text-sm">{booking.rejection_reason}</p>
            </div>
          )}

          {/* Action result */}
          {actionResult && (
            <div
              className="rounded-md bg-muted px-3 py-2 text-sm font-medium"
              role="status"
              aria-live="polite"
            >
              {actionResult}
            </div>
          )}

          {/* Actions for pending bookings */}
          {booking.status === "pending" && !actionResult && (
            <div className="space-y-3 border-t pt-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 touch-target gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleAction("confirm")}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "confirm" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Conferma
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 touch-target gap-1"
                  onClick={() => handleAction("reject")}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "reject" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Rifiuta
                </Button>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reject-reason" className="text-xs">
                  Motivo rifiuto (opzionale)
                </Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Es. Slot occupato per manutenzione..."
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Cancel button for confirmed bookings */}
          {booking.status === "confirmed" && !actionResult && (
            <div className="border-t pt-3">
              <Button
                size="sm"
                variant="outline"
                className="w-full touch-target gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleAction("cancel")}
                disabled={!!actionLoading}
              >
                {actionLoading === "cancel" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Cancella prenotazione
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

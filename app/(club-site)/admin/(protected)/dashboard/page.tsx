/**
 * Dashboard admin del circolo.
 * Mostra KPI cards e prenotazioni recenti.
 */
import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getClubFromHeaders, getClubBasePath } from "@/lib/hooks/use-club"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarCheck, Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils/dates"

export const metadata: Metadata = {
  title: "Dashboard Admin",
}

const STATUS_MAP = {
  pending: { label: "In attesa", variant: "secondary" as const, color: "text-warning" },
  confirmed: { label: "Confermata", variant: "default" as const, color: "text-success" },
  rejected: { label: "Rifiutata", variant: "destructive" as const, color: "text-error" },
  cancelled: { label: "Annullata", variant: "outline" as const, color: "text-muted-foreground" },
}

export default async function AdminDashboardPage() {
  const club = await getClubFromHeaders()
  if (!club) return null

  const supabase = createClient()

  // Oggi in formato ISO
  const today = new Date().toISOString().split("T")[0]

  // Query KPI in parallelo
  const [
    { count: pendingCount },
    { count: confirmedTodayCount },
    { count: monthCount },
    { count: announcementCount },
    { data: recentBookings },
  ] = await Promise.all([
    // Prenotazioni in attesa
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("club_id", club.id)
      .eq("status", "pending"),
    // Confermate per oggi
    supabase
      .from("bookings")
      .select("*, slots!inner(date)", { count: "exact", head: true })
      .eq("club_id", club.id)
      .eq("status", "confirmed")
      .eq("slots.date", today),
    // Totale questo mese
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("club_id", club.id)
      .gte("created_at", `${today.substring(0, 7)}-01`),
    // Annunci attivi
    supabase
      .from("announcements")
      .select("*", { count: "exact", head: true })
      .eq("club_id", club.id),
    // Ultime 10 prenotazioni
    supabase
      .from("bookings")
      .select("*, slots(date, start_time, end_time), fields(name, sport)")
      .eq("club_id", club.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  const kpis = [
    {
      label: "In attesa",
      value: pendingCount || 0,
      icon: Clock,
      color: "text-warning",
    },
    {
      label: "Confermate oggi",
      value: confirmedTodayCount || 0,
      icon: CheckCircle,
      color: "text-success",
    },
    {
      label: "Questo mese",
      value: monthCount || 0,
      icon: CalendarCheck,
      color: "text-primary",
    },
    {
      label: "Annunci attivi",
      value: announcementCount || 0,
      icon: XCircle,
      color: "text-muted-foreground",
    },
  ]

  return (
    <>
      <h1 className="font-display text-display-lg uppercase tracking-tight">
        Dashboard
      </h1>
      <p className="mt-1 text-muted-foreground">
        Panoramica del circolo {club.name}
      </p>

      {/* KPI Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <kpi.icon
                className={`h-4 w-4 ${kpi.color}`}
                aria-hidden="true"
              />
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prenotazioni recenti */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-display-sm uppercase tracking-tight">
            Prenotazioni recenti
          </h2>
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href={`${getClubBasePath()}/admin/prenotazioni`}>
              Vedi tutte
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {recentBookings && recentBookings.length > 0 ? (
            recentBookings.map((booking) => {
              const status = STATUS_MAP[booking.status as keyof typeof STATUS_MAP] || STATUS_MAP.pending
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const slot = booking.slots as any
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const field = booking.fields as any

              return (
                <Card key={booking.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {booking.user_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {field?.name || "—"} ·{" "}
                        {slot?.date ? formatDate(slot.date) : "—"} ·{" "}
                        {slot?.start_time ? formatTime(slot.start_time) : "—"}
                        {slot?.end_time ? `–${formatTime(slot.end_time)}` : ""}
                      </p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nessuna prenotazione ancora.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

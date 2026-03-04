/**
 * Dashboard super-admin.
 * Mostra statistiche aggregate, circoli recenti e prenotazioni recenti.
 */
import type { Metadata } from "next"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import { formatDate } from "@/lib/utils/dates"

export const metadata: Metadata = {
  title: "Dashboard — SportBook Admin",
}

export default async function SuperAdminDashboardPage() {
  const supabase = createAdminClient()

  const [
    { count: totalClubs },
    { count: activeClubs },
    { count: totalBookings },
    { count: pendingBookings },
    { count: totalFields },
    { data: recentClubs },
    { data: recentBookings },
  ] = await Promise.all([
    supabase.from("clubs").select("*", { count: "exact", head: true }),
    supabase
      .from("clubs")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("fields").select("*", { count: "exact", head: true }),
    supabase
      .from("clubs")
      .select("id, name, slug, is_active, is_published, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("bookings")
      .select(
        "id, status, user_name, created_at, slots(date, start_time, fields(name))"
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  const stats = [
    {
      label: "Circoli totali",
      value: totalClubs || 0,
      icon: Building2,
      color: "text-blue-600",
    },
    {
      label: "Circoli attivi",
      value: activeClubs || 0,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: "Prenotazioni",
      value: totalBookings || 0,
      icon: Calendar,
      color: "text-purple-600",
    },
    {
      label: "In attesa",
      value: pendingBookings || 0,
      icon: Clock,
      color: "text-amber-600",
    },
    {
      label: "Strutture",
      value: totalFields || 0,
      icon: TrendingUp,
      color: "text-indigo-600",
    },
  ]

  return (
    <>
      <h1 className="font-display text-display-lg uppercase tracking-tight">
        Dashboard
      </h1>
      <p className="mt-1 text-muted-foreground">
        Panoramica della piattaforma SportBook
      </p>

      {/* KPI Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon
                className={`h-4 w-4 ${stat.color}`}
                aria-hidden="true"
              />
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Circoli recenti */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Circoli recenti</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/clubs">
                Vedi tutti
                <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentClubs && recentClubs.length > 0 ? (
              <div className="space-y-3">
                {recentClubs.map((club) => (
                  <div
                    key={club.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <Link
                        href={`/clubs/${club.id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {club.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {club.slug}.sportbook.it · {formatDate(club.created_at)}
                      </p>
                    </div>
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
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nessun circolo creato.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Prenotazioni recenti */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prenotazioni recenti</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings && recentBookings.length > 0 ? (
              <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {recentBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {booking.user_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.slots?.fields?.name || "—"} ·{" "}
                        {booking.slots?.date || "—"} ·{" "}
                        {booking.slots?.start_time?.substring(0, 5) || ""}
                      </p>
                    </div>
                    <Badge
                      variant={
                        booking.status === "confirmed"
                          ? "default"
                          : booking.status === "pending"
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        booking.status === "confirmed" ? "bg-success" : ""
                      }
                    >
                      {booking.status === "pending"
                        ? "In attesa"
                        : booking.status === "confirmed"
                          ? "Confermata"
                          : "Rifiutata"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nessuna prenotazione.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

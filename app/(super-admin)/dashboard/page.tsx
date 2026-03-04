/**
 * Dashboard super-admin.
 * Mostra statistiche aggregate e lista circoli recenti.
 */
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Calendar, CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard — SportBook Admin",
}

export default async function SuperAdminDashboardPage() {
  const supabase = createClient()

  // Recupera statistiche aggregate
  const [
    { count: totalClubs },
    { count: activeClubs },
    { count: recentBookings },
  ] = await Promise.all([
    supabase.from("clubs").select("*", { count: "exact", head: true }),
    supabase.from("clubs").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
  ])

  const stats = [
    {
      label: "Circoli totali",
      value: totalClubs || 0,
      icon: Building2,
    },
    {
      label: "Circoli attivi",
      value: activeClubs || 0,
      icon: CheckCircle,
    },
    {
      label: "Prenotazioni totali",
      value: recentBookings || 0,
      icon: Calendar,
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
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

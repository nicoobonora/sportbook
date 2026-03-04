/**
 * Layout del pannello admin del circolo.
 * Verifica autenticazione e mostra sidebar + contenuto.
 */
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getClubFromHeaders } from "@/lib/hooks/use-club"
import { AdminSidebar } from "@/components/admin/sidebar"

export default async function ClubAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const club = await getClubFromHeaders()
  if (!club) {
    redirect("/admin/login")
  }

  // Verifica che l'utente sia admin di questo club
  const { data: adminRecord } = await supabase
    .from("club_admins")
    .select("id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single()

  // Permetti anche ai super-admin di accedere
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
  const isSuperAdmin = superAdminEmails.includes(user.email || "")

  if (!adminRecord && !isSuperAdmin) {
    redirect("/admin/login")
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar clubName={club.name} />
      <main id="main-content" className="flex-1 bg-background">
        <div className="container-sportbook py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

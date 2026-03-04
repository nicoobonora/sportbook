/**
 * Layout del pannello admin del circolo.
 * Verifica autenticazione e mostra sidebar + contenuto.
 * Nota: la pagina login è FUORI da questo route group per evitare loop di redirect.
 */
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getClubFromHeaders, getClubBasePath } from "@/lib/hooks/use-club"
import { AdminSidebar } from "@/components/admin/sidebar"

export default async function ClubAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const basePath = getClubBasePath()
  const loginPath = `${basePath}/admin/login`

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(loginPath)
  }

  const club = await getClubFromHeaders()
  if (!club) {
    redirect(loginPath)
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
    redirect(loginPath)
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar clubName={club.name} basePath={basePath} />
      <main id="main-content" className="flex-1 bg-background">
        <div className="container-sportbook py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

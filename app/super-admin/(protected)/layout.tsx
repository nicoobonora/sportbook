/**
 * Layout per il pannello super-admin.
 * Include sidebar di navigazione e verifica autenticazione.
 */
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SuperAdminSidebar } from "@/components/super-admin/sidebar"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/super-admin/login")
  }

  // Verifica email nella allowlist super-admin
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim())
  if (!superAdminEmails.includes(user.email || "")) {
    redirect("/unauthorized")
  }

  return (
    <div className="flex min-h-screen">
      <SuperAdminSidebar />
      <main id="main-content" className="flex-1 bg-background">
        <div className="container-sportbook py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

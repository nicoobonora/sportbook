import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || ""
  const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "NOT_SET"
  const ROOT_DOMAIN = APP_DOMAIN.replace(/^app\./, "")
  const slug = request.headers.get("x-sportbook-club-slug") || "NOT_SET"

  const superAdminEmails = process.env.SUPER_ADMIN_EMAILS || "NOT_SET"

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return NextResponse.json({
    host,
    APP_DOMAIN,
    ROOT_DOMAIN,
    slug,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    superAdminEmails,
    userEmail: user?.email || "NOT_LOGGED_IN",
    emailMatch: superAdminEmails.split(",").map(e => e.trim()).includes(user?.email || ""),
  })
}

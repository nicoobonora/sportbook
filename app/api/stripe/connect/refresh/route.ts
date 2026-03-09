import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/stripe/connect/refresh?clubId=xxx
 * Rigenera il link di onboarding Connect (quando il link originale scade).
 * Redirect automatico al nuovo link.
 */
export async function GET(req: NextRequest) {
  try {
    const clubId = req.nextUrl.searchParams.get("clubId")
    if (!clubId) {
      return NextResponse.redirect(new URL("/admin/impostazioni?tab=pagamenti&error=missing_club", req.url))
    }

    const adminClient = createAdminClient()
    const { data: connectAccount } = await adminClient
      .from("stripe_connect_accounts")
      .select("stripe_account_id")
      .eq("club_id", clubId)
      .single()

    if (!connectAccount) {
      return NextResponse.redirect(new URL("/admin/impostazioni?tab=pagamenti&error=no_account", req.url))
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://prenotauncampetto.it"

    const accountLink = await stripe.accountLinks.create({
      account: connectAccount.stripe_account_id,
      refresh_url: `${baseUrl}/api/stripe/connect/refresh?clubId=${clubId}`,
      return_url: `${baseUrl}/admin/impostazioni?tab=pagamenti&connect=success`,
      type: "account_onboarding",
    })

    return NextResponse.redirect(accountLink.url)
  } catch (error) {
    console.error("[Connect Refresh] Errore:", error)
    return NextResponse.redirect(
      new URL("/admin/impostazioni?tab=pagamenti&error=refresh_failed", req.url)
    )
  }
}

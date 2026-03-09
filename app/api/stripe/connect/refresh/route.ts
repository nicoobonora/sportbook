import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/stripe/connect/refresh?clubId=xxx
 * Rigenera il link di onboarding Connect (quando il link originale scade).
 * Redirect automatico al nuovo link.
 *
 * Nota: questo endpoint è chiamato direttamente da Stripe (redirect),
 * quindi usiamo req.url per ricostruire l'origin corretto.
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

    // Usa l'origin dalla request URL (è già sul subdominio giusto)
    const origin = req.nextUrl.origin

    const accountLink = await stripe.accountLinks.create({
      account: connectAccount.stripe_account_id,
      refresh_url: `${origin}/api/stripe/connect/refresh?clubId=${clubId}`,
      return_url: `${origin}/admin/impostazioni?tab=pagamenti&connect=success`,
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

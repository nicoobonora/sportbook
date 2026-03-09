import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/stripe/connect/status?clubId=xxx
 * Controlla lo stato dell'account Connect Express del circolo.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    }

    const clubId = req.nextUrl.searchParams.get("clubId")
    if (!clubId) {
      return NextResponse.json({ error: "clubId richiesto" }, { status: 400 })
    }

    const { data: isAdmin } = await supabase.rpc("is_club_admin", { p_club_id: clubId })
    if (!isAdmin) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { data: connectAccount } = await adminClient
      .from("stripe_connect_accounts")
      .select("*")
      .eq("club_id", clubId)
      .single()

    if (!connectAccount) {
      return NextResponse.json({
        hasAccount: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingComplete: false,
      })
    }

    // Sincronizza stato da Stripe
    const account = await stripe.accounts.retrieve(connectAccount.stripe_account_id)

    const chargesEnabled = account.charges_enabled || false
    const payoutsEnabled = account.payouts_enabled || false
    const onboardingComplete = chargesEnabled && payoutsEnabled

    // Aggiorna DB se cambiato
    if (
      connectAccount.charges_enabled !== chargesEnabled ||
      connectAccount.payouts_enabled !== payoutsEnabled ||
      connectAccount.onboarding_complete !== onboardingComplete
    ) {
      await adminClient
        .from("stripe_connect_accounts")
        .update({
          charges_enabled: chargesEnabled,
          payouts_enabled: payoutsEnabled,
          onboarding_complete: onboardingComplete,
          updated_at: new Date().toISOString(),
        })
        .eq("id", connectAccount.id)
    }

    return NextResponse.json({
      hasAccount: true,
      chargesEnabled,
      payoutsEnabled,
      onboardingComplete,
      stripeAccountId: connectAccount.stripe_account_id,
    })
  } catch (error) {
    console.error("[Connect Status] Errore:", error)
    return NextResponse.json(
      { error: "Errore nel recupero dello stato" },
      { status: 500 }
    )
  }
}

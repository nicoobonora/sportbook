import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const onboardSchema = z.object({
  clubId: z.string().uuid(),
})

/**
 * Ricava l'origin (schema + host) dalla request.
 */
function getOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin")
  if (origin) return origin
  const referer = req.headers.get("referer")
  if (referer) {
    try { return new URL(referer).origin } catch {}
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "https://prenotauncampetto.it"
}

/**
 * POST /api/stripe/connect/onboard
 * Crea un account Stripe Connect Express e genera il link di onboarding.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = onboardSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dati non validi", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { clubId } = parsed.data

    const { data: isAdmin } = await supabase.rpc("is_club_admin", { p_club_id: clubId })
    if (!isAdmin) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Verifica piano — solo Pro e Business possono attivare Connect
    const { data: club } = await adminClient
      .from("clubs")
      .select("id, name, email, stripe_plan_type")
      .eq("id", clubId)
      .single()

    if (!club) {
      return NextResponse.json({ error: "Circolo non trovato" }, { status: 404 })
    }

    if (!["pro", "business"].includes(club.stripe_plan_type || "none")) {
      return NextResponse.json(
        { error: "I pagamenti online richiedono un piano Pro o Business" },
        { status: 403 }
      )
    }

    // Controlla se esiste già un account Connect
    const { data: existingAccount } = await adminClient
      .from("stripe_connect_accounts")
      .select("stripe_account_id")
      .eq("club_id", clubId)
      .single()

    let stripeAccountId: string

    if (existingAccount) {
      stripeAccountId = existingAccount.stripe_account_id
    } else {
      // Crea nuovo account Connect Express
      const account = await stripe.accounts.create({
        type: "express",
        country: "IT",
        email: club.email || user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: club.name,
          mcc: "7941", // Sporting/Recreation Camps
        },
        metadata: { club_id: clubId },
      })

      stripeAccountId = account.id

      await adminClient.from("stripe_connect_accounts").insert({
        club_id: clubId,
        stripe_account_id: stripeAccountId,
      })
    }

    // Genera AccountLink per l'onboarding
    const origin = getOrigin(req)

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/api/stripe/connect/refresh?clubId=${clubId}`,
      return_url: `${origin}/admin/impostazioni?tab=pagamenti&connect=success`,
      type: "account_onboarding",
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error("[Connect Onboard] Errore:", error)
    return NextResponse.json(
      { error: "Errore nell'avvio dell'onboarding" },
      { status: 500 }
    )
  }
}

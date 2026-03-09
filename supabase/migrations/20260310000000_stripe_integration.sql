-- ============================================================
-- Stripe Integration: Subscriptions, Connect, Payments
-- ============================================================

-- 1. Nuova tabella: stripe_subscriptions
CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'starter' CHECK (plan_type IN ('starter', 'pro', 'business')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'incomplete_expired')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Nuova tabella: stripe_connect_accounts
CREATE TABLE IF NOT EXISTS public.stripe_connect_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE UNIQUE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Nuova tabella: stripe_payments
CREATE TABLE IF NOT EXISTS public.stripe_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  application_fee_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Colonne aggiuntive su clubs
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_plan_type TEXT DEFAULT 'none' CHECK (stripe_plan_type IN ('none', 'starter', 'pro', 'business')),
  ADD COLUMN IF NOT EXISTS max_fields INTEGER DEFAULT 2;

-- 5. Colonne aggiuntive su bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded')),
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- ============================================================
-- Indici
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_club_id ON public.stripe_subscriptions(club_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_sub_id ON public.stripe_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_club_id ON public.stripe_connect_accounts(club_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_booking_id ON public.stripe_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_club_id ON public.stripe_payments(club_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_intent_id ON public.stripe_payments(stripe_payment_intent_id);

-- ============================================================
-- RLS Policies
-- ============================================================

-- stripe_subscriptions
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club admins can view their subscriptions"
  ON public.stripe_subscriptions FOR SELECT
  USING (
    public.is_club_admin(club_id) OR public.is_super_admin()
  );

CREATE POLICY "Service role can manage subscriptions"
  ON public.stripe_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- stripe_connect_accounts
ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club admins can view their connect accounts"
  ON public.stripe_connect_accounts FOR SELECT
  USING (
    public.is_club_admin(club_id) OR public.is_super_admin()
  );

CREATE POLICY "Service role can manage connect accounts"
  ON public.stripe_connect_accounts FOR ALL
  USING (auth.role() = 'service_role');

-- stripe_payments
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club admins can view their payments"
  ON public.stripe_payments FOR SELECT
  USING (
    public.is_club_admin(club_id) OR public.is_super_admin()
  );

CREATE POLICY "Service role can manage payments"
  ON public.stripe_payments FOR ALL
  USING (auth.role() = 'service_role');

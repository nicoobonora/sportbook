-- ============================================================
-- Migration 006: Add columns to support bulk import & claim flow
-- Enables: scraped data import, unclaimed/claimed status, Google metadata
-- ============================================================

-- ── Claim status: tracks whether a club owner has claimed their page ──
-- unclaimed = pre-populated from scraped data, no admin assigned
-- pending   = owner requested claim, awaiting verification
-- claimed   = verified owner managing the page
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'claimed'
  CHECK (claim_status IN ('unclaimed', 'pending', 'claimed'));

-- ── Google Places metadata ──
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS google_rating DOUBLE PRECISION;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS google_total_ratings INTEGER;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS business_status TEXT;

-- ── Province (useful for Italian geography) ──
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS province TEXT;

-- ── Unique constraint on google_place_id to prevent duplicate imports ──
CREATE UNIQUE INDEX IF NOT EXISTS idx_clubs_google_place_id
  ON clubs(google_place_id)
  WHERE google_place_id IS NOT NULL;

-- ── Index on claim_status for filtering ──
CREATE INDEX IF NOT EXISTS idx_clubs_claim_status
  ON clubs(claim_status);

-- ── Update RLS: allow public read of unclaimed clubs (visible on map) ──
-- Drop and recreate the public read policy to include unclaimed active clubs
DROP POLICY IF EXISTS "clubs_public_read" ON clubs;
CREATE POLICY "clubs_public_read" ON clubs
  FOR SELECT
  USING (is_active = true);

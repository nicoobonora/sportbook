-- ============================================================
-- Migration 004: Add geocoding columns to clubs
-- Supports map-based discovery with lat/lng coordinates
-- ============================================================

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'IT';

-- Partial index for clubs with coordinates (used by map queries)
CREATE INDEX IF NOT EXISTS idx_clubs_coordinates
  ON clubs(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- GIN index for array-based sport filtering
CREATE INDEX IF NOT EXISTS idx_clubs_sports
  ON clubs USING GIN(sports);

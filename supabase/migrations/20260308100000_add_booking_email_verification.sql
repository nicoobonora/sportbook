-- ============================================================
-- Migration: Verifica email per prenotazioni
-- Aggiunge token di verifica e stato "unverified" ai bookings
-- ============================================================

-- Nuove colonne per la verifica email
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS verification_token UUID DEFAULT gen_random_uuid();
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Indice per lookup veloce del token
CREATE INDEX IF NOT EXISTS idx_bookings_verification_token
  ON bookings(verification_token) WHERE verification_token IS NOT NULL;

-- Aggiorna il check constraint sullo status (se esiste)
-- Lo status ora include "unverified"
-- Nota: se non c'è un CHECK constraint, lo aggiungiamo
DO $$
BEGIN
  -- Prova a droppare un eventuale constraint esistente
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('unverified', 'pending', 'confirmed', 'rejected', 'cancelled'));

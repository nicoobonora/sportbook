-- ============================================================
-- Migration: Tabella claim_requests
-- Gestisce le richieste di reclamo da parte dei gestori
-- ============================================================

CREATE TABLE IF NOT EXISTS claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  -- Dati del richiedente
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'proprietario',
  message TEXT,
  -- Stato della richiesta
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indici
CREATE INDEX idx_claim_requests_club_id ON claim_requests(club_id);
CREATE INDEX idx_claim_requests_status ON claim_requests(status);

-- Una sola richiesta pending per club
CREATE UNIQUE INDEX idx_claim_requests_unique_pending
  ON claim_requests(club_id) WHERE status = 'pending';

-- RLS
ALTER TABLE claim_requests ENABLE ROW LEVEL SECURITY;

-- Solo il service role può leggere/scrivere (gestito da API)
CREATE POLICY "Service role full access on claim_requests"
  ON claim_requests FOR ALL
  USING (true)
  WITH CHECK (true);

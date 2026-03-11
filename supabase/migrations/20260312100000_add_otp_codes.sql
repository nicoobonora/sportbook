-- Tabella per i codici OTP custom (inviati via Resend)
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indice per lookup veloce email+codice (solo non usati)
CREATE INDEX idx_otp_codes_email_code ON otp_codes (email, code) WHERE NOT used;

-- Indice per cleanup codici scaduti
CREATE INDEX idx_otp_codes_expires_at ON otp_codes (expires_at) WHERE NOT used;

-- RLS: la tabella è accessibile solo via service role (API routes)
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
-- Nessuna policy pubblica — accesso solo tramite admin/service role client

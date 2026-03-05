-- ============================================================
-- SportBook — Schema iniziale del database
-- ============================================================
-- Questo file crea tutte le tabelle, indici, funzioni e
-- Row Level Security (RLS) policies necessarie al funzionamento
-- della piattaforma multi-tenant.
-- ============================================================

-- ── Abilita le estensioni necessarie ──
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELLE
-- ============================================================

-- Circoli sportivi
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  about_text TEXT,
  about_image_url TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  primary_color TEXT DEFAULT '#1D4ED8',
  accent_color TEXT DEFAULT '#F59E0B',
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  sports TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin dei circoli (relazione utente-circolo)
CREATE TABLE club_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- Strutture/campi del circolo
CREATE TABLE fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  description TEXT,
  capacity INT DEFAULT 2,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Template slot settimanali (configurazione ricorrente)
CREATE TABLE slot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  field_id UUID REFERENCES fields(id) ON DELETE CASCADE NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price_cents INT DEFAULT 0,
  max_bookings INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Slot effettivi (generati da template o creati manualmente)
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  field_id UUID REFERENCES fields(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price_cents INT DEFAULT 0,
  max_bookings INT DEFAULT 1,
  current_bookings INT DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Vincolo unicità per prevenire duplicati
  UNIQUE(field_id, date, start_time),
  CONSTRAINT valid_slot_time CHECK (start_time < end_time),
  CONSTRAINT valid_bookings CHECK (current_bookings >= 0 AND current_bookings <= max_bookings)
);

-- Prenotazioni
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  slot_id UUID REFERENCES slots(id) ON DELETE CASCADE NOT NULL,
  field_id UUID REFERENCES fields(id) NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  confirmed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Annunci / eventi
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Configurazione cookie consent per circolo
CREATE TABLE cookie_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE UNIQUE NOT NULL,
  analytics_enabled BOOLEAN DEFAULT false,
  marketing_enabled BOOLEAN DEFAULT false,
  privacy_policy_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDICI per performance
-- ============================================================

CREATE INDEX idx_clubs_slug ON clubs(slug);
CREATE INDEX idx_clubs_active ON clubs(is_active);
CREATE INDEX idx_club_admins_user ON club_admins(user_id);
CREATE INDEX idx_club_admins_club ON club_admins(club_id);
CREATE INDEX idx_fields_club ON fields(club_id);
CREATE INDEX idx_slot_templates_club ON slot_templates(club_id);
CREATE INDEX idx_slot_templates_field ON slot_templates(field_id);
CREATE INDEX idx_slots_club_date ON slots(club_id, date);
CREATE INDEX idx_slots_field_date ON slots(field_id, date);
CREATE INDEX idx_bookings_club ON bookings(club_id);
CREATE INDEX idx_bookings_slot ON bookings(slot_id);
CREATE INDEX idx_bookings_status ON bookings(club_id, status);
CREATE INDEX idx_announcements_club ON announcements(club_id);
CREATE INDEX idx_announcements_published ON announcements(club_id, published_at DESC);

-- ============================================================
-- FUNZIONE: aggiorna updated_at automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger su tutte le tabelle con updated_at
CREATE TRIGGER trg_clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cookie_configs_updated_at
  BEFORE UPDATE ON cookie_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNZIONE: verifica se l'utente è admin di un circolo
-- ============================================================

CREATE OR REPLACE FUNCTION is_club_admin(p_club_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM club_admins
    WHERE club_id = p_club_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNZIONE: verifica se l'utente è super-admin
-- Basata sull'email nell'app_metadata o nella lista allowlist
-- ============================================================

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- ── Clubs ──
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Lettura pubblica: solo circoli attivi
CREATE POLICY "clubs_public_read" ON clubs
  FOR SELECT
  USING (is_active = true);

-- Super-admin: accesso completo
CREATE POLICY "clubs_super_admin_all" ON clubs
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Club admin: lettura del proprio circolo
CREATE POLICY "clubs_admin_read" ON clubs
  FOR SELECT
  USING (is_club_admin(id));

-- Club admin: aggiornamento del proprio circolo
CREATE POLICY "clubs_admin_update" ON clubs
  FOR UPDATE
  USING (is_club_admin(id))
  WITH CHECK (is_club_admin(id));

-- ── Club Admins ──
ALTER TABLE club_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_admins_super_admin" ON club_admins
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "club_admins_self_read" ON club_admins
  FOR SELECT
  USING (user_id = auth.uid());

-- ── Fields ──
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;

-- Lettura pubblica dei campi di circoli attivi
CREATE POLICY "fields_public_read" ON fields
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs WHERE clubs.id = fields.club_id AND clubs.is_active = true
    )
  );

-- Club admin: gestione completa dei propri campi
CREATE POLICY "fields_admin_all" ON fields
  FOR ALL
  USING (is_club_admin(club_id))
  WITH CHECK (is_club_admin(club_id));

-- Super-admin: accesso completo
CREATE POLICY "fields_super_admin" ON fields
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ── Slot Templates ──
ALTER TABLE slot_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slot_templates_admin" ON slot_templates
  FOR ALL
  USING (is_club_admin(club_id))
  WITH CHECK (is_club_admin(club_id));

CREATE POLICY "slot_templates_super_admin" ON slot_templates
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ── Slots ──
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;

-- Lettura pubblica: slot di circoli attivi, non bloccati
CREATE POLICY "slots_public_read" ON slots
  FOR SELECT
  USING (
    is_blocked = false AND
    EXISTS (
      SELECT 1 FROM clubs WHERE clubs.id = slots.club_id AND clubs.is_active = true
    )
  );

-- Club admin: gestione completa dei propri slot
CREATE POLICY "slots_admin_all" ON slots
  FOR ALL
  USING (is_club_admin(club_id))
  WITH CHECK (is_club_admin(club_id));

-- Super-admin: accesso completo
CREATE POLICY "slots_super_admin" ON slots
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ── Bookings ──
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Inserimento pubblico (chiunque può prenotare)
CREATE POLICY "bookings_public_insert" ON bookings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clubs WHERE clubs.id = bookings.club_id AND clubs.is_active = true
    )
  );

-- Club admin: lettura e gestione delle prenotazioni del proprio circolo
CREATE POLICY "bookings_admin_all" ON bookings
  FOR ALL
  USING (is_club_admin(club_id))
  WITH CHECK (is_club_admin(club_id));

-- Super-admin: accesso completo
CREATE POLICY "bookings_super_admin" ON bookings
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ── Announcements ──
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Lettura pubblica: annunci di circoli attivi, non scaduti
CREATE POLICY "announcements_public_read" ON announcements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs WHERE clubs.id = announcements.club_id AND clubs.is_active = true
    )
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Club admin: gestione completa dei propri annunci
CREATE POLICY "announcements_admin_all" ON announcements
  FOR ALL
  USING (is_club_admin(club_id))
  WITH CHECK (is_club_admin(club_id));

-- Super-admin: accesso completo
CREATE POLICY "announcements_super_admin" ON announcements
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ── Cookie Configs ──
ALTER TABLE cookie_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cookie_configs_public_read" ON cookie_configs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs WHERE clubs.id = cookie_configs.club_id AND clubs.is_active = true
    )
  );

CREATE POLICY "cookie_configs_admin" ON cookie_configs
  FOR ALL
  USING (is_club_admin(club_id))
  WITH CHECK (is_club_admin(club_id));

CREATE POLICY "cookie_configs_super_admin" ON cookie_configs
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ============================================================
-- FUNZIONE: conferma prenotazione (con update atomico dello slot)
-- Previene race conditions sull'aggiornamento di current_bookings
-- ============================================================

CREATE OR REPLACE FUNCTION confirm_booking(p_booking_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_slot_id UUID;
  v_club_id UUID;
  v_updated INT;
BEGIN
  -- Recupera slot_id e club_id dalla prenotazione
  SELECT slot_id, club_id INTO v_slot_id, v_club_id
  FROM bookings
  WHERE id = p_booking_id AND status = 'pending';

  IF v_slot_id IS NULL THEN
    RETURN false;
  END IF;

  -- Verifica che l'utente sia admin del circolo
  IF NOT is_club_admin(v_club_id) AND NOT is_super_admin() THEN
    RETURN false;
  END IF;

  -- Incrementa current_bookings solo se non ha raggiunto il massimo (optimistic locking)
  UPDATE slots
  SET current_bookings = current_bookings + 1
  WHERE id = v_slot_id
    AND current_bookings < max_bookings;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    -- Slot pieno, rifiuta automaticamente
    UPDATE bookings
    SET status = 'rejected',
        rejected_at = now(),
        rejection_reason = 'Slot esaurito'
    WHERE id = p_booking_id;
    RETURN false;
  END IF;

  -- Conferma la prenotazione
  UPDATE bookings
  SET status = 'confirmed',
      confirmed_at = now()
  WHERE id = p_booking_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNZIONE: rifiuta prenotazione
-- ============================================================

CREATE OR REPLACE FUNCTION reject_booking(p_booking_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_club_id UUID;
BEGIN
  SELECT club_id INTO v_club_id
  FROM bookings
  WHERE id = p_booking_id AND status = 'pending';

  IF v_club_id IS NULL THEN
    RETURN false;
  END IF;

  IF NOT is_club_admin(v_club_id) AND NOT is_super_admin() THEN
    RETURN false;
  END IF;

  UPDATE bookings
  SET status = 'rejected',
      rejected_at = now(),
      rejection_reason = p_reason
  WHERE id = p_booking_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNZIONE: genera slot da template per le prossime N settimane
-- ============================================================

CREATE OR REPLACE FUNCTION generate_slots_from_templates(
  p_club_id UUID,
  p_weeks INT DEFAULT 4
)
RETURNS INT AS $$
DECLARE
  v_template RECORD;
  v_date DATE;
  v_end_date DATE;
  v_count INT := 0;
BEGIN
  v_end_date := CURRENT_DATE + (p_weeks * 7);

  FOR v_template IN
    SELECT * FROM slot_templates
    WHERE club_id = p_club_id AND is_active = true
  LOOP
    v_date := CURRENT_DATE;
    WHILE v_date <= v_end_date LOOP
      -- EXTRACT(DOW ...) restituisce 0=domenica, 1=lunedì, ..., 6=sabato
      IF EXTRACT(DOW FROM v_date) = v_template.day_of_week THEN
        -- Inserisci solo se non esiste già (ON CONFLICT ignora duplicati)
        INSERT INTO slots (club_id, field_id, date, start_time, end_time, price_cents, max_bookings)
        VALUES (
          p_club_id,
          v_template.field_id,
          v_date,
          v_template.start_time,
          v_template.end_time,
          v_template.price_cents,
          v_template.max_bookings
        )
        ON CONFLICT (field_id, date, start_time) DO NOTHING;

        v_count := v_count + 1;
      END IF;
      v_date := v_date + 1;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

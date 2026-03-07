-- ============================================================
-- Opening Hours + Flexible Bookings
-- ============================================================
-- Sostituisce il sistema slot_templates con fasce orarie di apertura
-- e permette prenotazioni con durata flessibile.
-- ============================================================

-- ── Tabella opening_hours: fasce orarie di apertura per campo ──
CREATE TABLE opening_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  field_id UUID REFERENCES fields(id) ON DELETE CASCADE NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price_per_hour_cents INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_opening_time CHECK (start_time < end_time)
);

-- ── Indici ──
CREATE INDEX idx_opening_hours_club ON opening_hours(club_id);
CREATE INDEX idx_opening_hours_field_day ON opening_hours(field_id, day_of_week);

-- ── RLS ──
ALTER TABLE opening_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opening_hours_public_read" ON opening_hours
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs WHERE clubs.id = opening_hours.club_id AND clubs.is_active = true
    )
  );

CREATE POLICY "opening_hours_admin" ON opening_hours
  FOR ALL
  USING (is_club_admin(club_id))
  WITH CHECK (is_club_admin(club_id));

CREATE POLICY "opening_hours_super_admin" ON opening_hours
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ── Modifica bookings per supportare prenotazioni flessibili ──
-- Aggiungi colonne per tempo diretto (nuove prenotazioni non usano più slot_id)
ALTER TABLE bookings
  ADD COLUMN date DATE,
  ADD COLUMN start_time TIME,
  ADD COLUMN end_time TIME,
  ADD COLUMN price_cents INT DEFAULT 0;

-- Rendi slot_id opzionale (le vecchie prenotazioni lo mantengono)
ALTER TABLE bookings ALTER COLUMN slot_id DROP NOT NULL;

-- Popola le nuove colonne dalle vecchie prenotazioni che hanno slot_id
UPDATE bookings
SET date = s.date,
    start_time = s.start_time,
    end_time = s.end_time,
    price_cents = s.price_cents
FROM slots s
WHERE bookings.slot_id = s.id
  AND bookings.date IS NULL;

-- Vincolo: le nuove prenotazioni devono avere date + start_time + end_time
-- (le vecchie possono avere slot_id senza queste colonne, ma dopo la migrazione sopra le hanno tutte)
ALTER TABLE bookings
  ADD CONSTRAINT valid_booking_time CHECK (
    (date IS NOT NULL AND start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
    OR slot_id IS NOT NULL
  );

-- Indice per ricerca disponibilità: prenotazioni per campo+data
CREATE INDEX idx_bookings_field_date ON bookings(field_id, date);

-- ============================================================
-- FUNZIONE: conferma prenotazione v2 (per prenotazioni flessibili)
-- Verifica che non ci siano sovrapposizioni con altre confermate
-- ============================================================

CREATE OR REPLACE FUNCTION confirm_booking(p_booking_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_booking RECORD;
  v_overlap_count INT;
BEGIN
  -- Recupera la prenotazione
  SELECT id, club_id, field_id, slot_id, date, start_time, end_time, status
  INTO v_booking
  FROM bookings
  WHERE id = p_booking_id AND status = 'pending';

  IF v_booking.id IS NULL THEN
    RETURN false;
  END IF;

  -- Verifica permessi
  IF NOT is_club_admin(v_booking.club_id) AND NOT is_super_admin() THEN
    RETURN false;
  END IF;

  -- Per prenotazioni con slot_id (vecchio sistema): usa la logica originale
  IF v_booking.slot_id IS NOT NULL AND v_booking.date IS NULL THEN
    UPDATE slots
    SET current_bookings = current_bookings + 1
    WHERE id = v_booking.slot_id
      AND current_bookings < max_bookings;

    IF NOT FOUND THEN
      UPDATE bookings
      SET status = 'rejected',
          rejected_at = now(),
          rejection_reason = 'Slot esaurito'
      WHERE id = p_booking_id;
      RETURN false;
    END IF;

    UPDATE bookings
    SET status = 'confirmed',
        confirmed_at = now()
    WHERE id = p_booking_id;
    RETURN true;
  END IF;

  -- Per prenotazioni flessibili: verifica sovrapposizioni
  SELECT COUNT(*) INTO v_overlap_count
  FROM bookings
  WHERE field_id = v_booking.field_id
    AND date = v_booking.date
    AND id != p_booking_id
    AND status = 'confirmed'
    AND start_time < v_booking.end_time
    AND end_time > v_booking.start_time;

  IF v_overlap_count > 0 THEN
    UPDATE bookings
    SET status = 'rejected',
        rejected_at = now(),
        rejection_reason = 'Fascia oraria già occupata da altra prenotazione confermata'
    WHERE id = p_booking_id;
    RETURN false;
  END IF;

  -- Conferma
  UPDATE bookings
  SET status = 'confirmed',
      confirmed_at = now()
  WHERE id = p_booking_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

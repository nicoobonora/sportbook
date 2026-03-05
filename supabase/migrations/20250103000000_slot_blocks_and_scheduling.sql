-- ============================================================
-- Slot Blocks: eccezioni e blocchi per la pianificazione
-- Supporta blocchi su date specifiche e blocchi ricorrenti
-- ============================================================

CREATE TABLE slot_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  field_id UUID REFERENCES fields(id) ON DELETE CASCADE NOT NULL,

  -- Tipo di blocco
  block_type TEXT NOT NULL CHECK (block_type IN ('single_date', 'recurring')),

  -- Per blocchi su data specifica
  block_date DATE,

  -- Per blocchi ricorrenti (0=domenica ... 6=sabato)
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),

  -- Fascia oraria da bloccare (NULL = intera giornata)
  start_time TIME,
  end_time TIME,

  -- Motivo del blocco (opzionale)
  reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),

  -- Vincoli
  CONSTRAINT valid_block_time CHECK (
    (start_time IS NULL AND end_time IS NULL) OR
    (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
  ),
  CONSTRAINT valid_single_date CHECK (
    block_type != 'single_date' OR block_date IS NOT NULL
  ),
  CONSTRAINT valid_recurring CHECK (
    block_type != 'recurring' OR day_of_week IS NOT NULL
  )
);

-- ── Indici ──
CREATE INDEX idx_slot_blocks_club ON slot_blocks(club_id);
CREATE INDEX idx_slot_blocks_field_date ON slot_blocks(field_id, block_date);
CREATE INDEX idx_slot_blocks_field_day ON slot_blocks(field_id, day_of_week);

-- ── RLS ──
ALTER TABLE slot_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slot_blocks_admin" ON slot_blocks
  FOR ALL
  USING (is_club_admin(club_id))
  WITH CHECK (is_club_admin(club_id));

CREATE POLICY "slot_blocks_super_admin" ON slot_blocks
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "slot_blocks_public_read" ON slot_blocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs WHERE clubs.id = slot_blocks.club_id AND clubs.is_active = true
    )
  );

-- ============================================================
-- Aggiorna generate_slots_from_templates per rispettare i blocchi
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
  v_is_blocked BOOLEAN;
BEGIN
  v_end_date := CURRENT_DATE + (p_weeks * 7);

  FOR v_template IN
    SELECT * FROM slot_templates
    WHERE club_id = p_club_id AND is_active = true
  LOOP
    v_date := CURRENT_DATE;
    WHILE v_date <= v_end_date LOOP
      IF EXTRACT(DOW FROM v_date) = v_template.day_of_week THEN
        -- Controlla se lo slot è bloccato
        SELECT EXISTS (
          SELECT 1 FROM slot_blocks
          WHERE club_id = p_club_id
            AND field_id = v_template.field_id
            AND (
              (block_type = 'single_date' AND block_date = v_date AND (
                start_time IS NULL OR
                (v_template.start_time >= start_time AND v_template.start_time < end_time)
              ))
              OR
              (block_type = 'recurring' AND slot_blocks.day_of_week = v_template.day_of_week AND (
                start_time IS NULL OR
                (v_template.start_time >= start_time AND v_template.start_time < end_time)
              ))
            )
        ) INTO v_is_blocked;

        INSERT INTO slots (club_id, field_id, date, start_time, end_time, price_cents, max_bookings, is_blocked)
        VALUES (
          p_club_id,
          v_template.field_id,
          v_date,
          v_template.start_time,
          v_template.end_time,
          v_template.price_cents,
          v_template.max_bookings,
          v_is_blocked
        )
        ON CONFLICT (field_id, date, start_time) DO UPDATE
        SET is_blocked = EXCLUDED.is_blocked
        WHERE slots.current_bookings = 0;

        v_count := v_count + 1;
      END IF;
      v_date := v_date + 1;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

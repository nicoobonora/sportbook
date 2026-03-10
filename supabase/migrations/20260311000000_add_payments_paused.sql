-- Aggiunge la possibilità per gli admin di mettere in pausa i pagamenti online
ALTER TABLE stripe_connect_accounts
  ADD COLUMN payments_paused BOOLEAN NOT NULL DEFAULT FALSE;

-- Policy: gli admin del club possono aggiornare payments_paused del proprio club
CREATE POLICY "Club admins can toggle payments_paused"
  ON stripe_connect_accounts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_admins
      WHERE club_admins.club_id = stripe_connect_accounts.club_id
        AND club_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_admins
      WHERE club_admins.club_id = stripe_connect_accounts.club_id
        AND club_admins.user_id = auth.uid()
    )
  );

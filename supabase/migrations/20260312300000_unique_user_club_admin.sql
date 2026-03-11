-- Vincolo unicità: ogni utente può essere admin di un solo circolo.
-- Questo enforcement a livello DB la regola "1 email = 1 club".
ALTER TABLE club_admins
  ADD CONSTRAINT club_admins_user_id_unique UNIQUE (user_id);

-- Salva la password generata per gli admin dei circoli,
-- visibile solo dal super-admin tramite service role.
ALTER TABLE club_admins ADD COLUMN plain_password TEXT;

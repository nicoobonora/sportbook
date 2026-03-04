-- ============================================================
-- Fix: is_super_admin() ora controlla l'email dell'utente
-- anziché raw_user_meta_data->>'role'.
--
-- L'email dell'utente è disponibile nel JWT di Supabase.
-- Modifica la lista di email qui sotto per aggiungere/rimuovere
-- super-admin a livello di database.
--
-- NOTA: Questo è un livello di sicurezza aggiuntivo.
-- La verifica primaria avviene nelle API Routes tramite
-- la variabile d'ambiente SUPER_ADMIN_EMAILS.
-- ============================================================

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Controlla l'email dal JWT token di Supabase
  -- Aggiorna questa lista per aggiungere nuovi super-admin
  RETURN (auth.jwt() ->> 'email') IN (
    -- Inserisci qui le email dei super-admin
    -- Devono corrispondere a SUPER_ADMIN_EMAILS nella .env
    'nicobonoraaa@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aggiungiamo anche una policy che permette al super-admin
-- di leggere tutti i circoli (anche quelli non attivi)
-- La policy esistente clubs_public_read mostra solo is_active=true
-- La policy clubs_super_admin_all richiede is_super_admin() che ora funziona

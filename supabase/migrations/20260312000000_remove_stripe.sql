-- Rimozione completa delle tabelle e colonne Stripe/pagamenti.
-- Le funzionalità di pagamento online sono state rimosse dalla piattaforma.

-- Drop tabelle Stripe (in ordine di dipendenza)
DROP TABLE IF EXISTS stripe_payments;
DROP TABLE IF EXISTS stripe_connect_accounts;
DROP TABLE IF EXISTS stripe_subscriptions;

-- Rimuovi colonne Stripe dalla tabella clubs
ALTER TABLE clubs DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE clubs DROP COLUMN IF EXISTS stripe_plan_type;
ALTER TABLE clubs DROP COLUMN IF EXISTS max_fields;

-- Rimuovi colonne pagamento dalla tabella bookings
ALTER TABLE bookings DROP COLUMN IF EXISTS payment_status;
ALTER TABLE bookings DROP COLUMN IF EXISTS stripe_payment_intent_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS paid_at;

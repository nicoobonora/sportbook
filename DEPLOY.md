# Guida al Deploy — PrenotaUnCampetto

Guida completa per il deploy in produzione su **Vercel** + **Supabase**.

---

## Indice

1. [Prerequisiti](#1-prerequisiti)
2. [Setup Supabase](#2-setup-supabase)
3. [Configurazione DNS e Domini](#3-configurazione-dns-e-domini)
4. [Deploy su Vercel](#4-deploy-su-vercel)
5. [Variabili d'Ambiente](#5-variabili-dambiente)
6. [Servizi Esterni](#6-servizi-esterni)
7. [Post-Deploy Checklist](#7-post-deploy-checklist)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisiti

| Requisito | Dettagli |
|-----------|----------|
| **Node.js** | >= 20 |
| **Account Supabase** | [supabase.com](https://supabase.com) (piano Free ok per iniziare) |
| **Account Vercel** | [vercel.com](https://vercel.com) (piano Pro consigliato per wildcard domains) |
| **Dominio** | `prenotauncampetto.it` (o il dominio scelto) |
| **Account Resend** | [resend.com](https://resend.com) (per email transazionali) |
| **Account Sentry** | [sentry.io](https://sentry.io) (opzionale, per error monitoring) |

---

## 2. Setup Supabase

### 2.1 Crea il Progetto

1. Vai su [app.supabase.com](https://app.supabase.com) → **New Project**
2. Scegli la **region** più vicina ai tuoi utenti (es. `West EU - Frankfurt` per l'Italia)
3. Imposta una **password per il database** sicura (salvala)
4. Attendi il provisioning (~2 minuti)

### 2.2 Recupera le Credenziali

Vai su **Settings → API** e copia:

| Chiave | Dove trovarla | Uso |
|--------|--------------|-----|
| `Project URL` | Settings → API | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon (public)` | Settings → API → Project API keys | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role (secret)` | Settings → API → Project API keys | `SUPABASE_SERVICE_ROLE_KEY` |

> **ATTENZIONE:** La `service_role` key bypassa tutte le RLS policies. Non esporla mai nel codice client.

### 2.3 Esegui le Migrazioni

Le migrazioni vanno eseguite **in ordine**. Hai due opzioni:

#### Opzione A: Supabase CLI (consigliata)

```bash
# Installa Supabase CLI se non presente
npm install -g supabase

# Login
supabase login

# Collega al progetto remoto
supabase link --project-ref <il-tuo-project-ref>

# Esegui tutte le migrazioni
supabase db push
```

#### Opzione B: SQL Editor (manuale)

Vai su **SQL Editor** nella dashboard Supabase ed esegui i file in questo ordine:

1. `supabase/migrations/001_initial_schema.sql` — Schema iniziale (tabelle, RLS, funzioni)
2. `supabase/migrations/002_fix_is_super_admin.sql` — Fix funzione super-admin
3. `supabase/migrations/003_slot_blocks_and_scheduling.sql` — Blocchi slot e scheduling
4. `supabase/migrations/004_add_geocoding_columns.sql` — Colonne geocoding per la mappa

### 2.4 Configura gli Email Super-Admin nel DB

La funzione `is_super_admin()` ha una lista hardcoded di email nel database. **Devi aggiornarla** con le tue email di produzione.

Esegui nel **SQL Editor**:

```sql
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email') IN (
    -- Aggiungi qui tutte le email super-admin, separate da virgola
    'tua-email@esempio.com',
    'altro-admin@esempio.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

> Queste email **devono corrispondere** a quelle nella variabile d'ambiente `SUPER_ADMIN_EMAILS`.

### 2.5 Configura l'Autenticazione

1. Vai su **Authentication → Providers**
2. Abilita **Email** provider (attivo di default)
3. Vai su **Authentication → URL Configuration**:
   - **Site URL:** `https://app.prenotauncampetto.it`
   - **Redirect URLs** (aggiungi tutti):
     ```
     https://app.prenotauncampetto.it/**
     https://*.prenotauncampetto.it/**
     ```
4. (Opzionale) Personalizza le **email templates** in Authentication → Email Templates

### 2.6 Verifica RLS

Vai su **Database → Tables** e verifica che **tutte le tabelle** abbiano RLS abilitato (icona scudo attiva):

- `clubs`, `club_admins`, `fields`, `slot_templates`, `slots`, `slot_blocks`, `bookings`, `announcements`, `cookie_configs`

---

## 3. Configurazione DNS e Domini

L'app usa un'architettura **multi-tenant con subdomini**:

| URL | Funzione |
|-----|----------|
| `app.prenotauncampetto.it` | Pannello super-admin |
| `[slug].prenotauncampetto.it` | Sito pubblico del circolo |
| `[slug].prenotauncampetto.it/admin` | Pannello admin del circolo |
| `prenotauncampetto.it` | Discovery page (mappa circoli) |

### 3.1 Record DNS

Configura nel pannello DNS del tuo registrar:

| Tipo | Nome | Valore | Note |
|------|------|--------|------|
| `A` | `@` | `76.76.21.21` | Root domain → Vercel |
| `CNAME` | `www` | `cname.vercel-dns.com` | Redirect www |
| `CNAME` | `app` | `cname.vercel-dns.com` | Super-admin |
| `CNAME` | `*` | `cname.vercel-dns.com` | Wildcard per tutti i circoli |

> L'IP `76.76.21.21` è l'IP di Vercel. Il CNAME `cname.vercel-dns.com` è il default di Vercel per domini custom.

### 3.2 Domini su Vercel

Nel progetto Vercel → **Settings → Domains**, aggiungi:

1. `prenotauncampetto.it` (root)
2. `app.prenotauncampetto.it` (super-admin)
3. `*.prenotauncampetto.it` (wildcard per i circoli)

> **Nota:** Il wildcard domain (`*`) richiede il **piano Pro** di Vercel.

---

## 4. Deploy su Vercel

### 4.1 Importa il Progetto

1. Vai su [vercel.com/new](https://vercel.com/new)
2. Importa il repository Git
3. Framework: **Next.js** (rilevato automaticamente)
4. Root directory: `.` (default)
5. NON modificare build command o output directory (i default sono corretti)

### 4.2 Build Settings

La configurazione è già definita in `vercel.json`:

```json
{
  "framework": "nextjs",
  "regions": ["fra1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

- **Region `fra1`** (Frankfurt) — bassa latenza per utenti italiani
- **Security headers** inclusi automaticamente

### 4.3 Comandi Build

```bash
# Build locale per verificare prima del deploy
npm install
npm run lint
npm run build

# Il deploy avviene automaticamente via Git push
git push origin main
```

---

## 5. Variabili d'Ambiente

Vai su Vercel → **Settings → Environment Variables** e configura:

### Variabili Obbligatorie

| Variabile | Valore | Ambienti |
|-----------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Production, Preview |
| `SUPER_ADMIN_EMAILS` | `admin@prenotauncampetto.it,altro@email.it` | Production, Preview |
| `NEXT_PUBLIC_BASE_URL` | `https://prenotauncampetto.it` | Production |
| `NEXT_PUBLIC_APP_DOMAIN` | `app.prenotauncampetto.it` | Production |
| `PREVIEW_TOKEN_SECRET` | *(stringa casuale di 32+ caratteri)* | Production, Preview |

> Genera `PREVIEW_TOKEN_SECRET` con: `openssl rand -base64 32`

### Variabili per Resend (Email)

| Variabile | Valore | Ambienti |
|-----------|--------|----------|
| `RESEND_API_KEY` | `re_xxxxx` | Production |

> Se vuoto, le email vengono loggate in console (utile per Preview).

### Variabili per Sentry (Opzionali)

| Variabile | Valore | Ambienti |
|-----------|--------|----------|
| `NEXT_PUBLIC_SENTRY_DSN` | `https://xxx@sentry.io/xxx` | Production |
| `SENTRY_ORG` | `tua-org` | Production, Preview |
| `SENTRY_PROJECT` | `prenotauncampetto` | Production, Preview |
| `SENTRY_AUTH_TOKEN` | `sntrys_xxx` | Production, Preview |

> Se `NEXT_PUBLIC_SENTRY_DSN` è vuoto, Sentry è disabilitato (nessun errore).

### Variabili per Preview Deployments

Per gli ambienti Preview di Vercel, usa le stesse variabili Supabase oppure un progetto Supabase di staging separato:

| Variabile | Valore Preview |
|-----------|---------------|
| `NEXT_PUBLIC_BASE_URL` | `https://prenotauncampetto-preview.vercel.app` |
| `NEXT_PUBLIC_APP_DOMAIN` | `prenotauncampetto-preview.vercel.app` |

---

## 6. Servizi Esterni

### 6.1 Resend (Email Transazionali)

Le email inviate dall'app:

| Evento | Destinatario | Template |
|--------|-------------|----------|
| Nuova prenotazione | Admin del circolo | `BookingReceivedEmail` |
| Prenotazione confermata | Utente | `BookingConfirmedEmail` |
| Prenotazione rifiutata | Utente | `BookingRejectedEmail` |
| Invito admin | Nuovo admin | `AdminInviteEmail` |
| Messaggio contatto | Email del circolo | Plain text |

**Setup Resend:**

1. Registrati su [resend.com](https://resend.com)
2. **Aggiungi il dominio** `prenotauncampetto.it`:
   - Vai su Domains → Add Domain
   - Aggiungi i record DNS richiesti (DKIM, SPF, DMARC)
   - Attendi la verifica (~5 minuti)
3. **Crea una API key** → copia in `RESEND_API_KEY`
4. Il mittente è configurato come `PrenotaUnCampetto <noreply@prenotauncampetto.it>`

**Record DNS per Resend:**

| Tipo | Nome | Valore |
|------|------|--------|
| `TXT` | `@` | `v=spf1 include:amazonses.com ~all` |
| `CNAME` | `resend._domainkey` | *(fornito da Resend)* |
| `TXT` | `_dmarc` | `v=DMARC1; p=none;` |

### 6.2 Sentry (Error Monitoring)

1. Crea un progetto su [sentry.io](https://sentry.io) → **Create Project → Next.js**
2. Copia il **DSN** → `NEXT_PUBLIC_SENTRY_DSN`
3. Crea un **Auth Token** per source maps → `SENTRY_AUTH_TOKEN`
   - Settings → Auth Tokens → Create New Token
   - Permessi: `project:releases`, `org:read`
4. Configura:
   - `SENTRY_ORG` = slug della tua organizzazione
   - `SENTRY_PROJECT` = `prenotauncampetto`
5. Performance sampling: 10% transazioni, 100% errori (configurato in `instrumentation.ts`)

### 6.3 Supabase Storage (Loghi Circoli)

Se i circoli caricano loghi/immagini:

1. Vai su **Storage** nella dashboard Supabase
2. Crea un bucket `club-assets` (pubblico)
3. Aggiungi una policy per upload solo da admin:
   ```sql
   CREATE POLICY "Club admins can upload"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'club-assets'
     AND auth.role() = 'authenticated'
   );
   ```

Le immagini Supabase sono già abilitate in `next.config.mjs`:
```javascript
images: {
  remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
}
```

---

## 7. Post-Deploy Checklist

### Verifica Funzionale

```
☐ Root domain (prenotauncampetto.it) → Pagina discovery con mappa
☐ app.prenotauncampetto.it → Redirect a login super-admin
☐ app.prenotauncampetto.it/super-admin/login → Form login
☐ Login con email in SUPER_ADMIN_EMAILS → Dashboard super-admin
☐ Crea un circolo di test con slug "test"
☐ test.prenotauncampetto.it → Sito pubblico del circolo
☐ test.prenotauncampetto.it/admin/login → Login admin circolo
☐ Aggiungi coordinate al circolo → Appare sulla mappa
☐ Crea campo + template slot → Genera slot
☐ Prenota come utente → Email notifica all'admin
☐ Conferma prenotazione → Email conferma all'utente
```

### Verifica Tecnica

```
☐ Security headers presenti (ispeziona con browser DevTools → Network)
☐ Sentry riceve eventi (genera un errore di test)
☐ Email arrivano (controlla spam e log Resend)
☐ SSL attivo su tutti i subdomini
☐ RLS funzionante (un utente non-admin non vede dati di altri circoli)
☐ Wildcard subdomain funzionante (prova slug-inesistente.prenotauncampetto.it → 404)
```

### Crea il Primo Super-Admin

1. Vai su `app.prenotauncampetto.it/super-admin/login`
2. Registrati con l'email presente in `SUPER_ADMIN_EMAILS`
3. Supabase invierà un'email di conferma (magic link)
4. Dopo la conferma, accedi alla dashboard

### Generazione Slot Periodica

La funzione `generate_slots_from_templates()` genera slot per le prossime settimane dai template configurati. Per automazione:

**Opzione A: Cron Job con Supabase** (consigliata)

Vai su **Database → Extensions** → abilita `pg_cron`, poi:

```sql
-- Genera slot ogni lunedì alle 3:00 AM per tutti i circoli attivi
SELECT cron.schedule(
  'generate-weekly-slots',
  '0 3 * * 1',
  $$
  SELECT generate_slots_from_templates(id, 4)
  FROM clubs
  WHERE is_active = true;
  $$
);
```

**Opzione B: API route + cron esterno**

Crea un endpoint protetto e chiamalo con un servizio cron (es. Vercel Cron, cron-job.org).

---

## 8. Troubleshooting

### Il subdominio mostra 404

- Verifica che il record DNS wildcard `*` sia configurato
- Verifica che il dominio `*.prenotauncampetto.it` sia aggiunto su Vercel
- Controlla che `NEXT_PUBLIC_APP_DOMAIN` sia `app.prenotauncampetto.it` (non `localhost:3000`)

### Errore "Non autenticato" nelle API admin

- Verifica che l'email dell'utente sia nella funzione DB `is_super_admin()` E nella variabile `SUPER_ADMIN_EMAILS`
- Entrambi devono corrispondere (doppio livello di sicurezza)

### Le email non arrivano

- Controlla il **log di Resend** su resend.com → Emails
- Verifica che il dominio sia verificato in Resend (DNS records)
- Controlla la cartella spam del destinatario
- Se `RESEND_API_KEY` è vuoto, le email sono solo loggate in console

### Errore OpenTelemetry / Sentry

Dopo aggiornamenti Sentry, pulisci la cache:

```bash
rm -rf .next
npm run build
```

### Il middleware non riscrive correttamente

- In produzione `NEXT_PUBLIC_APP_DOMAIN` deve essere il dominio completo: `app.prenotauncampetto.it`
- Il middleware estrae lo slug dal subdominio: `[slug].prenotauncampetto.it` → slug = `[slug]`
- Verifica con `console.log` nel middleware se necessario

### Build fallisce su Vercel

```bash
# Verifica in locale che la build passi
npm run lint
npx tsc --noEmit
npm run build
```

Problemi comuni:
- Variabili `NEXT_PUBLIC_*` mancanti → errore a build time
- `SENTRY_ORG` / `SENTRY_PROJECT` mancanti → warning ma non bloccante

---

## Riepilogo Architettura

```
                         ┌─────────────────┐
                         │   Vercel (fra1)  │
                         │   Next.js 14     │
                         └────────┬────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
            ┌───────▼──────┐ ┌───▼────┐ ┌──────▼──────┐
            │  Middleware   │ │  API   │ │   Static    │
            │  (routing)   │ │ Routes │ │   Assets    │
            └───────┬──────┘ └───┬────┘ └─────────────┘
                    │            │
          ┌─────────▼─────────┐  │
          │ app.domain → SA   │  │
          │ *.domain → Club   │  │
          │ domain → Discovery│  │
          └───────────────────┘  │
                                 │
                    ┌────────────▼────────────┐
                    │       Supabase          │
                    │  ┌──────────────────┐   │
                    │  │   PostgreSQL     │   │
                    │  │   + RLS Policies │   │
                    │  └──────────────────┘   │
                    │  ┌──────────────────┐   │
                    │  │   Auth (JWT)     │   │
                    │  └──────────────────┘   │
                    │  ┌──────────────────┐   │
                    │  │   Storage        │   │
                    │  └──────────────────┘   │
                    └─────────────────────────┘
                                 │
                    ┌────────────▼───┐  ┌──────────┐
                    │    Resend      │  │  Sentry  │
                    │  (email)       │  │ (errors) │
                    └────────────────┘  └──────────┘
```

---

## Costi Stimati (mensili)

| Servizio | Piano | Costo |
|----------|-------|-------|
| **Vercel** | Pro (per wildcard) | ~$20/mese |
| **Supabase** | Free (fino a 500MB, 50K MAU) | $0 |
| **Supabase** | Pro (8GB, 100K MAU, backup) | $25/mese |
| **Resend** | Free (100 email/giorno) | $0 |
| **Resend** | Pro (50K email/mese) | $20/mese |
| **Sentry** | Developer (5K errori/mese) | $0 |
| **Dominio** | .it | ~$10/anno |

**Totale iniziale:** ~$20/mese (Vercel Pro + tutto il resto Free)
**Totale in crescita:** ~$65/mese (tutti i servizi Pro)

/**
 * Privacy Policy generale della piattaforma PrenotaUnCampetto.
 * Accessibile su: prenotauncampetto.it/privacy
 * Non dipende da nessun club specifico.
 */
import type { Metadata } from "next"
import Link from "next/link"
import { Shield, Database, Cookie, Eye, Trash2, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy — PrenotaUnCampetto",
  description:
    "Informativa sulla privacy e trattamento dei dati personali della piattaforma PrenotaUnCampetto ai sensi del GDPR.",
}

export default function PrivacyPage() {
  return (
    <main id="main-content" className="min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-bold tracking-tight text-lg">
            PrenotaUnCampetto
          </Link>
          <span className="text-xs text-gray-400">
            Piattaforma per circoli sportivi
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
        {/* ── Intestazione ── */}
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-gray-500 leading-relaxed">
            Informativa sul trattamento dei dati personali ai sensi del
            Regolamento UE 2016/679 (GDPR)
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Ultimo aggiornamento: marzo 2026
          </p>
        </div>

        <div className="space-y-10">
          {/* ── 1. Titolare ── */}
          <Section
            icon={<Shield className="h-5 w-5 text-emerald-700" />}
            title="1. Titolare del trattamento"
          >
            <p>
              Il titolare del trattamento dei dati è <strong>PrenotaUnCampetto</strong> (di
              seguito &quot;la Piattaforma&quot;), che fornisce il servizio di prenotazione
              online per circoli e impianti sportivi.
            </p>
            <p>
              Per qualsiasi richiesta relativa al trattamento dei dati personali,
              è possibile scrivere a:{" "}
              <a
                href="mailto:nicobonoraaa@gmail.com"
                className="font-medium text-emerald-700 hover:underline"
              >
                nicobonoraaa@gmail.com
              </a>
            </p>
          </Section>

          {/* ── 2. Dati raccolti ── */}
          <Section
            icon={<Database className="h-5 w-5 text-emerald-700" />}
            title="2. Dati personali raccolti"
          >
            <p>
              Durante l&apos;utilizzo del servizio di prenotazione, raccogliamo
              i seguenti dati personali:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-gray-600">
              <li>
                <strong className="text-gray-900">Dati identificativi:</strong>{" "}
                nome e cognome forniti al momento della prenotazione
              </li>
              <li>
                <strong className="text-gray-900">Dati di contatto:</strong>{" "}
                indirizzo email e, facoltativamente, numero di telefono
              </li>
              <li>
                <strong className="text-gray-900">Dati di prenotazione:</strong>{" "}
                data, orario, campo scelto e eventuali note aggiuntive
              </li>
              <li>
                <strong className="text-gray-900">Dati tecnici:</strong>{" "}
                indirizzo IP, tipo di browser, sistema operativo e dati di
                navigazione raccolti automaticamente
              </li>
            </ul>
            <p>
              Non raccogliamo dati sensibili, dati relativi a minori o
              categorie particolari di dati personali.
            </p>
          </Section>

          {/* ── 3. Finalità ── */}
          <Section
            icon={<Eye className="h-5 w-5 text-emerald-700" />}
            title="3. Finalità del trattamento"
          >
            <p>I dati personali sono trattati per le seguenti finalità:</p>
            <ul className="ml-4 list-disc space-y-1.5 text-gray-600">
              <li>
                <strong className="text-gray-900">Gestione delle prenotazioni:</strong>{" "}
                elaborazione, conferma, modifica e cancellazione delle
                prenotazioni effettuate tramite la Piattaforma
              </li>
              <li>
                <strong className="text-gray-900">Comunicazioni di servizio:</strong>{" "}
                invio di email di conferma, promemoria e notifiche relative
                alle prenotazioni
              </li>
              <li>
                <strong className="text-gray-900">Gestione del circolo:</strong>{" "}
                permettere all&apos;amministratore del circolo di gestire le
                prenotazioni e i propri campi
              </li>
              <li>
                <strong className="text-gray-900">Miglioramento del servizio:</strong>{" "}
                analisi anonime e aggregate per migliorare la Piattaforma
              </li>
            </ul>
          </Section>

          {/* ── 4. Base giuridica ── */}
          <Section
            icon={<Shield className="h-5 w-5 text-emerald-700" />}
            title="4. Base giuridica"
          >
            <p>Il trattamento dei dati personali si basa su:</p>
            <ul className="ml-4 list-disc space-y-1.5 text-gray-600">
              <li>
                <strong className="text-gray-900">Esecuzione del contratto</strong>{" "}
                — il trattamento è necessario per fornire il servizio di
                prenotazione richiesto dall&apos;utente (art. 6.1.b GDPR)
              </li>
              <li>
                <strong className="text-gray-900">Consenso</strong>{" "}
                — per l&apos;invio di comunicazioni promozionali e l&apos;uso di
                cookie analitici e di marketing (art. 6.1.a GDPR)
              </li>
              <li>
                <strong className="text-gray-900">Interesse legittimo</strong>{" "}
                — per la sicurezza della Piattaforma e la prevenzione di abusi
                (art. 6.1.f GDPR)
              </li>
            </ul>
          </Section>

          {/* ── 5. Cookie ── */}
          <Section
            icon={<Cookie className="h-5 w-5 text-emerald-700" />}
            title="5. Cookie"
          >
            <p>
              La Piattaforma utilizza cookie tecnici necessari per il
              funzionamento del servizio. Cookie analitici e di marketing
              vengono attivati solo previo consenso esplicito dell&apos;utente
              tramite il banner cookie presente sul sito.
            </p>
            <p>
              L&apos;utente può modificare le proprie preferenze in qualsiasi
              momento tramite il link &quot;Gestisci cookie&quot; presente nel
              footer di ogni circolo.
            </p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">
                Tipologie di cookie utilizzati:
              </p>
              <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-gray-600">
                <li>
                  <strong className="text-gray-900">Necessari:</strong>{" "}
                  indispensabili per il funzionamento del sito
                </li>
                <li>
                  <strong className="text-gray-900">Analitici:</strong>{" "}
                  raccolgono dati anonimi sull&apos;utilizzo del sito (previa
                  autorizzazione)
                </li>
                <li>
                  <strong className="text-gray-900">Marketing:</strong>{" "}
                  utilizzati per mostrare contenuti personalizzati (previa
                  autorizzazione)
                </li>
              </ul>
            </div>
          </Section>

          {/* ── 6. Conservazione ── */}
          <Section
            icon={<Database className="h-5 w-5 text-emerald-700" />}
            title="6. Conservazione dei dati"
          >
            <p>
              I dati personali vengono conservati per il tempo strettamente
              necessario alle finalità per cui sono stati raccolti:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-gray-600">
              <li>
                <strong className="text-gray-900">Dati di prenotazione:</strong>{" "}
                conservati per 24 mesi dall&apos;ultima prenotazione
              </li>
              <li>
                <strong className="text-gray-900">Dati account admin:</strong>{" "}
                conservati fino alla cancellazione dell&apos;account
              </li>
              <li>
                <strong className="text-gray-900">Log tecnici:</strong>{" "}
                conservati per un massimo di 12 mesi
              </li>
            </ul>
          </Section>

          {/* ── 7. Diritti dell'utente ── */}
          <Section
            icon={<Trash2 className="h-5 w-5 text-emerald-700" />}
            title="7. Diritti dell'utente"
          >
            <p>In conformità al GDPR, l&apos;utente ha il diritto di:</p>
            <ul className="ml-4 list-disc space-y-1.5 text-gray-600">
              <li>
                <strong className="text-gray-900">Accesso</strong> — ottenere
                conferma del trattamento e accesso ai propri dati
              </li>
              <li>
                <strong className="text-gray-900">Rettifica</strong> —
                richiedere la correzione di dati inesatti o incompleti
              </li>
              <li>
                <strong className="text-gray-900">Cancellazione</strong> —
                richiedere la cancellazione dei propri dati personali
              </li>
              <li>
                <strong className="text-gray-900">Limitazione</strong> —
                richiedere la limitazione del trattamento
              </li>
              <li>
                <strong className="text-gray-900">Portabilità</strong> —
                ricevere i propri dati in formato strutturato e leggibile
              </li>
              <li>
                <strong className="text-gray-900">Opposizione</strong> —
                opporsi al trattamento per motivi legittimi
              </li>
            </ul>
            <p>
              Per esercitare i propri diritti, scrivere a:{" "}
              <a
                href="mailto:nicobonoraaa@gmail.com"
                className="font-medium text-emerald-700 hover:underline"
              >
                nicobonoraaa@gmail.com
              </a>
            </p>
            <p>
              L&apos;utente ha inoltre il diritto di proporre reclamo
              all&apos;Autorità Garante per la protezione dei dati personali
              (
              <a
                href="https://www.garanteprivacy.it"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-700 hover:underline"
              >
                www.garanteprivacy.it
              </a>
              ).
            </p>
          </Section>

          {/* ── 8. Condivisione ── */}
          <Section
            icon={<Eye className="h-5 w-5 text-emerald-700" />}
            title="8. Condivisione dei dati"
          >
            <p>I dati personali possono essere condivisi con:</p>
            <ul className="ml-4 list-disc space-y-1.5 text-gray-600">
              <li>
                <strong className="text-gray-900">
                  I circoli sportivi presenti sulla Piattaforma:
                </strong>{" "}
                per la gestione delle prenotazioni e il contatto con il
                prenotante
              </li>
              <li>
                <strong className="text-gray-900">Fornitori di servizi:</strong>{" "}
                hosting (Vercel), database (Supabase) e invio email (Resend),
                tutti conformi al GDPR e con server nell&apos;Unione Europea o
                con garanzie adeguate
              </li>
            </ul>
            <p>
              I dati non vengono mai venduti a terzi né utilizzati per finalità
              diverse da quelle indicate in questa informativa.
            </p>
          </Section>

          {/* ── 9. Sicurezza ── */}
          <Section
            icon={<Shield className="h-5 w-5 text-emerald-700" />}
            title="9. Sicurezza"
          >
            <p>
              La Piattaforma adotta misure tecniche e organizzative adeguate
              per proteggere i dati personali, tra cui:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-gray-600">
              <li>Crittografia SSL/TLS per tutte le comunicazioni</li>
              <li>Accesso ai dati limitato al personale autorizzato</li>
              <li>Backup regolari e procedure di disaster recovery</li>
              <li>Autenticazione sicura per l&apos;accesso al pannello admin</li>
            </ul>
          </Section>

          {/* ── 10. Contatti ── */}
          <Section
            icon={<Mail className="h-5 w-5 text-emerald-700" />}
            title="10. Contatti"
          >
            <p>
              Per qualsiasi domanda relativa a questa informativa o al
              trattamento dei dati personali:
            </p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 space-y-2">
              <p className="text-sm">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:nicobonoraaa@gmail.com"
                  className="text-emerald-700 hover:underline"
                >
                  nicobonoraaa@gmail.com
                </a>
              </p>
              <p className="text-sm">
                <strong>Sito:</strong>{" "}
                <a
                  href="https://prenotauncampetto.it"
                  className="text-emerald-700 hover:underline"
                >
                  prenotauncampetto.it
                </a>
              </p>
            </div>
          </Section>
        </div>

        {/* ── Footer minimo ── */}
        <div className="mt-14 border-t pt-6 text-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} PrenotaUnCampetto. Tutti i diritti riservati.</p>
        </div>
      </div>
    </main>
  )
}

/* ── Componente sezione ── */
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-gray-600 pl-12">
        {children}
      </div>
    </section>
  )
}

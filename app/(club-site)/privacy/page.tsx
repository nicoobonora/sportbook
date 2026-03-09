/**
 * Pagina Privacy Policy e Termini di Servizio.
 * Questa è la privacy policy della piattaforma PrenotaUnCampetto,
 * valida per tutti i circoli ospitati sulla piattaforma.
 */
import type { Metadata } from "next"
import { getClubFromHeaders } from "@/lib/hooks/use-club"
import { Shield, Database, Cookie, Eye, Trash2, Mail } from "lucide-react"

export async function generateMetadata(): Promise<Metadata> {
  const club = await getClubFromHeaders()
  if (!club) return { title: "Privacy Policy — PrenotaUnCampetto" }
  return {
    title: `Privacy Policy — ${club.name}`,
    description: `Informativa sulla privacy e trattamento dei dati personali di ${club.name} su PrenotaUnCampetto.`,
  }
}

export default async function PrivacyPage() {
  const club = await getClubFromHeaders()
  if (!club) return null

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="container-sportbook py-8 sm:py-12">
        {/* ── Intestazione ── */}
        <div className="mb-10">
          <h1 className="font-display text-display-lg uppercase tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-muted-foreground">
            Informativa sul trattamento dei dati personali ai sensi del
            Regolamento UE 2016/679 (GDPR)
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ultimo aggiornamento: marzo 2026
          </p>
        </div>

        <div className="max-w-3xl space-y-10">
          {/* ── 1. Titolare del trattamento ── */}
          <Section
            icon={<Shield className="h-5 w-5 text-primary" />}
            title="1. Titolare del trattamento"
          >
            <p>
              Il titolare del trattamento dei dati è <strong>PrenotaUnCampetto</strong> (di
              seguito &quot;la Piattaforma&quot;), che fornisce il servizio di prenotazione online
              per il circolo sportivo <strong>{club.name}</strong>.
            </p>
            <p>
              Per qualsiasi richiesta relativa al trattamento dei dati personali,
              è possibile scrivere a:{" "}
              <a
                href="mailto:privacy@prenotauncampetto.it"
                className="font-medium text-primary hover:underline"
              >
                privacy@prenotauncampetto.it
              </a>
            </p>
          </Section>

          {/* ── 2. Dati raccolti ── */}
          <Section
            icon={<Database className="h-5 w-5 text-primary" />}
            title="2. Dati personali raccolti"
          >
            <p>
              Durante l&apos;utilizzo del servizio di prenotazione, raccogliamo
              i seguenti dati personali:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Dati identificativi:</strong>{" "}
                nome e cognome forniti al momento della prenotazione
              </li>
              <li>
                <strong className="text-foreground">Dati di contatto:</strong>{" "}
                indirizzo email e, facoltativamente, numero di telefono
              </li>
              <li>
                <strong className="text-foreground">Dati di prenotazione:</strong>{" "}
                data, orario, campo scelto e eventuali note aggiuntive
              </li>
              <li>
                <strong className="text-foreground">Dati tecnici:</strong>{" "}
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
            icon={<Eye className="h-5 w-5 text-primary" />}
            title="3. Finalità del trattamento"
          >
            <p>
              I dati personali sono trattati per le seguenti finalità:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Gestione delle prenotazioni:</strong>{" "}
                elaborazione, conferma, modifica e cancellazione delle
                prenotazioni effettuate tramite la Piattaforma
              </li>
              <li>
                <strong className="text-foreground">Comunicazioni di servizio:</strong>{" "}
                invio di email di conferma, promemoria e notifiche relative
                alle prenotazioni
              </li>
              <li>
                <strong className="text-foreground">Gestione del circolo:</strong>{" "}
                permettere all&apos;amministratore del circolo di gestire le
                prenotazioni e i propri campi
              </li>
              <li>
                <strong className="text-foreground">Miglioramento del servizio:</strong>{" "}
                analisi anonime e aggregate per migliorare la Piattaforma
              </li>
            </ul>
          </Section>

          {/* ── 4. Base giuridica ── */}
          <Section
            icon={<Shield className="h-5 w-5 text-primary" />}
            title="4. Base giuridica"
          >
            <p>
              Il trattamento dei dati personali si basa su:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Esecuzione del contratto:</strong>{" "}
                il trattamento è necessario per fornire il servizio di
                prenotazione richiesto dall&apos;utente (art. 6.1.b GDPR)
              </li>
              <li>
                <strong className="text-foreground">Consenso:</strong>{" "}
                per l&apos;invio di comunicazioni promozionali e l&apos;uso di
                cookie analitici e di marketing (art. 6.1.a GDPR)
              </li>
              <li>
                <strong className="text-foreground">Interesse legittimo:</strong>{" "}
                per la sicurezza della Piattaforma e la prevenzione di abusi
                (art. 6.1.f GDPR)
              </li>
            </ul>
          </Section>

          {/* ── 5. Cookie ── */}
          <Section
            icon={<Cookie className="h-5 w-5 text-primary" />}
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
              footer del sito.
            </p>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Tipologie di cookie utilizzati:</p>
              <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                <li><strong className="text-foreground">Necessari:</strong> indispensabili per il funzionamento del sito</li>
                <li><strong className="text-foreground">Analitici:</strong> raccolgono dati anonimi sull&apos;utilizzo del sito (previa autorizzazione)</li>
                <li><strong className="text-foreground">Marketing:</strong> utilizzati per mostrare contenuti personalizzati (previa autorizzazione)</li>
              </ul>
            </div>
          </Section>

          {/* ── 6. Conservazione ── */}
          <Section
            icon={<Database className="h-5 w-5 text-primary" />}
            title="6. Conservazione dei dati"
          >
            <p>
              I dati personali vengono conservati per il tempo strettamente
              necessario al raggiungimento delle finalità per cui sono stati
              raccolti:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Dati di prenotazione:</strong>{" "}
                conservati per 24 mesi dall&apos;ultima prenotazione effettuata
              </li>
              <li>
                <strong className="text-foreground">Dati dell&apos;account admin:</strong>{" "}
                conservati fino alla cancellazione dell&apos;account
              </li>
              <li>
                <strong className="text-foreground">Log tecnici:</strong>{" "}
                conservati per un massimo di 12 mesi
              </li>
            </ul>
          </Section>

          {/* ── 7. Diritti dell'utente ── */}
          <Section
            icon={<Trash2 className="h-5 w-5 text-primary" />}
            title="7. Diritti dell'utente"
          >
            <p>
              In conformità al GDPR, l&apos;utente ha il diritto di:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li><strong className="text-foreground">Accesso:</strong> ottenere conferma del trattamento e accesso ai propri dati</li>
              <li><strong className="text-foreground">Rettifica:</strong> richiedere la correzione di dati inesatti o incompleti</li>
              <li><strong className="text-foreground">Cancellazione:</strong> richiedere la cancellazione dei propri dati personali</li>
              <li><strong className="text-foreground">Limitazione:</strong> richiedere la limitazione del trattamento</li>
              <li><strong className="text-foreground">Portabilità:</strong> ricevere i propri dati in formato strutturato e leggibile</li>
              <li><strong className="text-foreground">Opposizione:</strong> opporsi al trattamento per motivi legittimi</li>
            </ul>
            <p>
              Per esercitare i propri diritti, scrivere a:{" "}
              <a
                href="mailto:privacy@prenotauncampetto.it"
                className="font-medium text-primary hover:underline"
              >
                privacy@prenotauncampetto.it
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
                className="font-medium text-primary hover:underline"
              >
                www.garanteprivacy.it
              </a>
              ).
            </p>
          </Section>

          {/* ── 8. Condivisione ── */}
          <Section
            icon={<Eye className="h-5 w-5 text-primary" />}
            title="8. Condivisione dei dati"
          >
            <p>
              I dati personali possono essere condivisi con:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Il circolo sportivo ({club.name}):</strong>{" "}
                per la gestione delle prenotazioni e il contatto con il
                prenotante
              </li>
              <li>
                <strong className="text-foreground">Fornitori di servizi:</strong>{" "}
                servizi di hosting (Vercel), database (Supabase) e invio email
                (Resend), tutti conformi al GDPR e con server nell&apos;Unione Europea
                o con garanzie adeguate
              </li>
            </ul>
            <p>
              I dati non vengono mai venduti a terzi né utilizzati per finalità
              diverse da quelle indicate in questa informativa.
            </p>
          </Section>

          {/* ── 9. Sicurezza ── */}
          <Section
            icon={<Shield className="h-5 w-5 text-primary" />}
            title="9. Sicurezza"
          >
            <p>
              La Piattaforma adotta misure tecniche e organizzative adeguate
              per proteggere i dati personali, tra cui:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li>Crittografia SSL/TLS per tutte le comunicazioni</li>
              <li>Accesso ai dati limitato al personale autorizzato</li>
              <li>Backup regolari e procedure di disaster recovery</li>
              <li>Autenticazione sicura per l&apos;accesso al pannello admin</li>
            </ul>
          </Section>

          {/* ── 10. Contatti ── */}
          <Section
            icon={<Mail className="h-5 w-5 text-primary" />}
            title="10. Contatti"
          >
            <p>
              Per qualsiasi domanda relativa a questa informativa o al
              trattamento dei dati personali:
            </p>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <p className="text-sm">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:privacy@prenotauncampetto.it"
                  className="text-primary hover:underline"
                >
                  privacy@prenotauncampetto.it
                </a>
              </p>
              <p className="text-sm">
                <strong>Piattaforma:</strong>{" "}
                <a
                  href="https://prenotauncampetto.it"
                  className="text-primary hover:underline"
                >
                  prenotauncampetto.it
                </a>
              </p>
            </div>
          </Section>
        </div>
      </div>
    </main>
  )
}

/* ── Componente sezione riutilizzabile ── */
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          {title}
        </h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground pl-12">
        {children}
      </div>
    </section>
  )
}

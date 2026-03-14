/**
 * Guida interattiva per l'admin di un circolo.
 * Spiega passo-passo come usare il pannello admin.
 * Inclusa nella pagina /per-circoli.
 */
"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  Megaphone,
  Settings,
  LogIn,
  ChevronDown,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Info,
  Download,
} from "lucide-react"

/* ─── Types ─────────────────────────────────────────────────── */

type SectionId = "login" | "dashboard" | "bookings" | "slots" | "announcements" | "settings"

interface GuideSection {
  id: SectionId
  title: string
  subtitle: string
  icon: React.ElementType
  color: string
  bgLight: string
}

/* ─── Section definitions ───────────────────────────────────── */

const SECTIONS: GuideSection[] = [
  { id: "login", title: "Accesso", subtitle: "Come entrare nel pannello", icon: LogIn, color: "text-blue-600", bgLight: "bg-blue-50" },
  { id: "dashboard", title: "Dashboard", subtitle: "Panoramica del circolo", icon: LayoutDashboard, color: "text-green-600", bgLight: "bg-green-50" },
  { id: "bookings", title: "Prenotazioni", subtitle: "Calendario e gestione", icon: CalendarCheck, color: "text-amber-600", bgLight: "bg-amber-50" },
  { id: "slots", title: "Slot & Orari", subtitle: "Orari, template e blocchi", icon: Clock, color: "text-pink-600", bgLight: "bg-pink-50" },
  { id: "announcements", title: "Annunci", subtitle: "Comunica con i giocatori", icon: Megaphone, color: "text-violet-600", bgLight: "bg-violet-50" },
  { id: "settings", title: "Impostazioni", subtitle: "Info, campi e branding", icon: Settings, color: "text-cyan-600", bgLight: "bg-cyan-50" },
]

/* ─── Reusable sub-components ───────────────────────────────── */

function Badge({ variant, children }: { variant: "green" | "amber" | "red" | "gray" | "blue" | "violet"; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-600",
    blue: "bg-blue-100 text-blue-800",
    violet: "bg-violet-100 text-violet-800",
  }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[variant]}`}>
      {children}
    </span>
  )
}

function TipBox({ variant, children }: { variant: "info" | "warning" | "success"; children: React.ReactNode }) {
  const styles: Record<string, { bg: string; border: string; icon: React.ElementType; iconColor: string }> = {
    info: { bg: "bg-blue-50", border: "border-blue-200", icon: Info, iconColor: "text-blue-500" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", icon: AlertCircle, iconColor: "text-amber-500" },
    success: { bg: "bg-green-50", border: "border-green-200", icon: CheckCircle2, iconColor: "text-green-500" },
  }
  const s = styles[variant]
  const Icon = s.icon
  return (
    <div className={`mt-4 flex gap-3 rounded-xl border ${s.border} ${s.bg} p-4`}>
      <Icon className={`h-5 w-5 shrink-0 ${s.iconColor} mt-0.5`} />
      <div className="text-sm leading-relaxed text-gray-700">{children}</div>
    </div>
  )
}

/* ─── Section content components ────────────────────────────── */

function LoginSection() {
  return (
    <div className="space-y-6">
      {/* Step 1 */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-600">
          Passo 1
        </div>
        <h4 className="text-base font-semibold text-gray-900">Raggiungi la pagina di login</h4>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Vai all&apos;indirizzo del tuo circolo e aggiungi <strong>/admin/login</strong> alla fine dell&apos;URL, oppure usa la pagina di accesso unificata.
        </p>
        <div className="mt-3 rounded-lg bg-gray-50 p-3 font-mono text-sm text-blue-600 break-all">
          https://nomecircolo.prenotauncampetto.it/admin/login
        </div>
        <p className="mt-2 text-sm text-gray-500">
          In alternativa, puoi accedere da <strong>prenotauncampetto.it/admin-login</strong> e verrai reindirizzato al pannello del tuo circolo.
        </p>
      </div>

      {/* Step 2 */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-600">
          Passo 2
        </div>
        <h4 className="text-base font-semibold text-gray-900">Inserisci email e password</h4>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Digita l&apos;indirizzo email e la password associati al tuo account admin.
          Le credenziali ti sono state fornite quando il tuo circolo è stato registrato sulla piattaforma.
        </p>
        {/* Mock login form */}
        <div className="mt-4 mx-auto max-w-xs rounded-xl border bg-gray-50 p-5">
          <div className="text-center text-sm font-semibold text-gray-900 mb-4">Accesso Admin</div>
          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-medium text-gray-500 mb-1">Email</div>
              <div className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-400">admin@mio-circolo.it</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-gray-500 mb-1">Password</div>
              <div className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-400">••••••••••</div>
            </div>
            <div className="rounded-lg bg-blue-600 py-2.5 text-center text-sm font-semibold text-white">
              Accedi
            </div>
          </div>
        </div>
        <TipBox variant="info">
          La password ti è stata comunicata via email al momento della registrazione.
          Se l&apos;hai dimenticata, contatta il supporto per riceverne una nuova.
        </TipBox>
      </div>

      {/* Step 3 — iPhone app */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-600">
          <Smartphone className="h-3 w-3" />
          Per iPhone
        </div>
        <h4 className="text-base font-semibold text-gray-900">Scarica l&apos;app su iPhone</h4>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Se hai un iPhone, puoi anche scaricare l&apos;app <strong>PrenotaUnCampetto</strong> dall&apos;App Store
          invece di accedere dal browser. L&apos;app ti offre un&apos;esperienza ottimizzata per il telefono
          e l&apos;accesso rapido al tuo pannello admin.
        </p>
        {/* App Store mock badge */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-3 text-white max-w-[220px]">
          <Download className="h-6 w-6 shrink-0" />
          <div>
            <div className="text-[10px] leading-tight text-gray-400">Scarica su</div>
            <div className="text-sm font-semibold leading-tight">App Store</div>
          </div>
        </div>
        <TipBox variant="success">
          L&apos;app per iPhone è la scelta ideale se gestisci il circolo prevalentemente dal telefono.
          Per chi usa Android o un computer, il pannello web funziona perfettamente dal browser.
        </TipBox>
      </div>
    </div>
  )
}

function DashboardSection() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-green-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-green-600">
          Panoramica
        </div>
        <h4 className="text-base font-semibold text-gray-900">I tuoi numeri chiave</h4>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Appena accedi, trovi 4 schede riassuntive in cima alla pagina con le metriche principali del tuo circolo.
        </p>

        {/* KPI mock */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { value: "3", label: "In attesa", color: "text-amber-600", bg: "bg-amber-50" },
            { value: "12", label: "Confermate oggi", color: "text-green-600", bg: "bg-green-50" },
            { value: "87", label: "Questo mese", color: "text-blue-600", bg: "bg-blue-50" },
            { value: "2", label: "Annunci attivi", color: "text-violet-600", bg: "bg-violet-50" },
          ].map((kpi) => (
            <div key={kpi.label} className={`rounded-xl border p-3 text-center ${kpi.bg}`}>
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{kpi.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-green-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-green-600">
          Prenotazioni recenti
        </div>
        <h4 className="text-base font-semibold text-gray-900">Sempre aggiornato</h4>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Sotto i KPI trovi la lista delle prenotazioni più recenti con lo stato di ciascuna.
          Puoi cliccare su qualsiasi prenotazione per gestirla.
        </p>

        {/* Bookings list mock */}
        <div className="mt-4 space-y-2">
          {[
            { name: "Marco R.", field: "Campo Padel 1", badge: "amber" as const, status: "In attesa" },
            { name: "Laura B.", field: "Campo Tennis 2", badge: "green" as const, status: "Confermata" },
            { name: "Paolo G.", field: "Calcetto A", badge: "green" as const, status: "Confermata" },
          ].map((b) => (
            <div key={b.name} className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2.5 text-sm">
              <div><span className="font-semibold">{b.name}</span> <span className="text-gray-400">—</span> <span className="text-gray-500">{b.field}</span></div>
              <Badge variant={b.badge}>{b.status}</Badge>
            </div>
          ))}
        </div>

        <TipBox variant="success">
          I numeri della dashboard si aggiornano in tempo reale. Controlla regolarmente le prenotazioni in attesa per non far aspettare i tuoi clienti.
        </TipBox>
      </div>
    </div>
  )
}

function BookingsSection() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600">
          Calendario
        </div>
        <h4 className="text-base font-semibold text-gray-900">Vista settimanale</h4>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          La pagina Prenotazioni mostra un calendario settimanale. Ogni prenotazione appare come un blocco colorato nell&apos;orario corrispondente. Puoi navigare tra le settimane e filtrare per campo.
        </p>

        {/* Calendar mock */}
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[500px] rounded-xl border bg-gray-50 overflow-hidden">
            <div className="flex items-center justify-between border-b bg-white px-4 py-2.5">
              <button className="rounded-md border px-3 py-1 text-xs font-medium text-gray-600">&#8592; Prec.</button>
              <span className="text-sm font-semibold">10 – 16 Marzo 2026</span>
              <button className="rounded-md border px-3 py-1 text-xs font-medium text-gray-600">Succ. &#8594;</button>
            </div>
            <div className="grid grid-cols-[50px_repeat(7,1fr)] text-[11px]">
              {/* Header */}
              <div className="border-b border-r bg-gray-100 p-2" />
              {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
                <div key={d} className="border-b bg-gray-100 p-2 text-center font-semibold text-gray-600">{d}</div>
              ))}
              {/* Row 9:00 */}
              <div className="border-r p-2 text-center text-gray-400 bg-white">09:00</div>
              <div className="border-r p-1 bg-white"><div className="rounded bg-green-100 px-1 py-0.5 text-green-800 text-[10px] font-medium">Marco R.</div></div>
              <div className="border-r p-1 bg-white" />
              <div className="border-r p-1 bg-white"><div className="rounded bg-amber-100 px-1 py-0.5 text-amber-800 text-[10px] font-medium">Sara M.</div></div>
              <div className="border-r p-1 bg-white" />
              <div className="border-r p-1 bg-white"><div className="rounded bg-green-100 px-1 py-0.5 text-green-800 text-[10px] font-medium">Luca P.</div></div>
              <div className="border-r p-1 bg-white"><div className="rounded bg-green-100 px-1 py-0.5 text-green-800 text-[10px] font-medium">Team A</div></div>
              <div className="p-1 bg-white" />
              {/* Row 10:00 */}
              <div className="border-r border-t p-2 text-center text-gray-400 bg-white">10:00</div>
              <div className="border-r border-t p-1 bg-white" />
              <div className="border-r border-t p-1 bg-white"><div className="rounded bg-green-100 px-1 py-0.5 text-green-800 text-[10px] font-medium">Anna F.</div></div>
              <div className="border-r border-t p-1 bg-white" />
              <div className="border-r border-t p-1 bg-white"><div className="rounded bg-red-100 px-1 py-0.5 text-red-800 text-[10px] font-medium">Paolo V.</div></div>
              <div className="border-r border-t p-1 bg-white" />
              <div className="border-r border-t p-1 bg-white" />
              <div className="border-t p-1 bg-white"><div className="rounded bg-amber-100 px-1 py-0.5 text-amber-800 text-[10px] font-medium">Giulia B.</div></div>
              {/* Row 11:00 */}
              <div className="border-r border-t p-2 text-center text-gray-400 bg-white">11:00</div>
              <div className="border-r border-t p-1 bg-white"><div className="rounded bg-amber-100 px-1 py-0.5 text-amber-800 text-[10px] font-medium">Diego L.</div></div>
              <div className="border-r border-t p-1 bg-white" />
              <div className="border-r border-t p-1 bg-white"><div className="rounded bg-green-100 px-1 py-0.5 text-green-800 text-[10px] font-medium">Elena S.</div></div>
              <div className="border-r border-t p-1 bg-white" />
              <div className="border-r border-t p-1 bg-white"><div className="rounded bg-green-100 px-1 py-0.5 text-green-800 text-[10px] font-medium">Mario T.</div></div>
              <div className="border-r border-t p-1 bg-white"><div className="rounded bg-green-100 px-1 py-0.5 text-green-800 text-[10px] font-medium">Club Jr.</div></div>
              <div className="border-t p-1 bg-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600">
          Stati
        </div>
        <h4 className="text-base font-semibold text-gray-900">Significato dei colori</h4>
        <div className="mt-3 space-y-2">
          {[
            { badge: "green" as const, label: "Confermata", desc: "La prenotazione è stata approvata" },
            { badge: "amber" as const, label: "In attesa", desc: "Attende la tua conferma" },
            { badge: "red" as const, label: "Rifiutata", desc: "La prenotazione è stata declinata" },
            { badge: "gray" as const, label: "Cancellata", desc: "L'utente ha annullato" },
          ].map((s) => (
            <div key={s.label} className="flex items-start gap-3 text-sm">
              <Badge variant={s.badge}>{s.label}</Badge>
              <span className="text-gray-600">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600">
          Azioni
        </div>
        <h4 className="text-base font-semibold text-gray-900">Cosa puoi fare</h4>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span className="text-blue-500 font-bold">&#8594;</span><span><strong>Confermare o rifiutare</strong> una prenotazione in attesa cliccandoci sopra</span></li>
          <li className="flex gap-2"><span className="text-blue-500 font-bold">&#8594;</span><span><strong>Filtrare per campo/sport</strong> usando il selettore in alto</span></li>
          <li className="flex gap-2"><span className="text-blue-500 font-bold">&#8594;</span><span><strong>Navigare tra le settimane</strong> con i pulsanti freccia</span></li>
          <li className="flex gap-2"><span className="text-blue-500 font-bold">&#8594;</span><span><strong>Aggiungere una prenotazione manuale</strong> per prenotazioni telefoniche</span></li>
          <li className="flex gap-2"><span className="text-blue-500 font-bold">&#8594;</span><span><strong>Modificare o eliminare</strong> prenotazioni esistenti</span></li>
        </ul>
        <TipBox variant="warning">
          Le prenotazioni <strong>in attesa</strong> richiedono una tua azione. Controllale regolarmente per non far aspettare i tuoi clienti!
        </TipBox>
      </div>
    </div>
  )
}

function SlotsSection() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-pink-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-pink-600">
          Orari
        </div>
        <h4 className="text-base font-semibold text-gray-900">Orari di Apertura</h4>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Imposta per ogni giorno della settimana l&apos;orario in cui il circolo accetta prenotazioni.
          Puoi impostare orari diversi per ogni giorno o disattivare un giorno intero.
        </p>
        <div className="mt-4 space-y-1.5">
          {[
            { day: "Lunedì", hours: "09:00 — 22:00", active: true },
            { day: "Martedì", hours: "09:00 — 22:00", active: true },
            { day: "Sabato", hours: "08:00 — 20:00", active: true },
            { day: "Domenica", hours: "—", active: false },
          ].map((d) => (
            <div key={d.day} className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-2.5 text-sm">
              <span className="font-semibold w-24">{d.day}</span>
              <span className={d.active ? "text-green-600" : "text-gray-400"}>{d.hours}</span>
              <Badge variant={d.active ? "green" : "gray"}>{d.active ? "Attivo" : "Chiuso"}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-pink-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-pink-600">
          Template
        </div>
        <h4 className="text-base font-semibold text-gray-900">Template degli Slot</h4>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          I template definiscono gli intervalli di tempo prenotabili per ogni campo (es. slot da 1 ora: 9-10, 10-11...).
          Sono associati a un campo specifico e a un giorno della settimana.
        </p>
        {/* Slot grid mock */}
        <div className="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
          {[
            { time: "09-10", type: "available" },
            { time: "10-11", type: "available" },
            { time: "11-12", type: "booked" },
            { time: "14-15", type: "available" },
            { time: "15-16", type: "available" },
            { time: "16-17", type: "blocked" },
            { time: "17-18", type: "available" },
            { time: "18-19", type: "booked" },
          ].map((s) => {
            const colors: Record<string, string> = {
              available: "bg-green-50 text-green-700 border-green-200",
              booked: "bg-blue-50 text-blue-700 border-blue-200",
              blocked: "bg-red-50 text-red-700 border-red-200",
            }
            return (
              <div key={s.time} className={`rounded-lg border p-2 text-center text-[11px] font-medium ${colors[s.type]}`}>
                {s.time}
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-green-200" /> Disponibile</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-blue-200" /> Prenotato</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-red-200" /> Bloccato</span>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-pink-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-pink-600">
          Blocchi
        </div>
        <h4 className="text-base font-semibold text-gray-900">Blocchi di Indisponibilità</h4>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Puoi bloccare specifici slot per manutenzione, eventi privati o chiusure straordinarie.
          Lo slot bloccato non sarà prenotabile dagli utenti.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span className="text-pink-500 font-bold">&#8594;</span><span><strong>Crea un blocco</strong> selezionando campo, data e fascia oraria</span></li>
          <li className="flex gap-2"><span className="text-pink-500 font-bold">&#8594;</span><span><strong>Aggiungi un motivo</strong> opzionale (es. &quot;Manutenzione terreno&quot;)</span></li>
          <li className="flex gap-2"><span className="text-pink-500 font-bold">&#8594;</span><span><strong>Elimina il blocco</strong> quando lo slot torna disponibile</span></li>
        </ul>
        <TipBox variant="info">
          I blocchi sono utili anche per riservare slot a eventi interni del circolo senza che vengano prenotati online.
        </TipBox>
      </div>
    </div>
  )
}

function AnnouncementsSection() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-violet-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-600">
          Lista
        </div>
        <h4 className="text-base font-semibold text-gray-900">I tuoi annunci</h4>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Nella sezione Annunci trovi la lista di tutti gli annunci creati con azioni rapide per ciascuno.
        </p>

        {/* Announcements mock */}
        <div className="mt-4 space-y-2">
          {[
            { title: "Torneo di Padel Primavera 2026", meta: "Pubblicato il 10 Mar 2026 · Fissato in alto", pinned: true },
            { title: "Nuovi orari estivi dal 1° Aprile", meta: "Pubblicato il 8 Mar 2026", pinned: false },
            { title: "Manutenzione Campo Tennis 2", meta: "Bozza · Non pubblicato", pinned: false },
          ].map((a) => (
            <div key={a.title} className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {a.pinned && <span className="mr-1" title="Fissato in alto">&#128204;</span>}
                  {a.title}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">{a.meta}</div>
              </div>
              <div className="flex gap-1.5 shrink-0 ml-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border bg-white text-[11px]" title="Modifica">&#9998;</div>
                <div className="flex h-7 w-7 items-center justify-center rounded-md border bg-white text-[11px]" title="Elimina">&#128465;</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-violet-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-600">
          Funzioni
        </div>
        <h4 className="text-base font-semibold text-gray-900">Cosa puoi fare con gli annunci</h4>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span className="text-violet-500 font-bold">&#8594;</span><span><strong>Creare un annuncio</strong> con titolo e contenuto, visibile sulla pagina pubblica</span></li>
          <li className="flex gap-2"><span className="text-violet-500 font-bold">&#8594;</span><span><strong>Fissare in alto</strong> gli annunci importanti</span></li>
          <li className="flex gap-2"><span className="text-violet-500 font-bold">&#8594;</span><span><strong>Pubblicare/nascondere</strong> un annuncio senza eliminarlo</span></li>
          <li className="flex gap-2"><span className="text-violet-500 font-bold">&#8594;</span><span><strong>Modificare</strong> il contenuto in qualsiasi momento</span></li>
          <li className="flex gap-2"><span className="text-violet-500 font-bold">&#8594;</span><span><strong>Eliminare</strong> annunci non più necessari</span></li>
        </ul>
        <TipBox variant="success">
          Usa gli annunci per comunicare tornei, cambiamenti di orario, chiusure straordinarie o promozioni speciali!
        </TipBox>
      </div>
    </div>
  )
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-cyan-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-600">
          Tab 1
        </div>
        <h4 className="text-base font-semibold text-gray-900">Info Circolo</h4>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Nella prima scheda puoi modificare tutte le informazioni pubbliche del tuo circolo:
        </p>

        {/* Settings mock form */}
        <div className="mt-4 rounded-xl border bg-gray-50 p-4">
          <div className="flex border-b mb-4">
            <div className="px-3 pb-2 text-xs font-semibold text-blue-600 border-b-2 border-blue-600">Info Circolo</div>
            <div className="px-3 pb-2 text-xs font-medium text-gray-400">Strutture</div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-medium text-gray-500 mb-1">Nome Circolo</div>
              <div className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-500">Circolo Sportivo Bellavista</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] font-medium text-gray-500 mb-1">Telefono</div>
                <div className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-500">+39 02 1234567</div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-gray-500 mb-1">Email</div>
                <div className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-500">info@bellavista.it</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] font-medium text-gray-500 mb-1">Colore Primario</div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-blue-600 border" />
                  <div className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-400 flex-1">#2563eb</div>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-gray-500 mb-1">Colore Accento</div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-amber-500 border" />
                  <div className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-400 flex-1">#f59e0b</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span className="text-cyan-500 font-bold">&#8594;</span><span><strong>Nome e tagline</strong> — mostrati in cima al sito pubblico</span></li>
          <li className="flex gap-2"><span className="text-cyan-500 font-bold">&#8594;</span><span><strong>Descrizione</strong> — testo e immagine &quot;Chi Siamo&quot;</span></li>
          <li className="flex gap-2"><span className="text-cyan-500 font-bold">&#8594;</span><span><strong>Contatti</strong> — telefono, email, WhatsApp</span></li>
          <li className="flex gap-2"><span className="text-cyan-500 font-bold">&#8594;</span><span><strong>Social</strong> — link a Instagram e Facebook</span></li>
          <li className="flex gap-2"><span className="text-cyan-500 font-bold">&#8594;</span><span><strong>Indirizzo</strong> — con posizione automatica sulla mappa</span></li>
          <li className="flex gap-2"><span className="text-cyan-500 font-bold">&#8594;</span><span><strong>Colori</strong> — personalizza il look del tuo sito</span></li>
        </ul>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-cyan-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-600">
          Tab 2
        </div>
        <h4 className="text-base font-semibold text-gray-900">Strutture (Campi)</h4>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Nella seconda scheda gestisci i campi sportivi del tuo circolo:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span className="text-cyan-500 font-bold">&#8594;</span><span><strong>Aggiungi un campo</strong> specificando nome, tipo di sport e stato</span></li>
          <li className="flex gap-2"><span className="text-cyan-500 font-bold">&#8594;</span><span><strong>Modifica</strong> le informazioni di un campo esistente</span></li>
          <li className="flex gap-2"><span className="text-cyan-500 font-bold">&#8594;</span><span><strong>Disattiva</strong> temporaneamente senza eliminarlo</span></li>
          <li className="flex gap-2"><span className="text-cyan-500 font-bold">&#8594;</span><span><strong>Riordina</strong> i campi per l&apos;ordine di visualizzazione</span></li>
          <li className="flex gap-2"><span className="text-cyan-500 font-bold">&#8594;</span><span><strong>Elimina</strong> un campo non più utilizzato</span></li>
        </ul>
        <TipBox variant="warning">
          Eliminare un campo rimuoverà anche tutte le prenotazioni e gli slot associati. Usa la disattivazione se il campo è solo temporaneamente indisponibile.
        </TipBox>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-cyan-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-600">
          <Monitor className="h-3 w-3" />
          Navigazione
        </div>
        <h4 className="text-base font-semibold text-gray-900">La Sidebar</h4>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          La barra laterale a sinistra ti permette di navigare tra tutte le sezioni del pannello:
          Dashboard, Prenotazioni, Slot & Orari, Annunci, Impostazioni. In basso trovi anche i link
          per tornare al sito pubblico del circolo e per uscire dal pannello.
        </p>
        <TipBox variant="info">
          Su <strong>mobile</strong>, la sidebar è nascosta. Tocca l&apos;icona menu (<strong>&#9776;</strong>) in alto a sinistra per aprirla. Si chiude automaticamente quando selezioni una voce.
        </TipBox>
      </div>
    </div>
  )
}

/* ─── Section content map ───────────────────────────────────── */

const SECTION_CONTENT: Record<SectionId, React.FC> = {
  login: LoginSection,
  dashboard: DashboardSection,
  bookings: BookingsSection,
  slots: SlotsSection,
  announcements: AnnouncementsSection,
  settings: SettingsSection,
}

/* ─── Main Component ────────────────────────────────────────── */

export function AdminGuide() {
  const [openSection, setOpenSection] = useState<SectionId | null>(null)

  function toggleSection(id: SectionId) {
    setOpenSection((prev) => (prev === id ? null : id))
  }

  return (
    <section className="py-16 sm:py-20" aria-labelledby="guide-heading" id="guida-admin">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="text-center">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Guida Interattiva
          </span>
          <h2
            id="guide-heading"
            className="mt-4 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl"
          >
            Come usare il{" "}
            <span className="text-primary">Pannello Admin</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
            Scopri passo dopo passo tutte le funzionalità a tua disposizione
            per gestire il tuo circolo su PrenotaUnCampetto.
          </p>
        </div>

        {/* Accordion sections */}
        <div className="mt-12 space-y-3">
          {SECTIONS.map((section, index) => {
            const isOpen = openSection === section.id
            const Content = SECTION_CONTENT[section.id]
            return (
              <div
                key={section.id}
                className={`rounded-2xl border transition-shadow ${
                  isOpen ? "shadow-md border-gray-300" : "shadow-sm hover:shadow-md"
                }`}
              >
                {/* Accordion trigger */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center gap-4 p-5 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`section-${section.id}`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${section.bgLight}`}>
                    <section.icon className={`h-5 w-5 ${section.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">{index + 1}.</span>
                      <h3 className="text-base font-semibold text-gray-900 truncate">{section.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{section.subtitle}</p>
                  </div>
                  <div className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </button>

                {/* Accordion content */}
                {isOpen && (
                  <div
                    id={`section-${section.id}`}
                    className="border-t px-5 pb-6 pt-4"
                  >
                    <Content />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

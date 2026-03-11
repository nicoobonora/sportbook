/**
 * Landing page "Per i Circoli" — spiega i vantaggi della piattaforma
 * ai gestori di circoli sportivi e li invita a registrarsi.
 */
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Per i Circoli Sportivi — PrenotaUnCampetto",
  description:
    "Scopri tutti i vantaggi di PrenotaUnCampetto per il tuo circolo sportivo: 30 giorni gratis, prenotazioni online, visibilità, gestione facile e molto altro.",
  openGraph: {
    title: "Per i Circoli Sportivi — PrenotaUnCampetto",
    description:
      "Prova gratis per 30 giorni: prenotazioni online, visibilità, gestione semplice.",
    type: "website",
  },
}

/* ─── SVG Illustration Components ───────────────────────────────── */

function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 320" fill="none" className="w-full max-w-lg mx-auto" aria-hidden="true">
      {/* Phone outline */}
      <rect x="160" y="30" width="160" height="260" rx="20" fill="#1E293B" />
      <rect x="168" y="50" width="144" height="220" rx="4" fill="#F8FAFC" />
      {/* Status bar dot */}
      <circle cx="240" cy="40" r="4" fill="#475569" />
      {/* App header */}
      <rect x="168" y="50" width="144" height="32" rx="4" fill="#2563EB" />
      <rect x="184" y="62" width="80" height="8" rx="2" fill="white" opacity="0.9" />
      {/* Calendar grid */}
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={184 + col * 40}
            y={96 + row * 38}
            width="32"
            height="28"
            rx="4"
            fill={row === 1 && col === 1 ? "#2563EB" : "#E2E8F0"}
          />
        ))
      )}
      {/* Check mark on selected slot */}
      <path d="M204 118l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(16, -2)" />
      {/* CTA button */}
      <rect x="184" y="250" width="112" height="28" rx="6" fill="#F97316" />
      <rect x="204" y="260" width="72" height="8" rx="2" fill="white" opacity="0.9" />
      {/* Floating elements */}
      <circle cx="100" cy="100" r="28" fill="#DBEAFE" />
      <text x="100" y="106" textAnchor="middle" fontSize="24">&#9917;</text>
      <circle cx="380" cy="80" r="24" fill="#FEF3C7" />
      <text x="380" y="86" textAnchor="middle" fontSize="20">&#127934;</text>
      <circle cx="90" cy="220" r="20" fill="#DCFCE7" />
      <text x="90" y="226" textAnchor="middle" fontSize="18">&#127952;</text>
      <circle cx="390" cy="200" r="22" fill="#FCE7F3" />
      <text x="390" y="206" textAnchor="middle" fontSize="18">&#127947;</text>
      {/* Notification badge */}
      <g transform="translate(340, 130)">
        <rect width="100" height="44" rx="10" fill="white" filter="url(#shadow)" />
        <circle cx="20" cy="22" r="10" fill="#16A34A" />
        <path d="M15 22l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <rect x="36" y="14" width="50" height="6" rx="2" fill="#CBD5E1" />
        <rect x="36" y="24" width="36" height="5" rx="2" fill="#E2E8F0" />
      </g>
      <defs>
        <filter id="shadow" x="-4" y="-2" width="108" height="52" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.12" />
        </filter>
      </defs>
    </svg>
  )
}

function SpeedIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" className="w-full max-w-[220px] mx-auto" aria-hidden="true">
      {/* Stopwatch */}
      <circle cx="140" cy="110" r="60" fill="#DBEAFE" />
      <circle cx="140" cy="110" r="52" fill="white" stroke="#2563EB" strokeWidth="3" />
      {/* Ticks */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
        <line
          key={angle}
          x1={140 + 42 * Math.cos((angle - 90) * Math.PI / 180)}
          y1={110 + 42 * Math.sin((angle - 90) * Math.PI / 180)}
          x2={140 + 48 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={110 + 48 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke="#94A3B8"
          strokeWidth={angle % 90 === 0 ? "2.5" : "1.5"}
          strokeLinecap="round"
        />
      ))}
      {/* Hand pointing to ~30 sec */}
      <line x1="140" y1="110" x2="170" y2="95" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
      <circle cx="140" cy="110" r="4" fill="#2563EB" />
      {/* Crown button */}
      <rect x="136" y="46" width="8" height="14" rx="3" fill="#2563EB" />
      {/* "30s" text */}
      <text x="140" y="30" textAnchor="middle" fontSize="20" fontWeight="700" fill="#2563EB">30s</text>
      {/* Speed lines */}
      <path d="M50 80 L70 85" stroke="#F97316" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M45 110 L68 110" stroke="#F97316" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M50 140 L70 135" stroke="#F97316" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

function VisibilityIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" className="w-full max-w-[220px] mx-auto" aria-hidden="true">
      {/* Globe */}
      <circle cx="140" cy="100" r="60" fill="#DBEAFE" />
      <circle cx="140" cy="100" r="50" fill="white" stroke="#2563EB" strokeWidth="2" />
      {/* Meridians */}
      <ellipse cx="140" cy="100" rx="20" ry="50" stroke="#93C5FD" strokeWidth="1.5" fill="none" />
      <line x1="90" y1="100" x2="190" y2="100" stroke="#93C5FD" strokeWidth="1.5" />
      <ellipse cx="140" cy="100" rx="50" ry="18" stroke="#93C5FD" strokeWidth="1.5" fill="none" />
      {/* Pin markers */}
      <g transform="translate(125, 72)">
        <path d="M8 0C4 0 0 3.5 0 8c0 6 8 12 8 12s8-6 8-12c0-4.5-4-8-8-8z" fill="#F97316" />
        <circle cx="8" cy="8" r="3" fill="white" />
      </g>
      <g transform="translate(155, 92)">
        <path d="M6 0C3 0 0 2.5 0 6c0 4.5 6 9 6 9s6-4.5 6-9c0-3.5-3-6-6-6z" fill="#2563EB" />
        <circle cx="6" cy="6" r="2.5" fill="white" />
      </g>
      {/* Wi-fi / signal arcs */}
      <path d="M210 60 Q225 50 240 60" stroke="#2563EB" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M215 52 Q225 42 235 52" stroke="#2563EB" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M220 44 Q225 38 230 44" stroke="#2563EB" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.3" />
    </svg>
  )
}

function MapIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" className="w-full max-w-[220px] mx-auto" aria-hidden="true">
      {/* Map background */}
      <rect x="40" y="30" width="200" height="140" rx="12" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
      {/* Map "roads" */}
      <path d="M40 90 L240 90" stroke="#E2E8F0" strokeWidth="2" />
      <path d="M40 130 L240 130" stroke="#E2E8F0" strokeWidth="2" />
      <path d="M100 30 L100 170" stroke="#E2E8F0" strokeWidth="2" />
      <path d="M170 30 L170 170" stroke="#E2E8F0" strokeWidth="2" />
      {/* Green areas */}
      <rect x="105" y="95" width="60" height="30" rx="4" fill="#BBF7D0" opacity="0.6" />
      <rect x="45" y="35" width="50" height="50" rx="4" fill="#BBF7D0" opacity="0.4" />
      {/* Cluster markers */}
      <circle cx="80" cy="70" r="14" fill="#2563EB" opacity="0.9" />
      <text x="80" y="75" textAnchor="middle" fontSize="12" fill="white" fontWeight="600">3</text>
      <circle cx="135" cy="110" r="18" fill="#2563EB" />
      <text x="135" y="116" textAnchor="middle" fontSize="14" fill="white" fontWeight="700">12</text>
      <circle cx="195" cy="65" r="12" fill="#F97316" />
      <text x="195" y="70" textAnchor="middle" fontSize="11" fill="white" fontWeight="600">5</text>
      {/* Single pins */}
      <g transform="translate(60, 120)">
        <path d="M6 0C3 0 0 2.5 0 6c0 4.5 6 9 6 9s6-4.5 6-9c0-3.5-3-6-6-6z" fill="#2563EB" />
        <circle cx="6" cy="6" r="2" fill="white" />
      </g>
      <g transform="translate(200, 120)">
        <path d="M6 0C3 0 0 2.5 0 6c0 4.5 6 9 6 9s6-4.5 6-9c0-3.5-3-6-6-6z" fill="#F97316" />
        <circle cx="6" cy="6" r="2" fill="white" />
      </g>
      {/* Search bar */}
      <rect x="65" y="178" width="150" height="20" rx="10" fill="white" stroke="#CBD5E1" strokeWidth="1" />
      <circle cx="80" cy="188" r="5" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
      <rect x="92" y="186" width="60" height="4" rx="2" fill="#E2E8F0" />
    </svg>
  )
}

function DashboardIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" className="w-full max-w-[220px] mx-auto" aria-hidden="true">
      {/* Browser window */}
      <rect x="30" y="20" width="220" height="160" rx="8" fill="white" stroke="#CBD5E1" strokeWidth="1.5" />
      {/* Title bar */}
      <rect x="30" y="20" width="220" height="24" rx="8" fill="#F1F5F9" />
      <circle cx="46" cy="32" r="4" fill="#FCA5A5" />
      <circle cx="58" cy="32" r="4" fill="#FDE68A" />
      <circle cx="70" cy="32" r="4" fill="#86EFAC" />
      {/* Sidebar */}
      <rect x="30" y="44" width="52" height="136" fill="#1E293B" />
      <rect x="38" y="54" width="36" height="6" rx="2" fill="#475569" />
      <rect x="38" y="68" width="36" height="6" rx="2" fill="#2563EB" />
      <rect x="38" y="82" width="36" height="6" rx="2" fill="#475569" />
      <rect x="38" y="96" width="36" height="6" rx="2" fill="#475569" />
      <rect x="38" y="110" width="36" height="6" rx="2" fill="#475569" />
      {/* Main content area */}
      {/* Stats cards */}
      <rect x="90" y="52" width="48" height="30" rx="4" fill="#DBEAFE" />
      <rect x="96" y="58" width="24" height="5" rx="1" fill="#93C5FD" />
      <text x="114" y="76" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2563EB">24</text>
      <rect x="144" y="52" width="48" height="30" rx="4" fill="#DCFCE7" />
      <rect x="150" y="58" width="24" height="5" rx="1" fill="#86EFAC" />
      <text x="168" y="76" textAnchor="middle" fontSize="10" fontWeight="700" fill="#16A34A">18</text>
      <rect x="198" y="52" width="44" height="30" rx="4" fill="#FEF3C7" />
      <rect x="204" y="58" width="20" height="5" rx="1" fill="#FDE68A" />
      <text x="220" y="76" textAnchor="middle" fontSize="10" fontWeight="700" fill="#D97706">6</text>
      {/* Calendar / booking list */}
      <rect x="90" y="90" width="152" height="80" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(96, ${98 + i * 18})`}>
          <rect width="8" height="8" rx="2" fill={i < 2 ? "#2563EB" : "#E2E8F0"} />
          <rect x="14" y="1" width="50" height="6" rx="1" fill="#CBD5E1" />
          <rect x="100" y="1" width="30" height="6" rx="1" fill={i < 2 ? "#DCFCE7" : "#FEF3C7"} />
        </g>
      ))}
      {/* Phone overlay (small) */}
      <g transform="translate(215, 110)">
        <rect width="50" height="80" rx="8" fill="#1E293B" />
        <rect x="4" y="10" width="42" height="60" rx="2" fill="#F8FAFC" />
        <rect x="8" y="16" width="34" height="6" rx="1" fill="#2563EB" />
        <rect x="8" y="26" width="34" height="18" rx="2" fill="#DBEAFE" />
        <rect x="8" y="48" width="34" height="6" rx="1" fill="#E2E8F0" />
        <rect x="8" y="58" width="34" height="6" rx="1" fill="#E2E8F0" />
      </g>
    </svg>
  )
}

function EmailIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" className="w-full max-w-[220px] mx-auto" aria-hidden="true">
      {/* Main envelope */}
      <rect x="60" y="50" width="160" height="110" rx="8" fill="white" stroke="#CBD5E1" strokeWidth="1.5" />
      {/* Envelope flap */}
      <path d="M60 58 L140 110 L220 58" stroke="#2563EB" strokeWidth="2" fill="#DBEAFE" />
      {/* Letter content peek */}
      <rect x="80" y="90" width="120" height="8" rx="2" fill="#E2E8F0" />
      <rect x="80" y="104" width="90" height="6" rx="2" fill="#E2E8F0" />
      <rect x="80" y="116" width="100" height="6" rx="2" fill="#E2E8F0" />
      <rect x="80" y="128" width="60" height="6" rx="2" fill="#E2E8F0" />
      {/* Notification badge */}
      <circle cx="210" cy="55" r="14" fill="#F97316" />
      <text x="210" y="60" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">1</text>
      {/* Sparkle */}
      <g transform="translate(45, 30)">
        <path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" fill="#F97316" opacity="0.6" />
      </g>
      {/* Bell icon */}
      <g transform="translate(225, 80)">
        <path d="M16 10c0-4-3-7.5-7-8v-2h-2v2c-4 .5-7 4-7 8v6l-2 2h20l-2-2v-6z" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
        <circle cx="8" cy="22" r="2.5" fill="#D97706" />
      </g>
    </svg>
  )
}

function AnnouncementIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" className="w-full max-w-[220px] mx-auto" aria-hidden="true">
      {/* Megaphone */}
      <g transform="translate(80, 40)">
        {/* Body */}
        <path d="M30 30 L100 10 L100 110 L30 90 Z" fill="#2563EB" />
        <rect x="10" y="40" width="20" height="40" rx="4" fill="#1D4ED8" />
        {/* Bell end */}
        <path d="M100 5 Q120 60 100 115" stroke="#2563EB" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* Handle */}
        <rect x="20" y="82" width="6" height="30" rx="2" fill="#1E293B" transform="rotate(-10, 23, 97)" />
      </g>
      {/* Sound waves */}
      <path d="M200 70 Q215 60 210 80" stroke="#F97316" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M210 55 Q230 45 225 85" stroke="#F97316" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M220 42 Q245 35 238 90" stroke="#F97316" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.3" />
      {/* Floating cards */}
      <g transform="translate(185, 105)">
        <rect width="80" height="36" rx="6" fill="white" filter="url(#shadow2)" />
        <rect x="8" y="8" width="40" height="5" rx="1" fill="#2563EB" />
        <rect x="8" y="18" width="60" height="4" rx="1" fill="#E2E8F0" />
        <rect x="8" y="26" width="48" height="4" rx="1" fill="#E2E8F0" />
      </g>
      <defs>
        <filter id="shadow2" x="-4" y="-2" width="88" height="44" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
        </filter>
      </defs>
    </svg>
  )
}

function AboutIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" className="w-full max-w-[220px] mx-auto" aria-hidden="true">
      {/* Browser / page */}
      <rect x="50" y="20" width="180" height="160" rx="10" fill="white" stroke="#CBD5E1" strokeWidth="1.5" />
      {/* Cover image area */}
      <rect x="50" y="20" width="180" height="55" rx="10" fill="#DBEAFE" />
      <rect x="50" y="65" width="180" height="10" fill="#DBEAFE" />
      {/* Logo circle */}
      <circle cx="90" cy="80" r="18" fill="white" stroke="#2563EB" strokeWidth="2" />
      <text x="90" y="86" textAnchor="middle" fontSize="16">&#127939;</text>
      {/* Title */}
      <rect x="118" y="72" width="80" height="8" rx="2" fill="#1E293B" />
      <rect x="118" y="84" width="50" height="5" rx="1" fill="#94A3B8" />
      {/* About text */}
      <rect x="62" y="106" width="156" height="5" rx="1" fill="#E2E8F0" />
      <rect x="62" y="116" width="140" height="5" rx="1" fill="#E2E8F0" />
      <rect x="62" y="126" width="150" height="5" rx="1" fill="#E2E8F0" />
      {/* Contact icons */}
      <g transform="translate(62, 140)">
        <circle cx="8" cy="8" r="8" fill="#DBEAFE" />
        <text x="8" y="12" textAnchor="middle" fontSize="9">&#128222;</text>
        <circle cx="30" cy="8" r="8" fill="#DCFCE7" />
        <text x="30" y="12" textAnchor="middle" fontSize="9">&#128231;</text>
        <circle cx="52" cy="8" r="8" fill="#FEF3C7" />
        <text x="52" y="12" textAnchor="middle" fontSize="9">&#128205;</text>
      </g>
      {/* Rating stars */}
      <g transform="translate(140, 142)">
        {[0, 1, 2, 3, 4].map((i) => (
          <text key={i} x={i * 14} y="12" fontSize="11" fill="#F59E0B">&#9733;</text>
        ))}
      </g>
    </svg>
  )
}

function TrialIllustration() {
  return (
    <svg viewBox="0 0 400 200" fill="none" className="w-full max-w-xs mx-auto" aria-hidden="true">
      {/* Shield */}
      <g transform="translate(140, 20)">
        <path d="M60 0 L120 20 L120 80 Q120 140 60 160 Q0 140 0 80 L0 20 Z" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2" />
        <path d="M60 10 L110 28 L110 78 Q110 130 60 148 Q10 130 10 78 L10 28 Z" fill="white" />
        {/* Check */}
        <path d="M40 80 L55 95 L85 60" stroke="#16A34A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        {/* "30" */}
        <text x="60" y="50" textAnchor="middle" fontSize="22" fontWeight="800" fill="#2563EB">30</text>
        <text x="60" y="125" textAnchor="middle" fontSize="10" fontWeight="600" fill="#64748B">GIORNI GRATIS</text>
      </g>
      {/* No credit card */}
      <g transform="translate(30, 80)">
        <rect width="60" height="38" rx="4" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
        <rect x="6" y="10" width="20" height="5" rx="1" fill="#CBD5E1" />
        <rect x="6" y="20" width="48" height="4" rx="1" fill="#E2E8F0" />
        <rect x="6" y="28" width="30" height="4" rx="1" fill="#E2E8F0" />
        {/* Cross */}
        <line x1="10" y1="5" x2="50" y2="33" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="5" x2="10" y2="33" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <text x="60" y="138" textAnchor="middle" fontSize="8" fontWeight="600" fill="#94A3B8">NESSUNA CARTA</text>
      {/* No lock-in */}
      <g transform="translate(310, 80)">
        <rect x="8" y="0" width="24" height="16" rx="12" fill="none" stroke="#CBD5E1" strokeWidth="3" />
        <rect x="0" y="14" width="40" height="28" rx="4" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
        {/* Unlocked */}
        <path d="M32 8 L32 0" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
        <circle cx="20" cy="26" r="3" fill="#16A34A" />
        <line x1="20" y1="29" x2="20" y2="34" stroke="#16A34A" strokeWidth="2" />
      </g>
      <text x="330" y="138" textAnchor="middle" fontSize="8" fontWeight="600" fill="#94A3B8">NESSUN OBBLIGO</text>
    </svg>
  )
}

/* ─── Page ────────────────────────────────────────────────────── */

export default function PerCircoliPage() {
  return (
    <main id="main-content" className="min-h-screen bg-background text-foreground">
      {/* ── Navbar ────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="font-display text-lg font-bold uppercase tracking-tight">
            Prenota<span className="text-primary">Un</span>Campetto
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/admin-login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Accedi
            </Link>
            <Link
              href="/registra-circolo"
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Prova gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-background pb-16 pt-12 sm:pt-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Per i circoli sportivi
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-tight tracking-tight sm:text-5xl">
                I tuoi campetti,{" "}
                <span className="text-primary">sempre prenotati</span>
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                PrenotaUnCampetto porta le prenotazioni del tuo circolo online.
                I tuoi clienti prenotano in 30 secondi dal telefono, tu gestisci tutto
                da un pannello semplice e immediato.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/registra-circolo"
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-base font-semibold text-white shadow-md hover:bg-primary/90 transition-all hover:shadow-lg"
                >
                  Inizia gratis — 30 giorni
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/"
                  className="inline-flex h-12 items-center gap-2 rounded-lg border border-border px-6 text-base font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  Esplora la mappa
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Nessuna carta di credito richiesta. Nessun obbligo di rinnovo.
              </p>
            </div>
            <div className="hidden lg:block">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ── Prova gratuita (highlight) ────────────────────── */}
      <section className="py-16 sm:py-20" aria-labelledby="trial-heading">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h2
            id="trial-heading"
            className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl"
          >
            30 giorni gratis, <span className="text-primary">senza impegno</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
            Attiva il tuo circolo in pochi minuti e provalo per un mese intero.
            Se non fa per te, non paghi nulla e non devi cancellare niente.
          </p>
          <div className="mt-10">
            <TrialIllustration />
          </div>
          <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
            {[
              { title: "Registrazione immediata", desc: "Entro massimo 24 ore il tuo sito sarà online" },
              { title: "Nessuna carta richiesta", desc: "Non chiediamo dati di pagamento per la prova." },
              { title: "Nessun rinnovo automatico", desc: "Alla scadenza, scegli tu se continuare." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border bg-white p-5 text-left shadow-sm">
                <h3 className="font-display text-sm font-bold uppercase tracking-wide">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Il problema (main selling point) ──────────────── */}
      <section className="bg-slate-900 py-16 text-white sm:py-20" aria-labelledby="problem-heading">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2
                id="problem-heading"
                className="font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl"
              >
                Quante prenotazioni{" "}
                <span className="text-orange-400">perdi ogni settimana?</span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-300">
                Lo sai come funziona: il gruppetto vuole giocare, qualcuno deve chiamare
                il circolo o passare di persona, ma nessuno ha tempo. La partita si rimanda,
                e il tuo campetto resta vuoto.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-slate-300">
                Con <strong className="text-white">PrenotaUnCampetto</strong>, il primo che ha
                l&apos;idea apre il telefono, prenota in 30 secondi e manda il link agli amici.
                Fatto: si sono presi l&apos;impegno, e tu hai il campetto pieno.
              </p>
              <div className="mt-8 flex items-center gap-4 rounded-xl bg-white/10 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-2xl">
                  &#128640;
                </div>
                <div>
                  <p className="text-sm font-bold text-orange-400 uppercase tracking-wide">Da rimandare a prenotare</p>
                  <p className="mt-0.5 text-sm text-slate-300">
                    I tuoi clienti prenotano in 30 secondi e si impegnano subito.
                    Niente più &quot;dai, facciamo domani&quot;.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <SpeedIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ── Vantaggi Grid ─────────────────────────────────── */}
      <section className="py-16 sm:py-20" aria-labelledby="features-heading">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h2
              id="features-heading"
              className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl"
            >
              Tutto quello che ti serve
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
              Una piattaforma completa per gestire il tuo circolo e farsi trovare
              da nuovi giocatori.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Visibilità online */}
            <div className="group rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <VisibilityIllustration />
              <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-tight">
                Visibilità online
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Il tuo circolo ottiene una pagina web dedicata con tutte le informazioni,
                gli orari e la possibilità di prenotare direttamente. Sei visibile su Google
                e raggiungibile da chiunque cerchi un campo nella tua zona.
              </p>
            </div>

            {/* Mappa dei circoli */}
            <div className="group rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <MapIllustration />
              <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-tight">
                Sulla mappa dei circoli
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Il tuo circolo appare nella mappa interattiva di{" "}
                <strong>prenotauncampetto.it</strong>, dove migliaia di giocatori cercano
                campi vicino a loro. Più visibilità significa più prenotazioni.
              </p>
            </div>

            {/* Dashboard di gestione */}
            <div className="group rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <DashboardIllustration />
              <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-tight">
                Gestione semplicissima
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Un pannello di amministrazione intuitivo per gestire campi, orari e
                prenotazioni. Funziona perfettamente sia dal computer che dal telefono,
                così puoi controllare tutto anche quando sei in giro.
              </p>
            </div>

            {/* Email notifiche */}
            <div className="group rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <EmailIllustration />
              <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-tight">
                Notifica ad ogni prenotazione
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Ricevi un&apos;email ogni volta che qualcuno prenota un campo.
                Sempre aggiornato, senza dover controllare continuamente il pannello.
                Non ti sfugge nessuna prenotazione.
              </p>
            </div>

            {/* Annunci */}
            <div className="group rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <AnnouncementIllustration />
              <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-tight">
                Pubblica annunci
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Hai organizzato un torneo? Un evento speciale? Pubblica annunci
                direttamente sulla tua pagina e tieni informati i tuoi giocatori.
                Ideale per promuovere tornei, corsi e novità del circolo.
              </p>
            </div>

            {/* About & contatti */}
            <div className="group rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <AboutIllustration />
              <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-tight">
                About e contatti
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Presenta il tuo circolo con una sezione &quot;Chi siamo&quot; personalizzata,
                completa di foto, descrizione e tutti i contatti: telefono, email, WhatsApp,
                indirizzo e link ai social.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA finale ────────────────────────────────────── */}
      <section className="bg-primary py-16 text-white sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
            Pronto a riempire i tuoi campetti?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
            Registra il tuo circolo in 2 minuti e inizia subito con 30 giorni
            di prova gratuita. Nessun obbligo, nessuna carta di credito.
          </p>
          <div className="mt-8">
            <Link
              href="/registra-circolo"
              className="inline-flex h-14 items-center gap-2 rounded-xl bg-white px-8 text-lg font-bold text-primary shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl"
            >
              Registra il tuo circolo
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <p className="mt-4 text-sm text-blue-200">
            Hai domande? Scrivici a{" "}
            <a href="mailto:info@prenotauncampetto.it" className="underline hover:text-white">
              info@prenotauncampetto.it
            </a>
          </p>
        </div>
      </section>

      {/* ── Footer minimo ─────────────────────────────────── */}
      <footer className="border-t bg-background py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 text-center text-sm text-muted-foreground">
          <Link href="/" className="font-display text-sm font-bold uppercase tracking-tight text-foreground">
            Prenota<span className="text-primary">Un</span>Campetto
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">Mappa</Link>
            <Link href="/registra-circolo" className="hover:text-foreground transition-colors">Registra circolo</Link>
            <Link href="/admin-login" className="hover:text-foreground transition-colors">Accedi</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} PrenotaUnCampetto. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </main>
  )
}

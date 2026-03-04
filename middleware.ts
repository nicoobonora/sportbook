/**
 * Middleware multi-tenant per SportBook.
 *
 * Logica di routing:
 * 1. hostname === APP_DOMAIN (es. app.sportbook.it) → super-admin
 * 2. hostname === [slug].DOMAIN → sito pubblico del circolo
 * 3. [slug].DOMAIN/admin/* → pannello admin del circolo (richiede auth)
 * 4. In sviluppo locale, usa il query param ?club=slug come fallback
 */
import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// Domini e configurazione
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000"
const ROOT_DOMAIN = APP_DOMAIN.replace(/^app\./, "")

export async function middleware(request: NextRequest) {
  const { supabaseResponse, supabase, user } = await updateSession(request)
  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""
  const pathname = url.pathname

  // ── Risorse statiche e API: passa direttamente ──
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // file statici (.ico, .png, ecc.)
  ) {
    return supabaseResponse
  }

  // ── Determina il contesto (super-admin o club) ──
  const isAppDomain = hostname === APP_DOMAIN || hostname === `app.${ROOT_DOMAIN}`
  const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1")

  // In localhost, usa il query param ?club=slug per simulare il subdominio
  let clubSlug: string | null = null

  if (isLocalhost) {
    clubSlug = url.searchParams.get("club") || null
  } else if (!isAppDomain) {
    // Estrai lo slug dal subdominio: [slug].sportbook.it
    const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "")
    if (subdomain && subdomain !== hostname) {
      clubSlug = subdomain
    }
  }

  // ── SUPER-ADMIN: app.sportbook.it/* ──
  if (isAppDomain || (isLocalhost && !clubSlug)) {
    // Le pagine super-admin richiedono autenticazione
    const isSuperAdminRoute =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/clubs") ||
      pathname.startsWith("/preview")

    if (isSuperAdminRoute && !user) {
      // Redirect al login super-admin
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    if (isSuperAdminRoute && user) {
      // Verifica che sia super-admin (controlla email nella allowlist)
      const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim())
      if (!superAdminEmails.includes(user.email || "")) {
        url.pathname = "/unauthorized"
        return NextResponse.redirect(url)
      }
    }

    // Inietta header per indicare il contesto super-admin
    supabaseResponse.headers.set("x-sportbook-context", "super-admin")
    return supabaseResponse
  }

  // ── CLUB SITE: [slug].sportbook.it/* ──
  if (clubSlug) {
    // Inietta lo slug del club negli headers per i Server Components
    supabaseResponse.headers.set("x-sportbook-context", "club")
    supabaseResponse.headers.set("x-sportbook-club-slug", clubSlug)

    // ── Admin del circolo: richiede autenticazione ──
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      if (!user) {
        if (isLocalhost) {
          url.pathname = "/admin/login"
          url.searchParams.set("club", clubSlug)
        } else {
          url.pathname = "/admin/login"
        }
        return NextResponse.redirect(url)
      }

      // L'utente è autenticato — la verifica che sia admin del club
      // avviene nelle singole pagine/API tramite RLS e is_club_admin()
    }

    return supabaseResponse
  }

  // ── Nessun contesto valido: mostra 404 ──
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match tutte le route tranne:
     * - _next/static (file statici)
     * - _next/image (ottimizzazione immagini)
     * - favicon.ico (icona)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

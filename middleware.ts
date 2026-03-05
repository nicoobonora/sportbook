/**
 * Middleware multi-tenant per SportBook.
 *
 * Logica di routing:
 * 1. hostname === APP_DOMAIN (es. app.prenotauncampetto.it) → super-admin
 * 2. hostname === [slug].DOMAIN → sito pubblico del circolo
 * 3. [slug].DOMAIN/admin/* → pannello admin del circolo (richiede auth)
 * 4. In sviluppo locale: /club/[slug]/* → sito del circolo (rewrite interno)
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

  let clubSlug: string | null = null
  let clubSubpath = "/" // Il path dopo /club/[slug]

  if (isLocalhost) {
    // Localhost: /club/[slug]/* → estrai slug e subpath
    const clubMatch = pathname.match(/^\/club\/([^/]+)(\/.*)?$/)
    if (clubMatch) {
      clubSlug = clubMatch[1]
      clubSubpath = clubMatch[2] || "/"
    }
  } else if (!isAppDomain) {
    // Produzione: estrai lo slug dal subdominio [slug].prenotauncampetto.it
    const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "")
    if (subdomain && subdomain !== hostname) {
      clubSlug = subdomain
      clubSubpath = pathname
    }
  }

  // ── CLUB SITE: /club/[slug]/* (localhost) o [slug].prenotauncampetto.it/* (prod) ──
  if (clubSlug) {
    // ── Admin del circolo: richiede autenticazione ──
    if (clubSubpath.startsWith("/admin") && clubSubpath !== "/admin/login") {
      if (!user) {
        if (isLocalhost) {
          url.pathname = `/club/${clubSlug}/admin/login`
        } else {
          url.pathname = "/admin/login"
        }
        return NextResponse.redirect(url)
      }
    }

    // Inietta lo slug nelle request headers per i Server Components
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-sportbook-context", "club")
    requestHeaders.set("x-sportbook-club-slug", clubSlug)
    if (clubSubpath.startsWith("/admin")) {
      requestHeaders.set("x-sportbook-admin", "true")
    }

    if (isLocalhost) {
      // Rewrite: /club/[slug]/prenota → /prenota (il browser vede ancora /club/[slug]/prenota)
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = clubSubpath

      const response = NextResponse.rewrite(rewriteUrl, {
        request: { headers: requestHeaders },
      })

      // Preserva i cookie di autenticazione Supabase (incluse opzioni)
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie)
      })

      return response
    }

    // Produzione: passa normalmente con headers iniettati
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    })

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie)
    })

    return response
  }

  // ── SUPER-ADMIN: app.prenotauncampetto.it/* o localhost senza /club/ ──
  if (isAppDomain || isLocalhost) {
    const isSuperAdminRoute =
      pathname.startsWith("/super-admin") && pathname !== "/super-admin/login"

    if (isSuperAdminRoute && !user) {
      url.pathname = "/super-admin/login"
      return NextResponse.redirect(url)
    }

    if (isSuperAdminRoute && user) {
      const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim())
      if (!superAdminEmails.includes(user.email || "")) {
        url.pathname = "/unauthorized"
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

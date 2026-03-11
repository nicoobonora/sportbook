/**
 * Pagina Contatti del sito pubblico del circolo.
 * Mostra indirizzo, telefono, WhatsApp, email, social e form contatto.
 */
import type { Metadata } from "next"
import { getClubFromHeaders } from "@/lib/hooks/use-club"
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactForm } from "@/components/club-site/contact-form"
import { SocialLinks } from "@/components/club-site/social-links"

export async function generateMetadata(): Promise<Metadata> {
  const club = await getClubFromHeaders()
  if (!club) return { title: "Contatti — SportBook" }

  const locationParts = [club.address, club.city, club.province].filter(Boolean)
  const locationLabel = locationParts.join(", ")

  return {
    title: `Contatti e Come Raggiungerci — ${club.name}${club.city ? `, ${club.city}` : ""}`,
    description: `Contatta ${club.name}${locationLabel ? ` — ${locationLabel}` : ""}. Telefono, indirizzo, indicazioni e form contatto per informazioni e prenotazioni.`,
  }
}

export default async function ContattiPage() {
  const club = await getClubFromHeaders()
  if (!club) return null

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="container-sportbook py-8 sm:py-12">
        <h1 className="font-display text-display-lg uppercase tracking-tight">
          Contatti
        </h1>
        <p className="mt-1 text-muted-foreground">
          Contattaci per informazioni e prenotazioni
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* ── Colonna sinistra: info e contatti ── */}
          <div className="space-y-6">
            {/* About (se disponibile) */}
            {club.about_text && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-display-sm uppercase">
                    Chi siamo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                    {club.about_text}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Contatti diretti */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-display-sm uppercase">
                  Dove trovarci
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Indirizzo */}
                {(club.address || club.city) && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Indirizzo</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          [club.address, club.city].filter(Boolean).join(", ")
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary hover:underline"
                      >
                        {[club.address, club.city].filter(Boolean).join(", ")}
                      </a>
                    </div>
                  </div>
                )}

                {/* Telefono */}
                {club.phone && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Telefono</p>
                      <a
                        href={`tel:${club.phone}`}
                        className="text-sm text-muted-foreground hover:text-primary hover:underline"
                      >
                        {club.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* WhatsApp */}
                {club.whatsapp && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                      <MessageCircle className="h-5 w-5 text-success" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">WhatsApp</p>
                      <a
                        href={`https://wa.me/${club.whatsapp.replace(/[^0-9+]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-success hover:underline"
                      >
                        Scrivici su WhatsApp
                      </a>
                    </div>
                  </div>
                )}

                {/* Email */}
                {club.email && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <a
                        href={`mailto:${club.email}`}
                        className="text-sm text-muted-foreground hover:text-primary hover:underline"
                      >
                        {club.email}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social */}
            {(club.instagram_url || club.facebook_url) && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-display-sm uppercase">
                    Seguici
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SocialLinks
                    instagram={club.instagram_url}
                    facebook={club.facebook_url}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Colonna destra: form contatto ── */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-display-sm uppercase">
                  Scrivici
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContactForm clubId={club.id} clubEmail={club.email} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

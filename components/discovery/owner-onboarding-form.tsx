/**
 * Form di onboarding per gestori di circoli sportivi.
 * Due modalità:
 * 1. Seleziona il tuo circolo dalla lista (se già presente) → claim
 * 2. Richiedi l'inserimento di un nuovo circolo
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  PlusCircle,
  Search,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { MapClub } from "@/lib/types/map"

type Mode = "choose" | "claim" | "new"

type ClaimFormData = {
  contact_name: string
  contact_email: string
  contact_phone: string
  role: string
  message: string
}

type NewClubFormData = {
  club_name: string
  city: string
  sport: string
  contact_name: string
  contact_email: string
  contact_phone: string
  message: string
}

export function OwnerOnboardingForm() {
  const [mode, setMode] = useState<Mode>("choose")
  const [clubs, setClubs] = useState<MapClub[]>([])
  const [search, setSearch] = useState("")
  const [selectedClub, setSelectedClub] = useState<MapClub | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClubs = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/clubs/map")
    if (res.ok) {
      const data = await res.json()
      setClubs(data.clubs || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClubs()
  }, [fetchClubs])

  const filteredClubs = clubs.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  )

  // --- Claim form ---
  const claimForm = useForm<ClaimFormData>({
    defaultValues: {
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      role: "proprietario",
      message: "",
    },
  })

  async function handleClaimSubmit(data: ClaimFormData) {
    if (!selectedClub) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/clubs/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, club_id: selectedClub.id }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error || "Errore durante l'invio")
        return
      }
      setSubmitted(true)
    } catch {
      setError("Errore di rete. Riprova.")
    } finally {
      setSubmitting(false)
    }
  }

  // --- New club form ---
  const newClubForm = useForm<NewClubFormData>({
    defaultValues: {
      club_name: "",
      city: "",
      sport: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      message: "",
    },
  })

  async function handleNewClubSubmit(data: NewClubFormData) {
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/clubs/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error || "Errore durante l'invio")
        return
      }
      setSubmitted(true)
    } catch {
      setError("Errore di rete. Riprova.")
    } finally {
      setSubmitting(false)
    }
  }

  // --- Success state ---
  if (submitted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold">Richiesta inviata!</h2>
          <p className="text-muted-foreground">
            Ti contatteremo entro 24 ore per verificare la tua identità e
            attivare la tua pagina.
          </p>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna alla mappa
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // --- Mode: Choose (default) ---
  if (mode === "choose") {
    return (
      <div className="space-y-6">
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => setMode("claim")}
        >
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Il mio circolo è già sulla mappa</h2>
              <p className="text-sm text-muted-foreground">
                Cerca il tuo circolo e richiedi l&apos;accesso al pannello di gestione
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => setMode("new")}
        >
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
              <PlusCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold">
                Voglio aggiungere il mio circolo
              </h2>
              <p className="text-sm text-muted-foreground">
                Il tuo circolo non è ancora presente? Richiedi l&apos;inserimento
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Il servizio è gratuito. Ti contatteremo entro 24 ore.
        </p>
      </div>
    )
  }

  // --- Mode: Claim existing club ---
  if (mode === "claim") {
    // Step 1: Search and select
    if (!selectedClub) {
      return (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("choose")}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Indietro
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cerca il tuo circolo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome o città..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {filteredClubs.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Nessun circolo trovato.
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setMode("new")}
                        className="mt-1"
                      >
                        Richiedi l&apos;inserimento del tuo circolo
                      </Button>
                    </div>
                  ) : (
                    filteredClubs.slice(0, 20).map((club) => (
                      <button
                        key={club.id}
                        onClick={() => setSelectedClub(club)}
                        className="flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors hover:bg-muted"
                      >
                        <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {club.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {club.city || "Italia"}
                            {club.sports.length > 0 &&
                              ` · ${club.sports.join(", ")}`}
                          </p>
                        </div>
                        {club.claim_status === "claimed" ? (
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[10px]"
                          >
                            Verificato
                          </Badge>
                        ) : club.claim_status === "pending" ? (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-amber-300 text-[10px] text-amber-600"
                          >
                            In verifica
                          </Badge>
                        ) : null}
                      </button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    // Step 2: Claim form for selected club
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedClub(null)}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Cambia circolo
        </Button>

        {/* Club selezionato */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Building2 className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">{selectedClub.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedClub.city || "Italia"}
              </p>
            </div>
          </CardContent>
        </Card>

        {selectedClub.claim_status === "claimed" ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Questo circolo è già stato verificato. Se sei il gestore e hai
                bisogno di supporto, contattaci a{" "}
                <a
                  href="mailto:info@prenotauncampetto.it"
                  className="font-medium text-primary hover:underline"
                >
                  info@prenotauncampetto.it
                </a>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">I tuoi dati</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={claimForm.handleSubmit(handleClaimSubmit)}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="claim-name">Nome e cognome *</Label>
                  <Input
                    id="claim-name"
                    placeholder="Mario Rossi"
                    {...claimForm.register("contact_name", {
                      required: true,
                    })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="claim-email">Email *</Label>
                  <Input
                    id="claim-email"
                    type="email"
                    placeholder="mario@esempio.it"
                    {...claimForm.register("contact_email", {
                      required: true,
                    })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="claim-phone">Telefono *</Label>
                  <Input
                    id="claim-phone"
                    type="tel"
                    placeholder="+39 333 1234567"
                    {...claimForm.register("contact_phone", {
                      required: true,
                    })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="claim-role">Il tuo ruolo *</Label>
                  <select
                    id="claim-role"
                    {...claimForm.register("role")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="proprietario">Proprietario</option>
                    <option value="gestore">Gestore / Responsabile</option>
                    <option value="collaboratore">
                      Collaboratore / Staff
                    </option>
                    <option value="altro">Altro</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="claim-message">
                    Note{" "}
                    <span className="text-muted-foreground">(opzionali)</span>
                  </Label>
                  <textarea
                    id="claim-message"
                    rows={3}
                    placeholder="Informazioni aggiuntive..."
                    {...claimForm.register("message")}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Invia richiesta
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // --- Mode: Request new club ---
  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMode("choose")}
        className="gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Indietro
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Richiedi l&apos;inserimento del tuo circolo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={newClubForm.handleSubmit(handleNewClubSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="new-club-name">Nome del circolo *</Label>
              <Input
                id="new-club-name"
                placeholder="es. Circolo Tennis Roma Sud"
                {...newClubForm.register("club_name", { required: true })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-club-city">Città *</Label>
                <Input
                  id="new-club-city"
                  placeholder="es. Roma"
                  {...newClubForm.register("city", { required: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-club-sport">Sport principale *</Label>
                <Input
                  id="new-club-sport"
                  placeholder="es. padel, tennis"
                  {...newClubForm.register("sport", { required: true })}
                />
              </div>
            </div>

            <hr className="my-2" />

            <div className="space-y-1.5">
              <Label htmlFor="new-contact-name">Il tuo nome *</Label>
              <Input
                id="new-contact-name"
                placeholder="Mario Rossi"
                {...newClubForm.register("contact_name", { required: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-contact-email">Email *</Label>
              <Input
                id="new-contact-email"
                type="email"
                placeholder="mario@esempio.it"
                {...newClubForm.register("contact_email", { required: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-contact-phone">Telefono *</Label>
              <Input
                id="new-contact-phone"
                type="tel"
                placeholder="+39 333 1234567"
                {...newClubForm.register("contact_phone", { required: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-message">
                Note{" "}
                <span className="text-muted-foreground">(opzionali)</span>
              </Label>
              <textarea
                id="new-message"
                rows={3}
                placeholder="Indirizzo, informazioni aggiuntive..."
                {...newClubForm.register("message")}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Invio in corso...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Richiedi inserimento
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Form creazione/modifica circolo sportivo.
 * Organizzato in tab: Identità, About, Colori, Contatti.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, MapPin } from "lucide-react"
import {
  clubFormSchema,
  SPORTS_OPTIONS,
  type ClubFormValues,
} from "@/lib/validations/club"
import type { Club } from "@/lib/types/database"
import type { ParsedAddress } from "@/lib/utils/nominatim"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function ClubForm({ club }: { club?: Club }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [selectedSports, setSelectedSports] = useState<string[]>(
    club?.sports || []
  )

  const isEditing = !!club

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClubFormValues>({
    resolver: zodResolver(clubFormSchema),
    defaultValues: {
      name: club?.name || "",
      slug: club?.slug || "",
      tagline: club?.tagline || "",
      about_text: club?.about_text || "",
      sports: club?.sports || [],
      address: club?.address || "",
      city: club?.city || "",
      postal_code: club?.postal_code || "",
      region: club?.region || "",
      country: club?.country || "IT",
      latitude: club?.latitude ?? null,
      longitude: club?.longitude ?? null,
      phone: club?.phone || "",
      email: club?.email || "",
      whatsapp: club?.whatsapp || "",
      instagram_url: club?.instagram_url || "",
      facebook_url: club?.facebook_url || "",
    },
  })

  const watchName = watch("name")
  const watchLatitude = watch("latitude")
  const watchLongitude = watch("longitude")

  function handleAddressSelect(result: ParsedAddress) {
    setValue("address", result.address)
    setValue("city", result.city)
    setValue("postal_code", result.postal_code)
    setValue("region", result.region)
    setValue("country", result.country)
    setValue("latitude", result.latitude)
    setValue("longitude", result.longitude)
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    if (!isEditing) {
      setValue("slug", slugify(name))
    }
  }

  function toggleSport(sport: string) {
    const updated = selectedSports.includes(sport)
      ? selectedSports.filter((s) => s !== sport)
      : [...selectedSports, sport]
    setSelectedSports(updated)
    setValue("sports", updated)
  }

  async function onSubmit(data: ClubFormValues) {
    setError(null)

    const endpoint = isEditing
      ? `/api/clubs?id=${club.id}`
      : "/api/clubs"

    const response = await fetch(endpoint, {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const result = await response.json()
      setError(result.error || "Si è verificato un errore. Riprova.")
      return
    }

    const result = await response.json()
    router.push(`/super-admin/clubs/${result.id}/edit`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="identity">Identità</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="contacts">Contatti</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Identità ── */}
        <TabsContent value="identity">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome del circolo *</Label>
                <Input
                  id="name"
                  placeholder="Circolo Sportivo Roma Nord"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  {...register("name", { onChange: handleNameChange })}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-error" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (subdominio) *</Label>
                <div className="flex items-center gap-1">
                  <Input
                    id="slug"
                    placeholder="circolo-roma-nord"
                    aria-invalid={!!errors.slug}
                    aria-describedby={errors.slug ? "slug-error" : "slug-hint"}
                    {...register("slug")}
                  />
                  <span className="shrink-0 text-sm text-muted-foreground">
                    .prenotauncampetto.it
                  </span>
                </div>
                <p id="slug-hint" className="text-xs text-muted-foreground">
                  Solo lettere minuscole, numeri e trattini
                </p>
                {errors.slug && (
                  <p id="slug-error" className="text-sm text-error" role="alert">
                    {errors.slug.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  placeholder="Il tuo circolo sportivo nel cuore di Roma"
                  {...register("tagline")}
                />
                {errors.tagline && (
                  <p className="text-sm text-error" role="alert">
                    {errors.tagline.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Sport disponibili *</Label>
                <div className="flex flex-wrap gap-2">
                  {SPORTS_OPTIONS.map((sport) => (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => toggleSport(sport)}
                      className="touch-target"
                      role="checkbox"
                      aria-checked={selectedSports.includes(sport)}
                      aria-label={`Sport: ${sport}`}
                    >
                      <Badge
                        variant={selectedSports.includes(sport) ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                      >
                        {sport}
                      </Badge>
                    </button>
                  ))}
                </div>
                {errors.sports && (
                  <p className="text-sm text-error" role="alert">
                    {errors.sports.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: About ── */}
        <TabsContent value="about">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="about_text">Testo About</Label>
                <Textarea
                  id="about_text"
                  placeholder="Racconta la storia e i valori del circolo..."
                  rows={8}
                  {...register("about_text")}
                />
                {errors.about_text && (
                  <p className="text-sm text-error" role="alert">
                    {errors.about_text.message}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Il caricamento di logo, cover e immagine about sarà disponibile dopo il salvataggio.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Contatti ── */}
        <TabsContent value="contacts">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="sa-address">Indirizzo</Label>
                <AddressAutocomplete
                  id="sa-address"
                  defaultValue={club?.address || ""}
                  onSelect={handleAddressSelect}
                  placeholder="Cerca indirizzo del circolo..."
                />
              </div>

              {(watchLatitude || watch("city")) && (
                <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                  {watch("city") && (
                    <p>
                      <span className="font-medium">Città:</span> {watch("city")}
                      {watch("postal_code") && ` (${watch("postal_code")})`}
                      {watch("region") && ` — ${watch("region")}`}
                    </p>
                  )}
                  {watchLatitude && watchLongitude && (
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      Coordinate: {watchLatitude.toFixed(4)}, {watchLongitude.toFixed(4)}
                    </p>
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input id="phone" type="tel" placeholder="+39 06 1234567" {...register("phone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email del circolo</Label>
                  <Input id="email" type="email" placeholder="info@circolo.it" {...register("email")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" type="tel" placeholder="+393331234567" {...register("whatsapp")} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="instagram_url">Instagram</Label>
                  <Input id="instagram_url" type="url" placeholder="https://instagram.com/circolo" {...register("instagram_url")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook_url">Facebook</Label>
                  <Input id="facebook_url" type="url" placeholder="https://facebook.com/circolo" {...register("facebook_url")} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Errore e bottone submit */}
      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annulla
        </Button>
        <Button type="submit" disabled={isSubmitting} className="touch-target">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Salvataggio...
            </>
          ) : isEditing ? (
            "Salva modifiche"
          ) : (
            "Crea circolo"
          )}
        </Button>
      </div>
    </form>
  )
}

/**
 * Componente impostazioni circolo.
 * Tabs: Info generali, Strutture/Campi.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Loader2, Plus, Trash2 } from "lucide-react"
import type { Club, Field } from "@/lib/types/database"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Props = {
  club: Club
  fields: Field[]
}

export function ClubSettings({ club, fields }: Props) {
  return (
    <Tabs defaultValue="info">
      <TabsList className="mb-6 grid w-full grid-cols-2">
        <TabsTrigger value="info">Info circolo</TabsTrigger>
        <TabsTrigger value="fields">Strutture</TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <ClubInfoForm club={club} />
      </TabsContent>

      <TabsContent value="fields">
        <FieldsManager clubId={club.id} fields={fields} />
      </TabsContent>
    </Tabs>
  )
}

/** Form modifica info circolo */
function ClubInfoForm({ club }: { club: Club }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      about_text: club.about_text || "",
      address: club.address || "",
      city: club.city || "",
      phone: club.phone || "",
      email: club.email || "",
      whatsapp: club.whatsapp || "",
    },
  })

  async function onSubmit(data: Record<string, string>) {
    setError(null)
    setSuccess(false)
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from("clubs")
      .update({
        about_text: data.about_text || null,
        address: data.address || null,
        city: data.city || null,
        phone: data.phone || null,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
      })
      .eq("id", club.id)

    if (updateError) {
      setError("Errore durante il salvataggio.")
      return
    }

    setSuccess(true)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informazioni del circolo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="settings-about">Testo About</Label>
            <Textarea
              id="settings-about"
              rows={5}
              placeholder="Racconta la storia del circolo..."
              {...register("about_text")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="settings-address">Indirizzo</Label>
              <Input id="settings-address" {...register("address")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-city">Città</Label>
              <Input id="settings-city" {...register("city")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="settings-phone">Telefono</Label>
              <Input id="settings-phone" type="tel" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-email">Email</Label>
              <Input id="settings-email" type="email" {...register("email")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-whatsapp">WhatsApp</Label>
            <Input
              id="settings-whatsapp"
              type="tel"
              placeholder="+393331234567"
              {...register("whatsapp")}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-error" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div
              className="rounded-md bg-green-50 p-3 text-sm text-success"
              role="status"
              aria-live="polite"
            >
              Impostazioni salvate con successo.
            </div>
          )}

          <Button type="submit" className="touch-target" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Salvataggio...
              </>
            ) : (
              "Salva impostazioni"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

/** Gestore strutture/campi */
function FieldsManager({ clubId, fields }: { clubId: string; fields: Field[] }) {
  const router = useRouter()

  async function handleDeleteField(fieldId: string) {
    if (!confirm("Eliminare questa struttura? Le prenotazioni associate verranno rimosse.")) return
    const supabase = createClient()
    await supabase.from("fields").delete().eq("id", fieldId).eq("club_id", clubId)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {fields.length} struttur{fields.length === 1 ? "a" : "e"} configurat{fields.length === 1 ? "a" : "e"}
        </p>
        <AddFieldDialog clubId={clubId} />
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Nessuna struttura configurata.</p>
            <p className="mt-1 text-sm">
              Aggiungi campi, campetti o strutture per abilitare le prenotazioni.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field) => (
            <Card key={field.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{field.name}</p>
                    <Badge variant="secondary" className="capitalize">
                      {field.sport}
                    </Badge>
                    {!field.is_active && (
                      <Badge variant="outline">Disattivo</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Capacità: {field.capacity}
                    {field.description && ` · ${field.description}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="touch-target text-muted-foreground hover:text-error"
                  onClick={() => handleDeleteField(field.id)}
                  aria-label={`Elimina ${field.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/** Dialog aggiunta nuova struttura */
function AddFieldDialog({ clubId }: { clubId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      sport: "",
      description: "",
      capacity: 2,
    },
  })

  async function onSubmit(data: { name: string; sport: string; description: string; capacity: number }) {
    setError(null)
    const supabase = createClient()

    const { error: insertError } = await supabase.from("fields").insert({
      club_id: clubId,
      name: data.name,
      sport: data.sport,
      description: data.description || null,
      capacity: data.capacity,
    })

    if (insertError) {
      setError("Errore durante il salvataggio.")
      return
    }

    reset()
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="touch-target gap-1">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Aggiungi struttura
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuova struttura</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="field-name">Nome *</Label>
            <Input
              id="field-name"
              placeholder="es. Campo Padel 1"
              aria-invalid={!!errors.name}
              {...register("name", { required: "Il nome è obbligatorio" })}
            />
            {errors.name && (
              <p className="text-sm text-error" role="alert">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="field-sport">Sport *</Label>
            <Input
              id="field-sport"
              placeholder="es. padel, tennis, calcetto"
              aria-invalid={!!errors.sport}
              {...register("sport", { required: "Lo sport è obbligatorio" })}
            />
            {errors.sport && (
              <p className="text-sm text-error" role="alert">{errors.sport.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="field-desc">Descrizione</Label>
            <Textarea
              id="field-desc"
              placeholder="Descrizione opzionale..."
              rows={2}
              {...register("description")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="field-capacity">Capacità (persone)</Label>
            <Input
              id="field-capacity"
              type="number"
              min={1}
              {...register("capacity", { valueAsNumber: true })}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-error" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full touch-target" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Salvataggio...
              </>
            ) : (
              "Aggiungi struttura"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Gestore slot: template settimanali e generazione slot.
 * Include form per creare template e bottone per generare slot.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Plus,
  Loader2,
  Trash2,
  Clock,
  Zap,
} from "lucide-react"
import type { Field } from "@/lib/types/database"
import { slotTemplateSchema, type SlotTemplateValues } from "@/lib/validations/slot"
import { DAYS_OF_WEEK } from "@/lib/utils/dates"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Props = {
  clubId: string
  fields: Field[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  templates: any[]
}

export function SlotManager({ clubId, fields, templates }: Props) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setGenerateResult(null)

    const response = await fetch("/api/slots/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ club_id: clubId, weeks: 4 }),
    })

    setGenerating(false)

    if (response.ok) {
      const data = await response.json()
      setGenerateResult(`Generati ${data.generated} slot per le prossime 4 settimane.`)
      router.refresh()
    } else {
      setGenerateResult("Errore nella generazione degli slot.")
    }
  }

  return (
    <Tabs defaultValue="templates">
      <TabsList className="mb-6 grid w-full grid-cols-2">
        <TabsTrigger value="templates">Template settimanali</TabsTrigger>
        <TabsTrigger value="generate">Genera slot</TabsTrigger>
      </TabsList>

      {/* ── Template settimanali ── */}
      <TabsContent value="templates">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Configura gli orari ricorrenti per ogni giorno della settimana.
          </p>
          <AddTemplateDialog clubId={clubId} fields={fields} />
        </div>

        {fields.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>Nessuna struttura configurata.</p>
              <p className="mt-1 text-sm">
                Aggiungi le strutture dalle impostazioni prima di creare i template.
              </p>
            </CardContent>
          </Card>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Clock className="mx-auto h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
              <p className="mt-3">Nessun template configurato.</p>
              <p className="mt-1 text-sm">
                Crea il primo template per definire gli orari delle prenotazioni.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} clubId={clubId} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* ── Genera slot ── */}
      <TabsContent value="generate">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" aria-hidden="true" />
              Genera slot dalle configurazioni
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Genera automaticamente gli slot per le prossime 4 settimane
              partendo dai template settimanali configurati. Gli slot già
              esistenti non verranno duplicati.
            </p>

            {generateResult && (
              <div
                className="rounded-md bg-muted px-3 py-2 text-sm"
                role="status"
                aria-live="polite"
              >
                {generateResult}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={generating || templates.length === 0}
              className="touch-target"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Generazione in corso...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
                  Genera slot (4 settimane)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

/** Card template con dettagli e pulsante elimina */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TemplateCard({ template, clubId }: { template: any; clubId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm("Eliminare questo template?")) return
    setDeleting(true)

    const supabase = createClient()
    await supabase.from("slot_templates").delete().eq("id", template.id).eq("club_id", clubId)

    setDeleting(false)
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {DAYS_OF_WEEK[template.day_of_week]}
            </Badge>
            <span className="font-mono text-sm font-semibold">
              {template.start_time.substring(0, 5)} — {template.end_time.substring(0, 5)}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {template.fields?.name || "—"} ({template.fields?.sport || "—"}) ·
            {template.price_cents === 0
              ? " Gratuito"
              : ` ${(template.price_cents / 100).toFixed(2)}€`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="touch-target text-muted-foreground hover:text-error"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Elimina template"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

/** Dialog per aggiungere un nuovo template */
function AddTemplateDialog({ clubId, fields }: { clubId: string; fields: Field[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SlotTemplateValues>({
    resolver: zodResolver(slotTemplateSchema),
    defaultValues: {
      club_id: clubId,
      price_cents: 0,
      max_bookings: 1,
      is_active: true,
    },
  })

  async function onSubmit(data: SlotTemplateValues) {
    setError(null)
    const supabase = createClient()

    const { error: insertError } = await supabase
      .from("slot_templates")
      .insert({
        club_id: data.club_id,
        field_id: data.field_id,
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
        price_cents: data.price_cents,
        max_bookings: data.max_bookings,
        is_active: data.is_active,
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
          Aggiungi template
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuovo template orario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Struttura */}
          <div className="space-y-1.5">
            <Label>Struttura *</Label>
            <Select onValueChange={(v) => setValue("field_id", v)}>
              <SelectTrigger aria-label="Seleziona struttura">
                <SelectValue placeholder="Seleziona campo..." />
              </SelectTrigger>
              <SelectContent>
                {fields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} ({f.sport})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.field_id && (
              <p className="text-sm text-error" role="alert">{errors.field_id.message}</p>
            )}
          </div>

          {/* Giorno della settimana */}
          <div className="space-y-1.5">
            <Label>Giorno *</Label>
            <Select onValueChange={(v) => setValue("day_of_week", parseInt(v, 10))}>
              <SelectTrigger aria-label="Seleziona giorno">
                <SelectValue placeholder="Seleziona giorno..." />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.day_of_week && (
              <p className="text-sm text-error" role="alert">{errors.day_of_week.message}</p>
            )}
          </div>

          {/* Orario inizio/fine */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-start">Inizio *</Label>
              <Input id="tpl-start" type="time" {...register("start_time")} />
              {errors.start_time && (
                <p className="text-sm text-error" role="alert">{errors.start_time.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-end">Fine *</Label>
              <Input id="tpl-end" type="time" {...register("end_time")} />
              {errors.end_time && (
                <p className="text-sm text-error" role="alert">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          {/* Prezzo */}
          <div className="space-y-1.5">
            <Label htmlFor="tpl-price">Prezzo (centesimi)</Label>
            <Input
              id="tpl-price"
              type="number"
              min={0}
              {...register("price_cents", { valueAsNumber: true })}
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
              "Crea template"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

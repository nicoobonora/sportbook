/**
 * Gestore annunci: lista con azioni + dialog creazione/modifica.
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
  Pin,
  PinOff,
  Pencil,
  Megaphone,
} from "lucide-react"
import type { Announcement } from "@/lib/types/database"
import {
  announcementFormSchema,
  type AnnouncementFormValues,
} from "@/lib/validations/announcement"
import { formatDate } from "@/lib/utils/dates"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Props = {
  clubId: string
  announcements: Announcement[]
}

export function AnnouncementManager({ clubId, announcements }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {announcements.length} annunc{announcements.length === 1 ? "io" : "i"}
        </p>
        <AnnouncementDialog clubId={clubId} />
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Megaphone className="mx-auto h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
            <p className="mt-3">Nessun annuncio pubblicato.</p>
            <p className="mt-1 text-sm">Crea il primo annuncio per il tuo circolo.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <AnnouncementCard key={ann.id} announcement={ann} clubId={clubId} />
          ))}
        </div>
      )}
    </div>
  )
}

/** Card singolo annuncio con azioni */
function AnnouncementCard({
  announcement,
  clubId,
}: {
  announcement: Announcement
  clubId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const isExpired =
    announcement.expires_at && new Date(announcement.expires_at) < new Date()

  async function handleTogglePin() {
    setLoading("pin")
    const supabase = createClient()
    await supabase
      .from("announcements")
      .update({ is_pinned: !announcement.is_pinned })
      .eq("id", announcement.id)
      .eq("club_id", clubId)
    setLoading(null)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm("Eliminare questo annuncio? L'azione non può essere annullata.")) return
    setLoading("delete")
    const supabase = createClient()
    await supabase
      .from("announcements")
      .delete()
      .eq("id", announcement.id)
      .eq("club_id", clubId)
    setLoading(null)
    router.refresh()
  }

  return (
    <Card className={isExpired ? "opacity-60" : undefined}>
      <CardContent className="py-4">
        <div className="space-y-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-medium">{announcement.title}</h3>
              {announcement.is_pinned && (
                <Badge variant="secondary" className="gap-1 shrink-0">
                  <Pin className="h-3 w-3" aria-hidden="true" />
                  Pinnato
                </Badge>
              )}
              {isExpired && (
                <Badge variant="outline" className="shrink-0">Scaduto</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Pubblicato il {formatDate(announcement.published_at)}
              {announcement.expires_at && (
                <> · Scade il {formatDate(announcement.expires_at)}</>
              )}
            </p>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {announcement.body}
            </p>
          </div>

          {/* Azioni */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleTogglePin}
              disabled={!!loading}
              aria-label={announcement.is_pinned ? "Rimuovi evidenza" : "Metti in evidenza"}
            >
              {loading === "pin" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : announcement.is_pinned ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
            </Button>

            <AnnouncementDialog
              clubId={clubId}
              announcement={announcement}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Modifica annuncio"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-error"
              onClick={handleDelete}
              disabled={!!loading}
              aria-label="Elimina annuncio"
            >
              {loading === "delete" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** Dialog creazione/modifica annuncio */
function AnnouncementDialog({
  clubId,
  announcement,
  trigger,
}: {
  clubId: string
  announcement?: Announcement
  trigger?: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!announcement

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: announcement?.title || "",
      body: announcement?.body || "",
      is_pinned: announcement?.is_pinned || false,
      expires_at: announcement?.expires_at
        ? announcement.expires_at.substring(0, 10)
        : "",
    },
  })

  async function onSubmit(data: AnnouncementFormValues) {
    setError(null)
    const supabase = createClient()

    const payload = {
      title: data.title,
      body: data.body,
      is_pinned: data.is_pinned,
      expires_at: data.expires_at || null,
    }

    if (isEditing) {
      const { error: updateError } = await supabase
        .from("announcements")
        .update(payload)
        .eq("id", announcement.id)
        .eq("club_id", clubId)

      if (updateError) {
        setError("Errore durante l'aggiornamento.")
        return
      }
    } else {
      const { error: insertError } = await supabase
        .from("announcements")
        .insert({ ...payload, club_id: clubId })

      if (insertError) {
        setError("Errore durante la creazione.")
        return
      }
    }

    reset()
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="touch-target gap-1">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuovo annuncio
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifica annuncio" : "Nuovo annuncio"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">Titolo *</Label>
            <Input
              id="ann-title"
              placeholder="Titolo dell'annuncio"
              aria-invalid={!!errors.title}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-error" role="alert">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ann-body">Contenuto *</Label>
            <Textarea
              id="ann-body"
              placeholder="Scrivi il contenuto dell'annuncio..."
              rows={6}
              aria-invalid={!!errors.body}
              {...register("body")}
            />
            {errors.body && (
              <p className="text-sm text-error" role="alert">{errors.body.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ann-expires">Data scadenza</Label>
            <Input
              id="ann-expires"
              type="date"
              {...register("expires_at")}
            />
            <p className="text-xs text-muted-foreground">
              Lascia vuoto per non farlo scadere
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ann-pinned"
              className="h-4 w-4 rounded border-border"
              {...register("is_pinned")}
            />
            <Label htmlFor="ann-pinned" className="text-sm">
              Metti in evidenza
            </Label>
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
            ) : isEditing ? (
              "Salva modifiche"
            ) : (
              "Pubblica annuncio"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

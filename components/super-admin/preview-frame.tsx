/**
 * Frame di anteprima circolo con barra di controllo e link condivisibile.
 */
"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ExternalLink,
  Link2,
  Loader2,
  Monitor,
  Smartphone,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type PreviewClub = {
  id: string
  name: string
  slug: string
  is_active: boolean
  is_published: boolean
}

export function PreviewFrame({
  club,
  previewUrl,
}: {
  club: PreviewClub
  previewUrl: string
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const [shareResult, setShareResult] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

  async function handleShareLink() {
    setSharing(true)
    setShareResult(null)

    const response = await fetch(
      `/api/clubs/preview?club_id=${club.id}`
    )

    if (response.ok) {
      const data = await response.json()
      await navigator.clipboard.writeText(data.previewUrl)
      setShareResult("Link copiato! Valido per 24 ore.")
    } else {
      setShareResult("Errore nella generazione del link.")
    }
    setSharing(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Barra di controllo */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-lg border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/super-admin/clubs">
              <ArrowLeft className="mr-1 h-3 w-3" aria-hidden="true" />
              Circoli
            </Link>
          </Button>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{club.name}</p>
            <p className="text-xs text-muted-foreground">
              {club.slug}.prenotauncampetto.it
            </p>
          </div>
          {club.is_active ? (
            <Badge variant="default" className="bg-success">
              Attivo
            </Badge>
          ) : club.is_published ? (
            <Badge variant="secondary">Preview</Badge>
          ) : (
            <Badge variant="outline">Bozza</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle device */}
          <div className="flex rounded-md border">
            <Button
              variant={device === "desktop" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setDevice("desktop")}
              aria-label="Vista desktop"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={device === "mobile" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setDevice("mobile")}
              aria-label="Vista mobile"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>

          {/* Link condivisibile */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareLink}
            disabled={sharing}
            className="gap-1"
          >
            {sharing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Link2 className="h-3 w-3" aria-hidden="true" />
            )}
            Condividi link
          </Button>

          {/* Apri in tab */}
          <Button variant="ghost" size="sm" asChild>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>

      {/* Risultato condivisione */}
      {shareResult && (
        <div
          className="border-x bg-muted px-4 py-2 text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {shareResult}
        </div>
      )}

      {/* Iframe */}
      <div className="flex-1 overflow-hidden rounded-b-lg border border-t-0 bg-muted">
        <div
          className={`mx-auto h-full transition-all duration-300 ${
            device === "mobile" ? "max-w-[390px]" : "max-w-full"
          }`}
        >
          <iframe
            src={previewUrl}
            className="h-full w-full bg-white"
            title={`Anteprima ${club.name}`}
          />
        </div>
      </div>
    </div>
  )
}

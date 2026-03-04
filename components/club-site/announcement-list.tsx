/**
 * Componente lista annunci con card e paginazione.
 * Gestisce annunci pinnati, immagini opzionali e testo troncato.
 */
import Link from "next/link"
import Image from "next/image"
import { Pin } from "lucide-react"
import type { Announcement } from "@/lib/types/database"
import { formatDate } from "@/lib/utils/dates"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  announcements: Announcement[]
  currentPage: number
  totalPages: number
}

export function AnnouncementList({ announcements, currentPage, totalPages }: Props) {
  if (announcements.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-muted-foreground">
          Nessun annuncio al momento.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Torna a trovarci per le ultime novità!
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Lista annunci */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <AnnouncementCard key={announcement.id} announcement={announcement} />
        ))}
      </div>

      {/* Paginazione */}
      {totalPages > 1 && (
        <nav
          className="mt-8 flex items-center justify-center gap-2"
          aria-label="Paginazione annunci"
        >
          <Button
            variant="outline"
            size="sm"
            className="touch-target"
            asChild
            disabled={currentPage <= 1}
          >
            <Link
              href={`/annunci?pagina=${currentPage - 1}`}
              aria-label="Pagina precedente"
              aria-disabled={currentPage <= 1}
              tabIndex={currentPage <= 1 ? -1 : undefined}
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
            >
              &larr; Precedente
            </Link>
          </Button>

          <span
            className="px-3 text-sm text-muted-foreground"
            aria-live="polite"
          >
            Pagina {currentPage} di {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="touch-target"
            asChild
            disabled={currentPage >= totalPages}
          >
            <Link
              href={`/annunci?pagina=${currentPage + 1}`}
              aria-label="Pagina successiva"
              aria-disabled={currentPage >= totalPages}
              tabIndex={currentPage >= totalPages ? -1 : undefined}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
            >
              Successiva &rarr;
            </Link>
          </Button>
        </nav>
      )}
    </div>
  )
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <Card>
      <div className="flex flex-col sm:flex-row">
        {/* Immagine opzionale */}
        {announcement.image_url && (
          <div className="relative aspect-video w-full shrink-0 sm:aspect-square sm:w-48">
            <Image
              src={announcement.image_url}
              alt={announcement.title}
              fill
              className="rounded-t-lg object-cover sm:rounded-l-lg sm:rounded-tr-none"
              sizes="(max-width: 640px) 100vw, 192px"
            />
          </div>
        )}

        <div className="flex-1">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg leading-snug">
                  {announcement.title}
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(announcement.published_at)}
                </p>
              </div>
              {announcement.is_pinned && (
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <Pin className="h-3 w-3" aria-hidden="true" />
                  In evidenza
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-muted-foreground line-clamp-3">
              {announcement.body}
            </p>
          </CardContent>
        </div>
      </div>
    </Card>
  )
}

/**
 * Componente link social del circolo (Instagram, Facebook).
 */
import { Instagram, Facebook } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  instagram: string | null
  facebook: string | null
}

export function SocialLinks({ instagram, facebook }: Props) {
  return (
    <div className="flex gap-3">
      {instagram && (
        <Button variant="outline" size="lg" className="touch-target gap-2" asChild>
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Seguici su Instagram"
          >
            <Instagram className="h-5 w-5" aria-hidden="true" />
            Instagram
          </a>
        </Button>
      )}
      {facebook && (
        <Button variant="outline" size="lg" className="touch-target gap-2" asChild>
          <a
            href={facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Seguici su Facebook"
          >
            <Facebook className="h-5 w-5" aria-hidden="true" />
            Facebook
          </a>
        </Button>
      )}
    </div>
  )
}

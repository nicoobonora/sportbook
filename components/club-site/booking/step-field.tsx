/**
 * Step 1: Selezione struttura/campo.
 * Mostra le card dei campi disponibili con sport, nome e descrizione.
 */
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Field } from "@/lib/types/database"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

type Props = {
  fields: Field[]
  selectedField: Field | null
  onSelect: (field: Field) => void
}

export function StepField({ fields, selectedField, onSelect }: Props) {
  return (
    <div>
      <h2 className="font-display text-display-sm uppercase tracking-tight">
        Scegli la struttura
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Seleziona il campo o la struttura che vuoi prenotare
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => {
          const isSelected = selectedField?.id === field.id

          return (
            <button
              key={field.id}
              type="button"
              onClick={() => onSelect(field)}
              className="w-full text-left touch-target"
              aria-pressed={isSelected}
            >
              <Card
                className={cn(
                  "transition-all hover:shadow-md",
                  isSelected && "ring-2 ring-primary"
                )}
              >
                {/* Immagine campo (opzionale) */}
                {field.image_url && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                    <Image
                      src={field.image_url}
                      alt={`Campo ${field.name}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}

                <CardContent className={cn("space-y-2", field.image_url ? "pt-4" : "pt-6")}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold">{field.name}</h3>
                    <Badge variant="secondary" className="shrink-0 capitalize">
                      {field.sport}
                    </Badge>
                  </div>

                  {field.description && (
                    <p className="text-sm text-muted-foreground">
                      {field.description}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Capacità: {field.capacity} {field.capacity === 1 ? "persona" : "persone"}
                  </p>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Filtro sport con chip toggle per la pagina discovery.
 */
"use client"

import { SPORTS_OPTIONS, SPORT_ICONS } from "@/lib/validations/club"
import { Badge } from "@/components/ui/badge"

type SportFilterProps = {
  selected: string[]
  onChange: (sports: string[]) => void
}

export function SportFilter({ selected, onChange }: SportFilterProps) {
  function toggle(sport: string) {
    const updated = selected.includes(sport)
      ? selected.filter((s) => s !== sport)
      : [...selected, sport]
    onChange(updated)
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtra per sport">
      {SPORTS_OPTIONS.map((sport) => {
        const isActive = selected.includes(sport)
        return (
          <button
            key={sport}
            type="button"
            onClick={() => toggle(sport)}
            className="shrink-0"
            role="checkbox"
            aria-checked={isActive}
            aria-label={`Filtra: ${sport}`}
          >
            <Badge
              variant={isActive ? "default" : "outline"}
              className="cursor-pointer capitalize whitespace-nowrap"
            >
              {SPORT_ICONS[sport] && <span className="mr-0.5">{SPORT_ICONS[sport]}</span>}
              {sport}
            </Badge>
          </button>
        )
      })}

      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="shrink-0"
          aria-label="Rimuovi tutti i filtri"
        >
          <Badge variant="secondary" className="cursor-pointer">
            Tutti
          </Badge>
        </button>
      )}
    </div>
  )
}

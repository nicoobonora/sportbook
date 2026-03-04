/**
 * Bottone per generare slot da template per un circolo specifico.
 */
"use client"

import { useState } from "react"
import { Loader2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function GenerateSlotsButton({
  clubId,
  disabled,
}: {
  clubId: string
  disabled: boolean
}) {
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setResult(null)

    const response = await fetch("/api/slots/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ club_id: clubId, weeks: 4 }),
    })

    setGenerating(false)

    if (response.ok) {
      const data = await response.json()
      setResult(`Generati ${data.generated} slot per le prossime 4 settimane.`)
    } else {
      setResult("Errore nella generazione degli slot.")
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGenerate}
        disabled={disabled || generating}
        className="touch-target"
      >
        {generating ? (
          <>
            <Loader2
              className="mr-2 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
            Generazione in corso...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
            Genera slot (4 settimane)
          </>
        )}
      </Button>

      {result && (
        <p
          className="text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {result}
        </p>
      )}
    </div>
  )
}

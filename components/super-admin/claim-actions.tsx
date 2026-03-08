"use client"

/**
 * Azioni approve/reject per richieste di reclamo — componente client.
 */
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface ClaimActionsProps {
  claimId: string
  clubName: string
}

export function ClaimActions({ claimId, clubName }: ClaimActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectNotes, setRejectNotes] = useState("")

  async function handleAction(action: "approve" | "reject") {
    if (action === "reject" && !showRejectInput) {
      setShowRejectInput(true)
      return
    }

    const confirmed = window.confirm(
      action === "approve"
        ? `Vuoi approvare la richiesta per "${clubName}"? Il circolo verrà attivato.`
        : `Vuoi rifiutare la richiesta per "${clubName}"?`
    )
    if (!confirmed) return

    setLoading(action)
    try {
      const res = await fetch(`/api/clubs/claim?id=${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          review_notes: action === "reject" ? rejectNotes : undefined,
        }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        const body = await res.json()
        alert(body.error || "Errore durante l'operazione")
      }
    } catch {
      alert("Errore di rete")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
        className="bg-green-600 hover:bg-green-700"
      >
        {loading === "approve" ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-1 h-3 w-3" />
        )}
        Approva
      </Button>

      {!showRejectInput ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction("reject")}
          disabled={loading !== null}
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          <XCircle className="mr-1 h-3 w-3" />
          Rifiuta
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Motivo del rifiuto..."
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            className="h-8 rounded-md border px-2 text-sm"
          />
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction("reject")}
            disabled={loading !== null}
          >
            {loading === "reject" ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <XCircle className="mr-1 h-3 w-3" />
            )}
            Conferma rifiuto
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowRejectInput(false)}
            disabled={loading !== null}
          >
            Annulla
          </Button>
        </div>
      )}
    </div>
  )
}

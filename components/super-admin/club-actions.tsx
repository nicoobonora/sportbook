/**
 * Azioni inline per attivare/disattivare e pubblicare/depubblicare un circolo.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Power, Eye, EyeOff } from "lucide-react"
import type { Club } from "@/lib/types/database"
import { Button } from "@/components/ui/button"

export function ClubActions({ club }: { club: Club }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleToggle(field: "is_active" | "is_published") {
    setLoading(field)
    const newValue = !club[field]

    await fetch(`/api/clubs?id=${club.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: newValue }),
    })

    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-1 ml-auto">
      {/* Toggle pubblicazione */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleToggle("is_published")}
        disabled={!!loading}
        className="gap-1 text-muted-foreground"
      >
        {loading === "is_published" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : club.is_published ? (
          <EyeOff className="h-3 w-3" aria-hidden="true" />
        ) : (
          <Eye className="h-3 w-3" aria-hidden="true" />
        )}
        {club.is_published ? "Nascondi" : "Pubblica"}
      </Button>

      {/* Toggle attivazione */}
      <Button
        variant={club.is_active ? "ghost" : "default"}
        size="sm"
        onClick={() => handleToggle("is_active")}
        disabled={!!loading}
        className="gap-1"
      >
        {loading === "is_active" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Power className="h-3 w-3" aria-hidden="true" />
        )}
        {club.is_active ? "Disattiva" : "Attiva"}
      </Button>
    </div>
  )
}

/**
 * Azione inline per attivare/disattivare un circolo.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Power } from "lucide-react"
import type { Club } from "@/lib/types/database"
import { Button } from "@/components/ui/button"

export function ClubActions({ club }: { club: Club }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)

    await fetch(`/api/clubs?id=${club.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !club.is_active }),
    })

    setLoading(false)
    router.refresh()
  }

  return (
    <div className="ml-auto">
      <Button
        variant={club.is_active ? "ghost" : "default"}
        size="sm"
        onClick={handleToggle}
        disabled={loading}
        className="gap-1"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Power className="h-3 w-3" aria-hidden="true" />
        )}
        {club.is_active ? "Disattiva" : "Attiva"}
      </Button>
    </div>
  )
}

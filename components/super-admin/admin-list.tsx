/**
 * Lista admin del circolo con azione di rimozione.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils/dates"

type AdminRecord = {
  id: string
  user_id: string
  created_at: string
}

export function AdminList({
  admins,
  clubId,
}: {
  admins: AdminRecord[]
  clubId: string
}) {
  const router = useRouter()
  const [removing, setRemoving] = useState<string | null>(null)

  async function handleRemove(adminId: string) {
    if (!confirm("Rimuovere questo amministratore dal circolo?")) return
    setRemoving(adminId)

    await fetch(`/api/clubs/admins?id=${adminId}&club_id=${clubId}`, {
      method: "DELETE",
    })

    setRemoving(null)
    router.refresh()
  }

  if (admins.length === 0) {
    return (
      <div className="rounded-md bg-muted p-4 text-center">
        <Shield
          className="mx-auto h-8 w-8 text-muted-foreground/40"
          aria-hidden="true"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Nessun admin assegnato a questo circolo.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {admins.map((admin) => (
        <div
          key={admin.id}
          className="flex items-center justify-between rounded-md border px-3 py-2"
        >
          <div>
            <p className="text-sm font-medium font-mono">
              {admin.user_id.substring(0, 8)}...
            </p>
            <p className="text-xs text-muted-foreground">
              <Badge variant="outline" className="mr-1 text-[10px]">
                admin
              </Badge>
              Aggiunto il {formatDate(admin.created_at)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-error"
            onClick={() => handleRemove(admin.id)}
            disabled={removing === admin.id}
            aria-label="Rimuovi admin"
          >
            {removing === admin.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  )
}

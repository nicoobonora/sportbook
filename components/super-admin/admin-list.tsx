/**
 * Lista admin del circolo con email, password e azione di rimozione.
 * Visibile solo dal pannello super-admin.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Eye, EyeOff, Loader2, Shield, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils/dates"

type AdminRecord = {
  id: string
  user_id: string
  email?: string
  plain_password?: string | null
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
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function handleRemove(adminId: string) {
    if (!confirm("Rimuovere questo amministratore dal circolo?")) return
    setRemoving(adminId)

    await fetch(`/api/clubs/admins?id=${adminId}&club_id=${clubId}`, {
      method: "DELETE",
    })

    setRemoving(null)
    router.refresh()
  }

  function togglePassword(adminId: string) {
    setVisiblePasswords((prev) => {
      const next = new Set(prev)
      if (next.has(adminId)) {
        next.delete(adminId)
      } else {
        next.add(adminId)
      }
      return next
    })
  }

  async function handleCopyPassword(adminId: string, password: string) {
    try {
      await navigator.clipboard.writeText(password)
      setCopiedId(adminId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // noop
    }
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
      {admins.map((admin) => {
        const isPasswordVisible = visiblePasswords.has(admin.id)
        const isCopied = copiedId === admin.id

        return (
          <div
            key={admin.id}
            className="rounded-md border px-3 py-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {admin.email || (
                    <span className="font-mono text-muted-foreground">
                      {admin.user_id.substring(0, 8)}...
                    </span>
                  )}
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

            {admin.plain_password && (
              <div className="mt-2 flex items-center gap-1.5 rounded bg-muted/60 px-2 py-1.5">
                <span className="text-xs text-muted-foreground shrink-0">Password:</span>
                <code className="flex-1 font-mono text-xs text-foreground">
                  {isPasswordVisible ? admin.plain_password : "••••••••••••"}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={() => togglePassword(admin.id)}
                  aria-label={isPasswordVisible ? "Nascondi password" : "Mostra password"}
                >
                  {isPasswordVisible ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={() => handleCopyPassword(admin.id, admin.plain_password!)}
                  aria-label="Copia password"
                >
                  {isCopied ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

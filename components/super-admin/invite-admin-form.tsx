/**
 * Form per creare un admin del circolo tramite email.
 * L'admin accederà via OTP (codice email), non serve password.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function InviteAdminForm({ clubId }: { clubId: string }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setResult(null)

    const response = await fetch("/api/clubs/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, club_id: clubId }),
    })

    const data = await response.json()
    setLoading(false)

    if (response.ok) {
      setResult({
        type: "success",
        message: data.invited
          ? `Account creato e invito inviato a ${email}`
          : `${email} aggiunto come admin`,
      })
      setEmail("")
      router.refresh()
    } else {
      setResult({
        type: "error",
        message: data.error || "Errore durante la creazione",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Label htmlFor="invite-email" className="text-sm font-medium">
        Crea amministratore
      </Label>
      <div className="flex gap-2">
        <Input
          id="invite-email"
          type="email"
          placeholder="admin@esempio.it"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
          aria-describedby={result ? "invite-result" : undefined}
        />
        <Button
          type="submit"
          size="sm"
          disabled={loading || !email.trim()}
          className="gap-1 shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          )}
          Crea
        </Button>
      </div>

      {result && (
        <p
          id="invite-result"
          className={`text-sm ${
            result.type === "success" ? "text-success" : "text-error"
          }`}
          role="status"
          aria-live="polite"
        >
          {result.message}
        </p>
      )}

      {result?.type === "success" && (
        <p className="text-xs text-muted-foreground">
          L&apos;admin potrà accedere inserendo la propria email e ricevendo un codice di verifica.
        </p>
      )}
    </form>
  )
}

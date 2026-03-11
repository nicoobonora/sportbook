/**
 * Form per creare un admin del circolo tramite email.
 * Genera automaticamente una password e la mostra nel pannello.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Loader2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function InviteAdminForm({ clubId }: { clubId: string }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [result, setResult] = useState<{
    type: "success" | "error"
    message: string
    password?: string
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setResult(null)
    setCopied(false)

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
        password: data.generatedPassword || undefined,
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

  async function handleCopy() {
    if (!result?.password) return
    try {
      await navigator.clipboard.writeText(result.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: noop
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

      {result?.password && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 space-y-2">
          <p className="text-xs font-medium text-amber-800">
            Password generata — visibile solo ora
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-white px-2 py-1 font-mono text-sm text-amber-900 border border-amber-200">
              {result.password}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copiata" : "Copia"}
            </Button>
          </div>
          <p className="text-xs text-amber-700">
            Comunica queste credenziali all&apos;admin del circolo.
          </p>
        </div>
      )}
    </form>
  )
}

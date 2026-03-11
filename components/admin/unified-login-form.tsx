/**
 * Form di login unificato per admin dei circoli.
 * Dopo l'autenticazione, risolve il circolo dell'utente e fa redirect.
 */
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { loginSchema, type LoginValues } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export function UnifiedLoginForm() {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginValues) {
    setError(null)
    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      setError("Credenziali non valide. Riprova.")
      return
    }

    // Risolvi il circolo associato all'utente
    const res = await fetch("/api/auth/admin/resolve-club")
    const club = await res.json()

    if (!res.ok || !club.slug) {
      setError("Nessun circolo associato a questo account.")
      return
    }

    // Redirect al dashboard del circolo
    // window.location.hostname è il dominio root (es. prenotauncampetto.it)
    // perché la pagina di login unificata è sul dominio principale
    const hostname = window.location.hostname
    const isLocalhost =
      hostname === "localhost" || hostname === "127.0.0.1"

    if (isLocalhost) {
      window.location.href = `/club/${club.slug}/admin/dashboard`
    } else {
      window.location.href = `${window.location.protocol}//${club.slug}.${hostname}/admin/dashboard`
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@circolo.it"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-error" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-error" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div
              className="rounded-md bg-red-50 p-3 text-sm text-error"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full touch-target"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Accesso in corso...
              </>
            ) : (
              "Accedi"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

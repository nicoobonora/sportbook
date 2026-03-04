/**
 * Global error boundary.
 * Cattura errori non gestiti e li invia a Sentry.
 */
"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="it">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Si è verificato un errore
          </h1>
          <p className="mt-2 text-gray-600">
            Ci scusiamo per l&apos;inconveniente. Il problema è stato segnalato
            automaticamente.
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Riprova
          </button>
        </div>
      </body>
    </html>
  )
}

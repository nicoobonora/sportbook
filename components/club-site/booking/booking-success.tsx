/**
 * Messaggio di successo dopo l'invio della prenotazione.
 */
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type Props = {
  clubName: string
  onNewBooking: () => void
}

export function BookingSuccess({ clubName, onNewBooking }: Props) {
  return (
    <div
      className="flex flex-col items-center gap-4 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
      </div>

      <h2 className="font-display text-display-md uppercase tracking-tight">
        Richiesta inviata!
      </h2>

      <p className="max-w-md text-muted-foreground">
        La tua richiesta di prenotazione è stata inviata a <strong>{clubName}</strong>.
        Riceverai una conferma via email non appena sarà approvata.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button onClick={onNewBooking}>
          Nuova prenotazione
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Torna alla home</Link>
        </Button>
      </div>
    </div>
  )
}

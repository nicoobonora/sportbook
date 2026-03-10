/**
 * Messaggio di successo dopo l'invio della prenotazione.
 *
 * Due modalità:
 * - paidOnline = true  → Pagamento avvenuto, prenotazione auto-confermata
 * - paidOnline = false → L'utente deve controllare la propria email per confermare
 */
import { Mail, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type Props = {
  clubName: string
  userEmail?: string
  basePath?: string
  paidOnline?: boolean
  onNewBooking: () => void
}

export function BookingSuccess({ clubName, userEmail, basePath = "", paidOnline = false, onNewBooking }: Props) {
  if (paidOnline) {
    return (
      <div
        className="flex flex-col items-center gap-4 py-16 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden="true" />
        </div>

        <h2 className="font-display text-display-md uppercase tracking-tight">
          Prenotazione confermata!
        </h2>

        <div className="max-w-md space-y-2">
          <p className="text-muted-foreground">
            Il pagamento è andato a buon fine. La tua prenotazione
            presso <strong>{clubName}</strong> è confermata.
          </p>
          {userEmail && (
            <p className="text-muted-foreground">
              Riceverai una conferma via email a <strong>{userEmail}</strong>.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button onClick={onNewBooking}>
            Nuova prenotazione
          </Button>
          <Button variant="outline" asChild>
            <Link href={`${basePath}/`}>Torna alla home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center gap-4 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <Mail className="h-8 w-8 text-blue-600" aria-hidden="true" />
      </div>

      <h2 className="font-display text-display-md uppercase tracking-tight">
        Controlla la tua email
      </h2>

      <div className="max-w-md space-y-2">
        <p className="text-muted-foreground">
          Ti abbiamo inviato un&apos;email{userEmail ? (
            <> a <strong>{userEmail}</strong></>
          ) : null} con un link di conferma.
        </p>
        <p className="text-muted-foreground">
          Clicca il link nell&apos;email per confermare la tua prenotazione
          presso <strong>{clubName}</strong>. Una volta confermata, il circolo
          riceverà la tua richiesta.
        </p>
      </div>

      <div className="mt-2 rounded-lg bg-muted/50 px-6 py-3">
        <p className="text-sm text-muted-foreground">
          Non trovi l&apos;email? Controlla nella cartella spam o posta indesiderata.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button onClick={onNewBooking}>
          Nuova prenotazione
        </Button>
        <Button variant="outline" asChild>
          <Link href={`${basePath}/`}>Torna alla home</Link>
        </Button>
      </div>
    </div>
  )
}

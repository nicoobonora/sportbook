/**
 * Pagina di atterraggio dopo la verifica email della prenotazione.
 * Mostra uno stato in base al parametro ?status=...
 */
import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Conferma Prenotazione — PrenotaUnCampetto",
}

const STATUS_CONFIG: Record<
  string,
  {
    icon: typeof CheckCircle2
    iconClass: string
    bgClass: string
    title: string
    description: string
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-green-600",
    bgClass: "bg-green-100",
    title: "Email confermata!",
    description:
      "La tua prenotazione è stata verificata e inviata al circolo. Riceverai una conferma definitiva via email una volta approvata dal gestore.",
  },
  already_verified: {
    icon: Clock,
    iconClass: "text-blue-600",
    bgClass: "bg-blue-100",
    title: "Email già confermata",
    description:
      "Hai già confermato questa prenotazione. Il circolo la sta elaborando e ti contatterà a breve.",
  },
  invalid: {
    icon: XCircle,
    iconClass: "text-red-600",
    bgClass: "bg-red-100",
    title: "Link non valido",
    description:
      "Il link di conferma non è valido o è scaduto. Se hai prenotato di recente, controlla la tua email per il link corretto.",
  },
  expired: {
    icon: AlertCircle,
    iconClass: "text-amber-600",
    bgClass: "bg-amber-100",
    title: "Prenotazione scaduta",
    description:
      "Questa prenotazione non è più attiva. Potrebbe essere stata cancellata o già gestita. Prova a effettuare una nuova prenotazione.",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-600",
    bgClass: "bg-red-100",
    title: "Errore",
    description:
      "Si è verificato un errore durante la conferma. Riprova più tardi o contattaci per assistenza.",
  },
}

export default function ConfermaPrenotazionePage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const status = searchParams.status || "success"
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.error
  const Icon = config.icon

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ${config.bgClass}`}
          >
            <Icon className={`h-7 w-7 ${config.iconClass}`} />
          </div>
          <h1 className="text-xl font-semibold">{config.title}</h1>
          <p className="text-sm text-muted-foreground">{config.description}</p>
          <Button asChild className="mt-4">
            <Link href="/">Torna alla home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

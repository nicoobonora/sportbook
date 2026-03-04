/**
 * Template email: Nuova prenotazione ricevuta (inviata al club-admin).
 * Notifica il proprietario del circolo di una nuova richiesta in attesa.
 */
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

type Props = {
  clubName: string
  userName: string
  userEmail: string
  userPhone: string
  fieldName: string
  date: string
  startTime: string
  endTime: string
  notes?: string | null
  adminUrl?: string
}

export function BookingReceivedEmail({
  clubName = "Circolo Sportivo",
  userName = "Mario Rossi",
  userEmail = "mario@email.it",
  userPhone = "+39 333 1234567",
  fieldName = "Campo 1",
  date = "15 marzo 2025",
  startTime = "14:00",
  endTime = "15:00",
  notes = null,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Nuova prenotazione da {userName} — {clubName}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>
            Nuova prenotazione
          </Heading>

          <Text style={textStyle}>
            Hai ricevuto una nuova richiesta di prenotazione per <strong>{clubName}</strong>.
          </Text>

          <Section style={detailsStyle}>
            <Text style={labelStyle}>Cliente</Text>
            <Text style={valueStyle}>{userName}</Text>
            <Text style={subValueStyle}>{userEmail} · {userPhone}</Text>

            <Hr style={hrStyle} />

            <Text style={labelStyle}>Struttura</Text>
            <Text style={valueStyle}>{fieldName}</Text>

            <Hr style={hrStyle} />

            <Text style={labelStyle}>Data e orario</Text>
            <Text style={valueStyle}>{date}</Text>
            <Text style={subValueStyle}>{startTime} — {endTime}</Text>

            {notes && (
              <>
                <Hr style={hrStyle} />
                <Text style={labelStyle}>Note</Text>
                <Text style={valueStyle}>{notes}</Text>
              </>
            )}
          </Section>

          <Text style={ctaTextStyle}>
            Accedi al pannello admin per confermare o rifiutare questa prenotazione.
          </Text>

          <Hr style={hrStyle} />

          <Text style={footerStyle}>
            Questa email è stata inviata automaticamente da SportBook.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default BookingReceivedEmail

// ── Stili inline (necessari per compatibilità email client) ──
const bodyStyle = {
  backgroundColor: "#f8f9fa",
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: "0" as const,
  padding: "0" as const,
}

const containerStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  margin: "40px auto" as const,
  maxWidth: "560px",
  padding: "32px",
}

const headingStyle = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "700" as const,
  margin: "0 0 16px" as const,
}

const textStyle = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0 0 16px" as const,
}

const detailsStyle = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0" as const,
}

const labelStyle = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "500" as const,
  textTransform: "uppercase" as const,
  margin: "0 0 4px" as const,
}

const valueStyle = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: "600" as const,
  margin: "0" as const,
}

const subValueStyle = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "2px 0 0" as const,
}

const hrStyle = {
  borderColor: "#e5e7eb",
  margin: "12px 0" as const,
}

const ctaTextStyle = {
  color: "#1d4ed8",
  fontSize: "14px",
  fontWeight: "500" as const,
  margin: "16px 0" as const,
}

const footerStyle = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0" as const,
}

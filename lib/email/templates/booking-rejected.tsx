/**
 * Template email: Prenotazione rifiutata (inviata all'utente).
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
  fieldName: string
  date: string
  startTime: string
  endTime: string
  reason?: string | null
}

export function BookingRejectedEmail({
  clubName = "Circolo Sportivo",
  userName = "Mario Rossi",
  fieldName = "Campo 1",
  date = "15 marzo 2025",
  startTime = "14:00",
  endTime = "15:00",
  reason = null,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Prenotazione presso {clubName} non disponibile</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>
            Prenotazione non disponibile
          </Heading>

          <Text style={textStyle}>
            Ciao <strong>{userName}</strong>,
          </Text>
          <Text style={textStyle}>
            Purtroppo la tua prenotazione presso <strong>{clubName}</strong> non è stata accettata.
          </Text>

          <Section style={detailsStyle}>
            <Text style={labelStyle}>Struttura</Text>
            <Text style={valueStyle}>{fieldName}</Text>

            <Hr style={hrStyle} />

            <Text style={labelStyle}>Data e orario</Text>
            <Text style={valueStyle}>{date} · {startTime} — {endTime}</Text>

            {reason && (
              <>
                <Hr style={hrStyle} />
                <Text style={labelStyle}>Motivo</Text>
                <Text style={valueStyle}>{reason}</Text>
              </>
            )}
          </Section>

          <Text style={textStyle}>
            Ti invitiamo a provare con un altro orario o giorno.
          </Text>

          <Hr style={hrStyle} />

          <Text style={footerStyle}>
            Questa email è stata inviata automaticamente da SportBook per conto di {clubName}.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default BookingRejectedEmail

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
  margin: "0 0 8px" as const,
}

const detailsStyle = {
  backgroundColor: "#fef2f2",
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

const hrStyle = {
  borderColor: "#e5e7eb",
  margin: "12px 0" as const,
}

const footerStyle = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0" as const,
}

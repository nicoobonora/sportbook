/**
 * Template email: Prenotazione confermata (inviata all'utente).
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
  clubAddress?: string | null
  clubPhone?: string | null
}

export function BookingConfirmedEmail({
  clubName = "Circolo Sportivo",
  userName = "Mario Rossi",
  fieldName = "Campo 1",
  date = "15 marzo 2025",
  startTime = "14:00",
  endTime = "15:00",
  clubAddress = null,
  clubPhone = null,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>La tua prenotazione presso {clubName} è confermata!</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={emojiStyle}>✅</Text>

          <Heading style={headingStyle}>
            Prenotazione confermata!
          </Heading>

          <Text style={textStyle}>
            Ciao <strong>{userName}</strong>,
          </Text>
          <Text style={textStyle}>
            La tua prenotazione presso <strong>{clubName}</strong> è stata confermata.
          </Text>

          <Section style={detailsStyle}>
            <Text style={labelStyle}>Struttura</Text>
            <Text style={valueStyle}>{fieldName}</Text>

            <Hr style={hrStyle} />

            <Text style={labelStyle}>Data</Text>
            <Text style={valueStyle}>{date}</Text>

            <Hr style={hrStyle} />

            <Text style={labelStyle}>Orario</Text>
            <Text style={valueStyle}>{startTime} — {endTime}</Text>
          </Section>

          {(clubAddress || clubPhone) && (
            <Section>
              <Text style={labelStyle}>Come raggiungerci</Text>
              {clubAddress && <Text style={textStyle}>{clubAddress}</Text>}
              {clubPhone && <Text style={textStyle}>Tel: {clubPhone}</Text>}
            </Section>
          )}

          <Text style={textStyle}>
            Ti aspettiamo!
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

export default BookingConfirmedEmail

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

const emojiStyle = {
  fontSize: "40px",
  margin: "0 0 8px" as const,
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
  backgroundColor: "#f0fdf4",
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

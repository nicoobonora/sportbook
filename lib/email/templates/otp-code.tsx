/**
 * Template email: Codice OTP per il login.
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
  code: string
}

export function OtpCodeEmail({ code = "000000" }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Il tuo codice di accesso è {code}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Codice di accesso</Heading>

          <Text style={textStyle}>
            Usa il codice qui sotto per accedere al pannello admin di
            PrenotaUnCampetto.
          </Text>

          <Section style={codeContainerStyle}>
            <Text style={codeStyle}>{code}</Text>
          </Section>

          <Text style={textStyle}>
            Questo codice scade tra <strong>10 minuti</strong>.
          </Text>

          <Text style={textStyle}>
            Se non hai richiesto questo codice, puoi ignorare questa email.
          </Text>

          <Hr style={hrStyle} />

          <Text style={footerStyle}>
            Questa email è stata inviata automaticamente da PrenotaUnCampetto.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default OtpCodeEmail

const bodyStyle = {
  backgroundColor: "#f8f9fa",
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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

const codeContainerStyle = {
  backgroundColor: "#f0f9ff",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0" as const,
  textAlign: "center" as const,
}

const codeStyle = {
  color: "#1D4ED8",
  fontSize: "36px",
  fontWeight: "700" as const,
  fontFamily: "monospace",
  letterSpacing: "8px",
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

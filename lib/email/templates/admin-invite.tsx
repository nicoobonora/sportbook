/**
 * Template email: Invito admin circolo.
 */
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"

type Props = {
  clubName: string
  inviteUrl: string
}

export function AdminInviteEmail({
  clubName = "Circolo Sportivo",
  inviteUrl = "http://localhost:3000/admin/login",
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        Sei stato invitato come admin di {clubName} su SportBook
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Invito Amministratore</Heading>

          <Text style={textStyle}>Ciao,</Text>
          <Text style={textStyle}>
            Sei stato invitato come amministratore del circolo{" "}
            <strong>{clubName}</strong> sulla piattaforma SportBook.
          </Text>

          <Section style={detailsStyle}>
            <Text style={labelStyle}>Circolo</Text>
            <Text style={valueStyle}>{clubName}</Text>

            <Hr style={hrStyle} />

            <Text style={labelStyle}>Ruolo</Text>
            <Text style={valueStyle}>Amministratore</Text>
          </Section>

          <Text style={textStyle}>
            Per accettare l&apos;invito, registrati o accedi alla piattaforma
            cliccando il link qui sotto:
          </Text>

          <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
            <Link href={inviteUrl} style={buttonStyle}>
              Accedi al pannello admin
            </Link>
          </Section>

          <Text style={textStyle}>
            Se non hai richiesto questo invito, puoi ignorare questa email.
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

export default AdminInviteEmail

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

const detailsStyle = {
  backgroundColor: "#f0f9ff",
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

const buttonStyle = {
  backgroundColor: "#1D4ED8",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block" as const,
  fontSize: "14px",
  fontWeight: "600" as const,
  padding: "12px 24px",
  textDecoration: "none" as const,
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

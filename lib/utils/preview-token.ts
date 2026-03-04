/**
 * Utility per la generazione e verifica di token di anteprima.
 * I token sono firmati con HMAC-SHA256 e scadono dopo 24 ore.
 */

const getSecret = () =>
  process.env.PREVIEW_TOKEN_SECRET || "sportbook-preview-secret"

/** Genera un token di anteprima per un circolo */
export async function createPreviewToken(
  clubId: string,
  slug: string
): Promise<string> {
  const secret = getSecret()
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 ore
  const payload = `${clubId}:${slug}:${expiresAt}`

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  )
  const sig = Buffer.from(signature).toString("base64url")

  return Buffer.from(`${payload}:${sig}`).toString("base64url")
}

/** Verifica un token di anteprima e restituisce i dati del circolo */
export async function verifyPreviewToken(
  token: string
): Promise<{ clubId: string; slug: string } | null> {
  try {
    const secret = getSecret()
    const decoded = Buffer.from(token, "base64url").toString()
    const parts = decoded.split(":")

    if (parts.length !== 4) return null

    const [clubId, slug, expiresAtStr, sig] = parts
    const expiresAt = parseInt(expiresAtStr, 10)

    if (Date.now() > expiresAt) return null

    const payload = `${clubId}:${slug}:${expiresAtStr}`
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    )
    const sigBytes = Buffer.from(sig, "base64url")
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(payload)
    )

    if (!valid) return null
    return { clubId, slug }
  } catch {
    return null
  }
}

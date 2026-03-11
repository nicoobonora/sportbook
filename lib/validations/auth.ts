/**
 * Schemi Zod per la validazione dell'autenticazione.
 */
import { z } from "zod"

/** Schema per lo step email del login OTP */
export const loginEmailSchema = z.object({
  email: z.string().email("Inserisci un indirizzo email valido"),
})

export type LoginEmailValues = z.infer<typeof loginEmailSchema>

/** Schema per lo step OTP del login */
export const loginOtpSchema = z.object({
  email: z.string().email("Inserisci un indirizzo email valido"),
  token: z.string().length(6, "Il codice deve essere di 6 cifre"),
})

export type LoginOtpValues = z.infer<typeof loginOtpSchema>

/**
 * @deprecated — Mantenuto per retrocompatibilità.
 * Usa loginEmailSchema + loginOtpSchema per il nuovo flow OTP.
 */
export const loginSchema = z.object({
  email: z.string().email("Inserisci un indirizzo email valido"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
})

export type LoginValues = z.infer<typeof loginSchema>

/**
 * Utility per la gestione delle date.
 * Tutte le date usano il locale italiano e timezone Europe/Rome.
 */
import { format, formatRelative, isAfter, isBefore, parseISO } from "date-fns"
import { it } from "date-fns/locale"

/** Formatta una data in formato leggibile italiano: "15 marzo 2025" */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "d MMMM yyyy", { locale: it })
}

/** Formatta una data breve: "15 mar" */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "d MMM", { locale: it })
}

/** Formatta un orario: "14:30" */
export function formatTime(time: string): string {
  // time arriva come "HH:MM:SS" o "HH:MM" da PostgreSQL
  return time.substring(0, 5)
}

/** Formatta data e ora insieme: "15 marzo 2025 alle 14:30" */
export function formatDateTime(date: string | Date, time: string): string {
  return `${formatDate(date)} alle ${formatTime(time)}`
}

/** Formatta una data relativa: "ieri", "2 giorni fa", ecc. */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return formatRelative(d, new Date(), { locale: it })
}

/** Nomi dei giorni della settimana (0=domenica) */
export const DAYS_OF_WEEK = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
] as const

/** Nomi brevi dei giorni */
export const DAYS_OF_WEEK_SHORT = [
  "Dom",
  "Lun",
  "Mar",
  "Mer",
  "Gio",
  "Ven",
  "Sab",
] as const

/** Controlla se una data è passata */
export function isPast(date: string | Date): boolean {
  const d = typeof date === "string" ? parseISO(date) : date
  return isBefore(d, new Date())
}

/** Controlla se una data è futura */
export function isFuture(date: string | Date): boolean {
  const d = typeof date === "string" ? parseISO(date) : date
  return isAfter(d, new Date())
}

/** Formatta il prezzo in centesimi come stringa euro */
export function formatPrice(cents: number): string {
  if (cents === 0) return "Gratuito"
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

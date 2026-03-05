/**
 * Costanti per il sistema di scheduling.
 * Il template di default (09:00–19:00, 1 ora) viene usato
 * quando un campo non ha template personalizzati per un dato giorno.
 */

export const DEFAULT_TEMPLATE = {
  startHour: 9,
  endHour: 19,
  durationMinutes: 60,
  priceCents: 0,
  maxBookings: 1,
} as const

/** Opzioni durata per la creazione di template */
export const DURATION_OPTIONS = [
  { value: 30, label: "30 minuti" },
  { value: 60, label: "1 ora" },
  { value: 90, label: "1 ora 30 min" },
] as const

/** Genera gli slot di default per un giorno (09:00–19:00, 1hr) */
export function generateDefaultSlots() {
  const slots: Array<{
    start_time: string
    end_time: string
    price_cents: number
    max_bookings: number
  }> = []

  for (let h = DEFAULT_TEMPLATE.startHour; h < DEFAULT_TEMPLATE.endHour; h += DEFAULT_TEMPLATE.durationMinutes / 60) {
    const startH = Math.floor(h)
    const startM = (h % 1) * 60
    const endMinutes = startH * 60 + startM + DEFAULT_TEMPLATE.durationMinutes
    const endH = Math.floor(endMinutes / 60)
    const endM = endMinutes % 60

    if (endH > DEFAULT_TEMPLATE.endHour) break

    slots.push({
      start_time: `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`,
      end_time: `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`,
      price_cents: DEFAULT_TEMPLATE.priceCents,
      max_bookings: DEFAULT_TEMPLATE.maxBookings,
    })
  }

  return slots
}

/**
 * Genera slot consecutivi per un giorno con una durata specifica.
 * Usata quando l'admin crea template personalizzati.
 */
export function generateSlotsForDuration(durationMinutes: number) {
  const slots: Array<{ start_time: string; end_time: string }> = []
  let currentMinutes = DEFAULT_TEMPLATE.startHour * 60

  while (currentMinutes + durationMinutes <= DEFAULT_TEMPLATE.endHour * 60) {
    const startH = Math.floor(currentMinutes / 60)
    const startM = currentMinutes % 60
    const endMinutes = currentMinutes + durationMinutes
    const endH = Math.floor(endMinutes / 60)
    const endM = endMinutes % 60

    slots.push({
      start_time: `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`,
      end_time: `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`,
    })

    currentMinutes += durationMinutes
  }

  return slots
}

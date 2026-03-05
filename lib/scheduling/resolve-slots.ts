/**
 * Logica di risoluzione degli slot.
 * Priorità: default template → custom templates → blocchi.
 */

import { generateDefaultSlots } from "@/lib/constants/scheduling"

export type ResolvedSlot = {
  start_time: string
  end_time: string
  price_cents: number
  max_bookings: number
}

type BlockInput = {
  block_type: "single_date" | "recurring"
  block_date: string | null
  day_of_week: number | null
  start_time: string | null
  end_time: string | null
}

type TemplateInput = {
  start_time: string
  end_time: string
  price_cents: number
  max_bookings: number
}

/**
 * Risolve gli slot disponibili per una data e campo specifico.
 *
 * 1. Se ci sono template personalizzati per questo field+dayOfWeek → usa quelli
 * 2. Altrimenti → usa il template di default (09:00–19:00, 1hr)
 * 3. Filtra gli slot che cadono in un blocco attivo
 */
export function resolveSlots(
  dateStr: string,
  dayOfWeek: number,
  customTemplates: TemplateInput[],
  blocks: BlockInput[],
): ResolvedSlot[] {
  // Layer 1: default o custom
  const baseSlots: ResolvedSlot[] =
    customTemplates.length > 0
      ? customTemplates.map((t) => ({
          start_time: t.start_time,
          end_time: t.end_time,
          price_cents: t.price_cents,
          max_bookings: t.max_bookings,
        }))
      : generateDefaultSlots()

  // Layer 2: filtra i blocchi applicabili
  const applicableBlocks = blocks.filter((b) => {
    if (b.block_type === "single_date") {
      return b.block_date === dateStr
    }
    if (b.block_type === "recurring") {
      return b.day_of_week === dayOfWeek
    }
    return false
  })

  if (applicableBlocks.length === 0) return baseSlots

  return baseSlots.filter((slot) => {
    return !applicableBlocks.some((block) => {
      // Blocco intera giornata
      if (!block.start_time || !block.end_time) return true
      // Blocco con fascia oraria: controlla sovrapposizione
      return slot.start_time < block.end_time && slot.end_time > block.start_time
    })
  })
}

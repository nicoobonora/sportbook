/**
 * Calcolo disponibilità per prenotazioni flessibili.
 *
 * Determina le finestre temporali disponibili per un campo in una data,
 * tenendo conto di: fasce di apertura, blocchi admin, prenotazioni esistenti.
 */

export type TimeRange = {
  start: string // HH:MM
  end: string   // HH:MM
}

export type AvailabilityResult = {
  /** Fasce di apertura definite dall'admin */
  openingRanges: TimeRange[]
  /** Prenotazioni confermate o in attesa */
  bookings: Array<TimeRange & { id: string; status: string; user_name: string }>
  /** Blocchi admin attivi */
  blocks: Array<TimeRange & { reason: string | null }>
  /** Finestre effettivamente disponibili (apertura - blocchi - prenotazioni confermate) */
  availableWindows: TimeRange[]
}

export type BookingPreview = {
  startTime: string  // HH:MM
  maxEndTime: string // HH:MM
  maxDurationMinutes: number
}

// ── Utilità per confronto orari ──

/** Converte "HH:MM" in minuti dal midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.substring(0, 5).split(":").map(Number)
  return h * 60 + m
}

/** Converte minuti dal midnight in "HH:MM" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** Controlla se due range si sovrappongono */
function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && a.end > b.start
}

/**
 * Sottrae un insieme di intervalli da un insieme di finestre.
 * Restituisce le finestre rimanenti dopo aver rimosso tutti gli intervalli.
 */
function subtractRanges(windows: TimeRange[], toSubtract: TimeRange[]): TimeRange[] {
  let result = [...windows]

  for (const sub of toSubtract) {
    const newResult: TimeRange[] = []

    for (const window of result) {
      if (!rangesOverlap(window, sub)) {
        // Nessuna sovrapposizione, mantieni la finestra
        newResult.push(window)
      } else {
        // Parte prima della sottrazione
        if (window.start < sub.start) {
          newResult.push({ start: window.start, end: sub.start })
        }
        // Parte dopo la sottrazione
        if (window.end > sub.end) {
          newResult.push({ start: sub.end, end: window.end })
        }
      }
    }

    result = newResult
  }

  return result
}

/**
 * Calcola le finestre disponibili per un campo in una data.
 *
 * Algoritmo:
 * 1. Prendi le fasce di apertura per il giorno della settimana
 * 2. Sottrai i blocchi admin applicabili
 * 3. Sottrai le prenotazioni confermate
 */
export function computeAvailability(
  openingHours: Array<{ start_time: string; end_time: string }>,
  blocks: Array<{
    block_type: "single_date" | "recurring"
    block_date: string | null
    day_of_week: number | null
    start_time: string | null
    end_time: string | null
    reason: string | null
  }>,
  confirmedBookings: Array<{
    id: string
    start_time: string
    end_time: string
    status: string
    user_name: string
  }>,
  dateStr: string,
  dayOfWeek: number,
): AvailabilityResult {
  // 1. Fasce di apertura
  const openingRanges: TimeRange[] = openingHours
    .map((oh) => ({
      start: oh.start_time.substring(0, 5),
      end: oh.end_time.substring(0, 5),
    }))
    .sort((a, b) => a.start.localeCompare(b.start))

  // 2. Blocchi applicabili
  const applicableBlocks = blocks.filter((b) => {
    if (b.block_type === "single_date") return b.block_date === dateStr
    if (b.block_type === "recurring") return b.day_of_week === dayOfWeek
    return false
  })

  const blockRanges: Array<TimeRange & { reason: string | null }> = applicableBlocks.map((b) => ({
    start: b.start_time?.substring(0, 5) ?? "00:00",
    end: b.end_time?.substring(0, 5) ?? "23:59",
    reason: b.reason,
  }))

  // 3. Prenotazioni confermate (escludi cancelled e rejected)
  const activeBookings = confirmedBookings
    .filter((b) => b.status === "confirmed" || b.status === "pending")
    .map((b) => ({
      id: b.id,
      start: b.start_time.substring(0, 5),
      end: b.end_time.substring(0, 5),
      status: b.status,
      user_name: b.user_name,
    }))

  // 4. Calcola finestre disponibili
  //    apertura - blocchi - prenotazioni confermate
  const afterBlocks = subtractRanges(openingRanges, blockRanges)
  const confirmedOnly = activeBookings
    .filter((b) => b.status === "confirmed")
    .map((b) => ({ start: b.start, end: b.end }))
  const availableWindows = subtractRanges(afterBlocks, confirmedOnly)

  return {
    openingRanges,
    bookings: activeBookings,
    blocks: blockRanges,
    availableWindows,
  }
}

/**
 * Calcola l'anteprima della prenotazione: durata massima da un orario di inizio.
 *
 * La durata massima si ferma al primo di:
 * - Fine della fascia di apertura
 * - Prossima prenotazione confermata
 * - Prossimo blocco admin
 */
export function computeBookingPreview(
  startTime: string,
  availability: AvailabilityResult,
): BookingPreview | null {
  const start = startTime.substring(0, 5)

  // Trova la finestra disponibile che contiene lo start time
  const window = availability.availableWindows.find(
    (w) => w.start <= start && w.end > start
  )

  if (!window) return null

  // Il max end time è la fine della finestra disponibile
  // (che già tiene conto di blocchi e prenotazioni confermate)
  const maxEndTime = window.end
  const durationMinutes = timeToMinutes(maxEndTime) - timeToMinutes(start)

  return {
    startTime: start,
    maxEndTime,
    maxDurationMinutes: durationMinutes,
  }
}

/**
 * Genera gli orari di inizio selezionabili dall'utente.
 * Basato sulle finestre disponibili con granularità configurabile.
 */
export function generateStartTimes(
  availableWindows: TimeRange[],
  granularityMinutes: number = 30,
  minDurationMinutes: number = 30,
): string[] {
  const startTimes: string[] = []

  for (const window of availableWindows) {
    const windowStart = timeToMinutes(window.start)
    const windowEnd = timeToMinutes(window.end)

    // Lo start time deve lasciare almeno minDurationMinutes prima della fine della finestra
    for (let t = windowStart; t + minDurationMinutes <= windowEnd; t += granularityMinutes) {
      startTimes.push(minutesToTime(t))
    }
  }

  return startTimes
}

/**
 * Genera le opzioni di durata disponibili da un orario di inizio.
 */
export function generateDurationOptions(
  startTime: string,
  maxEndTime: string,
  granularityMinutes: number = 30,
  minDurationMinutes: number = 30,
): Array<{ minutes: number; endTime: string; label: string }> {
  const start = timeToMinutes(startTime)
  const maxEnd = timeToMinutes(maxEndTime)
  const options: Array<{ minutes: number; endTime: string; label: string }> = []

  for (let duration = minDurationMinutes; start + duration <= maxEnd; duration += granularityMinutes) {
    const endTime = minutesToTime(start + duration)
    const hours = Math.floor(duration / 60)
    const mins = duration % 60
    let label: string
    if (hours === 0) {
      label = `${mins} min`
    } else if (mins === 0) {
      label = hours === 1 ? "1 ora" : `${hours} ore`
    } else {
      label = `${hours}h ${mins}min`
    }

    options.push({ minutes: duration, endTime, label })
  }

  return options
}

/**
 * Calcola il prezzo di una prenotazione in base alla durata e al prezzo orario.
 */
export function calculateBookingPrice(
  startTime: string,
  endTime: string,
  openingHours: Array<{ start_time: string; end_time: string; price_per_hour_cents: number }>,
): number {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  const durationMinutes = end - start

  if (durationMinutes <= 0) return 0

  // Trova la fascia di apertura che contiene lo start time
  const oh = openingHours.find((o) => {
    const ohStart = timeToMinutes(o.start_time)
    const ohEnd = timeToMinutes(o.end_time)
    return start >= ohStart && start < ohEnd
  })

  if (!oh || oh.price_per_hour_cents === 0) return 0

  // Prezzo proporzionale alla durata
  return Math.round((oh.price_per_hour_cents * durationMinutes) / 60)
}
